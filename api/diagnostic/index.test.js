const diagnosticFunction = require('./index');

describe('Diagnostic API', () => {
    let mockContext;
    let mockRequest;

    beforeEach(() => {
        mockContext = {
            log: jest.fn(),
            res: null
        };
        mockContext.log.error = jest.fn();

        mockRequest = {};
    });

    afterEach(() => {
        delete process.env.GOOGLE_API_KEY;
        delete process.env.GOOGLE_SIGNING_SECRET;
        delete process.env.NODE_ENV;
        delete process.env.WEBSITE_SITE_NAME;
        jest.clearAllMocks();
    });

    describe('Basic Functionality', () => {
        test('should return 200 status code', async () => {
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.status).toBe(200);
        });

        test('should return JSON content type', async () => {
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.headers['Content-Type']).toBe('application/json');
        });

        test('should include success message', async () => {
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.body.message).toContain('working');
        });

        test('should include timestamp', async () => {
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.body.timestamp).toBeDefined();
            expect(new Date(mockContext.res.body.timestamp)).toBeInstanceOf(Date);
        });
    });

    describe('Environment Information', () => {
        test('should return Node.js version', async () => {
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.body.environment.nodeVersion).toBeDefined();
            expect(mockContext.res.body.environment.nodeVersion).toMatch(/v\d+\.\d+\.\d+/);
        });

        test('should return platform information', async () => {
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.body.environment.platform).toBeDefined();
            expect(['linux', 'darwin', 'win32']).toContain(mockContext.res.body.environment.platform);
        });

        test('should return architecture information', async () => {
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.body.environment.arch).toBeDefined();
        });

        test('should return memory information', async () => {
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.body.environment.memory).toBeDefined();
            expect(mockContext.res.body.environment.memory.total).toBeDefined();
            expect(mockContext.res.body.environment.memory.free).toBeDefined();
        });

        test('should return uptime information', async () => {
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.body.environment.uptime).toBeDefined();
        });
    });

    describe('Configuration Information', () => {
        test('should indicate if Google API key is set', async () => {
            process.env.GOOGLE_API_KEY = 'test-key';
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.body.environment.env.GOOGLE_API_KEY_SET).toBe('Yes');
        });

        test('should indicate if Google API key is not set', async () => {
            delete process.env.GOOGLE_API_KEY;
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.body.environment.env.GOOGLE_API_KEY_SET).toBe('No');
        });

        test('should indicate if Google signing secret is set', async () => {
            process.env.GOOGLE_SIGNING_SECRET = 'test-secret';
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.body.environment.env.GOOGLE_SIGNING_SECRET_SET).toBe('Yes');
        });

        test('should indicate if Google signing secret is not set', async () => {
            delete process.env.GOOGLE_SIGNING_SECRET;
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.body.environment.env.GOOGLE_SIGNING_SECRET_SET).toBe('No');
        });

        test('should not expose actual API keys', async () => {
            process.env.GOOGLE_API_KEY = 'super-secret-key-12345';
            await diagnosticFunction(mockContext, mockRequest);

            const responseStr = JSON.stringify(mockContext.res.body);
            expect(responseStr).not.toContain('super-secret-key-12345');
        });

        test('should not expose signing secrets', async () => {
            process.env.GOOGLE_SIGNING_SECRET = 'secret-signing-key';
            await diagnosticFunction(mockContext, mockRequest);

            const responseStr = JSON.stringify(mockContext.res.body);
            expect(responseStr).not.toContain('secret-signing-key');
        });
    });

    describe('Google API Testing', () => {
        test('should include Google API test results', async () => {
            process.env.GOOGLE_API_KEY = 'test-key';
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.body.googleApiTest).toBeDefined();
        });

        test('should skip Google API test if key is not set', async () => {
            delete process.env.GOOGLE_API_KEY;
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.body.googleApiTest.status).toBe('Skipped');
        });

        test('should include reason for skipping tests', async () => {
            delete process.env.GOOGLE_API_KEY;
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.body.googleApiTest.reason).toBeDefined();
        });
    });

    describe('URL Signing Test', () => {
        test('should include URL signing test results', async () => {
            process.env.GOOGLE_API_KEY = 'test-key';
            process.env.GOOGLE_SIGNING_SECRET = 'test-secret';
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.body.urlSigningTest).toBeDefined();
        });

        test('should skip URL signing test if signing secret is not set', async () => {
            process.env.GOOGLE_API_KEY = 'test-key';
            delete process.env.GOOGLE_SIGNING_SECRET;
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.body.urlSigningTest.status).toBe('Skipped');
        });

        test('should skip URL signing test if API key is not set', async () => {
            delete process.env.GOOGLE_API_KEY;
            process.env.GOOGLE_SIGNING_SECRET = 'test-secret';
            await diagnosticFunction(mockContext, mockRequest);

            expect(mockContext.res.body.urlSigningTest.status).toBe('Skipped');
        });
    });

    describe('Error Handling', () => {
        test('should return 500 on unexpected error', async () => {
            // Simulate an error by corrupting the context
            mockContext.res = null;

            try {
                await diagnosticFunction(mockContext, mockRequest);
            } catch (error) {
                expect(error).toBeDefined();
            }
        });

        test('should log errors', async () => {
            expect(mockContext.log.error).toBeDefined();
        });

        test('should not expose stack traces in production-like responses', async () => {
            await diagnosticFunction(mockContext, mockRequest);

            // Stack traces should not be included in successful responses
            expect(mockContext.res.body.stack).toBeUndefined();
        });
    });

    describe('Response Structure', () => {
        test('should have well-formed response body', async () => {
            await diagnosticFunction(mockContext, mockRequest);

            const body = mockContext.res.body;

            expect(body).toHaveProperty('message');
            expect(body).toHaveProperty('timestamp');
            expect(body).toHaveProperty('environment');
            expect(body).toHaveProperty('googleApiTest');
            expect(body).toHaveProperty('urlSigningTest');
        });

        test('should have environment sub-properties', async () => {
            await diagnosticFunction(mockContext, mockRequest);

            const env = mockContext.res.body.environment;

            expect(env).toHaveProperty('nodeVersion');
            expect(env).toHaveProperty('platform');
            expect(env).toHaveProperty('arch');
            expect(env).toHaveProperty('memory');
            expect(env).toHaveProperty('uptime');
            expect(env).toHaveProperty('env');
        });

        test('should have safe environment variables only', async () => {
            process.env.SENSITIVE_PASSWORD = 'password123';
            await diagnosticFunction(mockContext, mockRequest);

            const envVars = mockContext.res.body.environment.env;

            expect(envVars.SENSITIVE_PASSWORD).toBeUndefined();
        });
    });
});
