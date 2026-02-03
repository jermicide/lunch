const {
    signUrl,
    createErrorResponse,
    createSuccessResponse,
    validateEnvVars,
    safeLog,
    sanitizeObject
} = require('./utils');

describe('API Utilities', () => {
    describe('signUrl', () => {
        test('should sign a URL with valid secret', () => {
            const url = 'https://example.com/api?key=value';
            const secret = Buffer.from('test-secret').toString('base64');

            const signedUrl = signUrl(url, secret);

            expect(signedUrl).toContain('signature=');
            expect(signedUrl).toContain('&signature=');
        });

        test('should throw error for invalid URL', () => {
            const invalid = 'not a url';
            const secret = Buffer.from('test-secret').toString('base64');

            expect(() => signUrl(invalid, secret)).toThrow();
        });

        test('should handle invalid base64 gracefully', () => {
            const url = 'https://example.com/api?key=value';
            // Note: Node.js Buffer.from() is lenient with base64, so we test that function doesn't throw
            // but an actual invalid base64 string won't produce a proper signature
            const result = signUrl(url, '!@#$%^&*()_+=invalid');
            expect(result).toBeDefined();
        });

        test('should include original URL in signed URL', () => {
            const url = 'https://example.com/api?key=value';
            const secret = Buffer.from('test-secret').toString('base64');

            const signedUrl = signUrl(url, secret);

            expect(signedUrl).toContain('key=value');
        });
    });

    describe('createErrorResponse', () => {
        test('should create error response with status and error', () => {
            const response = createErrorResponse(400, 'Invalid input');

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid input');
        });

        test('should include optional message', () => {
            const response = createErrorResponse(500, 'Server error', 'Database connection failed');

            expect(response.body.message).toBe('Database connection failed');
        });

        test('should not include message when not provided', () => {
            const response = createErrorResponse(400, 'Bad request');

            expect(response.body.message).toBeUndefined();
        });

        test('should handle various status codes', () => {
            expect(createErrorResponse(400, 'Bad Request').status).toBe(400);
            expect(createErrorResponse(401, 'Unauthorized').status).toBe(401);
            expect(createErrorResponse(403, 'Forbidden').status).toBe(403);
            expect(createErrorResponse(404, 'Not found').status).toBe(404);
            expect(createErrorResponse(500, 'Internal error').status).toBe(500);
        });
    });

    describe('createSuccessResponse', () => {
        test('should create success response with default status 200', () => {
            const response = createSuccessResponse({ data: 'test' });

            expect(response.status).toBe(200);
            expect(response.body.data).toBe('test');
        });

        test('should create success response with custom status', () => {
            const response = createSuccessResponse({ data: 'test' }, 201);

            expect(response.status).toBe(201);
        });

        test('should include CORS headers', () => {
            const response = createSuccessResponse({ data: 'test' });

            expect(response.headers['Content-Type']).toBe('application/json');
            expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
        });

        test('should handle array data', () => {
            const data = [1, 2, 3];
            const response = createSuccessResponse(data);

            expect(response.body).toEqual(data);
        });

        test('should handle object data', () => {
            const data = { places: [] };
            const response = createSuccessResponse(data);

            expect(response.body.places).toEqual([]);
        });
    });

    describe('validateEnvVars', () => {
        beforeEach(() => {
            delete process.env.TEST_VAR;
            delete process.env.ANOTHER_VAR;
        });

        test('should return true when all required vars are set', () => {
            process.env.TEST_VAR = 'value';
            process.env.ANOTHER_VAR = 'value';

            const result = validateEnvVars(['TEST_VAR', 'ANOTHER_VAR']);

            expect(result).toBe(true);
        });

        test('should throw error when required vars are missing', () => {
            process.env.TEST_VAR = 'value';

            expect(() => validateEnvVars(['TEST_VAR', 'MISSING_VAR'])).toThrow();
        });

        test('should throw error with missing variable names', () => {
            expect(() => validateEnvVars(['MISSING_VAR_1', 'MISSING_VAR_2'])).toThrow(
                /MISSING_VAR_1.*MISSING_VAR_2/
            );
        });

        test('should accept empty array', () => {
            const result = validateEnvVars([]);

            expect(result).toBe(true);
        });
    });

    describe('sanitizeObject', () => {
        test('should redact keys containing "key"', () => {
            const obj = { api_key: 'secret', name: 'test' };
            const sanitized = sanitizeObject(obj);

            expect(sanitized.api_key).toBe('***REDACTED***');
            expect(sanitized.name).toBe('test');
        });

        test('should redact keys containing "secret"', () => {
            const obj = { secret: 'value', data: 'public' };
            const sanitized = sanitizeObject(obj);

            expect(sanitized.secret).toBe('***REDACTED***');
            expect(sanitized.data).toBe('public');
        });

        test('should redact keys containing "password"', () => {
            const obj = { password: 'secret123', username: 'user' };
            const sanitized = sanitizeObject(obj);

            expect(sanitized.password).toBe('***REDACTED***');
            expect(sanitized.username).toBe('user');
        });

        test('should redact keys containing "token"', () => {
            const obj = { access_token: 'abc123', id: '123' };
            const sanitized = sanitizeObject(obj);

            expect(sanitized.access_token).toBe('***REDACTED***');
            expect(sanitized.id).toBe('123');
        });

        test('should be case insensitive', () => {
            const obj = { API_KEY: 'secret', ApiSecret: 'value' };
            const sanitized = sanitizeObject(obj);

            expect(sanitized.API_KEY).toBe('***REDACTED***');
            expect(sanitized.ApiSecret).toBe('***REDACTED***');
        });

        test('should handle nested objects', () => {
            const obj = {
                user: {
                    name: 'John',
                    password: 'secret'
                },
                api_key: 'key123'
            };
            const sanitized = sanitizeObject(obj);

            expect(sanitized.api_key).toBe('***REDACTED***');
            expect(sanitized.user.password).toBe('***REDACTED***');
            expect(sanitized.user.name).toBe('John');
        });

        test('should handle arrays', () => {
            const arr = [
                { password: 'secret' },
                { name: 'test' }
            ];
            const sanitized = sanitizeObject(arr);

            expect(sanitized[0].password).toBe('***REDACTED***');
            expect(sanitized[1].name).toBe('test');
        });

        test('should return primitives unchanged', () => {
            expect(sanitizeObject('string')).toBe('string');
            expect(sanitizeObject(123)).toBe(123);
            expect(sanitizeObject(true)).toBe(true);
            expect(sanitizeObject(null)).toBe(null);
        });

        test('should not modify original object', () => {
            const original = { api_key: 'secret', name: 'test' };
            const originalCopy = { ...original };
            const sanitized = sanitizeObject(original);

            expect(original).toEqual(originalCopy);
            expect(sanitized.api_key).not.toBe(original.api_key);
        });
    });

    describe('safeLog', () => {
        let mockLogger;

        beforeEach(() => {
            mockLogger = {
                log: jest.fn(),
                error: jest.fn(),
                warn: jest.fn()
            };
        });

        test('should call logger with message', () => {
            safeLog(mockLogger, 'log', 'Test message');

            expect(mockLogger.log).toHaveBeenCalledWith('Test message');
        });

        test('should sanitize data before logging', () => {
            safeLog(mockLogger, 'log', 'User data', { username: 'john', password: 'secret' });

            const callArgs = mockLogger.log.mock.calls[0][0];
            expect(callArgs).toContain('***REDACTED***');
            expect(callArgs).not.toContain('secret');
        });

        test('should support error level', () => {
            safeLog(mockLogger, 'error', 'Error occurred');

            expect(mockLogger.error).toHaveBeenCalled();
        });

        test('should support warn level', () => {
            safeLog(mockLogger, 'warn', 'Warning');

            expect(mockLogger.warn).toHaveBeenCalled();
        });

        test('should fall back to default log function if level not found', () => {
            const customLogger = jest.fn();
            customLogger.log = jest.fn();

            safeLog(customLogger, 'nonexistent', 'Test');

            expect(customLogger).toHaveBeenCalled();
        });
    });
});
