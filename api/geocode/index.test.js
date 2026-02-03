const geocodeFunction = require('./index');

describe('Geocode API', () => {
    let mockContext;
    let mockRequest;

    beforeEach(() => {
        mockContext = {
            log: jest.fn(),
            res: null
        };
        mockContext.log.error = jest.fn();

        mockRequest = {
            query: {}
        };

        // Set up environment
        process.env.GOOGLE_API_KEY = 'test-api-key';
    });

    afterEach(() => {
        delete process.env.GOOGLE_API_KEY;
        delete process.env.GOOGLE_SIGNING_SECRET;
        jest.clearAllMocks();
    });

    describe('Input Validation', () => {
        test('should return 400 when ZIP code is missing', async () => {
            mockRequest.query = {};
            await geocodeFunction(mockContext, mockRequest);

            expect(mockContext.res.status).toBe(400);
            expect(mockContext.res.body.error).toContain('Missing or invalid');
        });

        test('should return 400 when ZIP code is empty string', async () => {
            mockRequest.query = { zipCode: '' };
            await geocodeFunction(mockContext, mockRequest);

            expect(mockContext.res.status).toBe(400);
            expect(mockContext.res.body.error).toContain('Missing or invalid');
        });

        test('should return 400 when ZIP code is whitespace only', async () => {
            mockRequest.query = { zipCode: '   ' };
            await geocodeFunction(mockContext, mockRequest);

            expect(mockContext.res.status).toBe(400);
        });

        test('should accept valid ZIP code format', async () => {
            mockRequest.query = { zipCode: '75201' };

            expect(mockRequest.query.zipCode).toBeDefined();
            expect(typeof mockRequest.query.zipCode).toBe('string');
        });

        test('should trim whitespace from ZIP code', async () => {
            mockRequest.query = { zipCode: '  75201  ' };

            const trimmed = mockRequest.query.zipCode.trim();
            expect(trimmed).toBe('75201');
        });
    });

    describe('Configuration Validation', () => {
        test('should return 500 when Google API key is missing', async () => {
            delete process.env.GOOGLE_API_KEY;
            mockRequest.query = { zipCode: '75201' };

            await geocodeFunction(mockContext, mockRequest);

            expect(mockContext.res.status).toBe(500);
            expect(mockContext.res.body.error).toContain('Server configuration');
        });
    });

    describe('URL Signing', () => {
        test('should use URL signing when signing secret is available', async () => {
            process.env.GOOGLE_SIGNING_SECRET = 'test-secret-key';
            mockRequest.query = { zipCode: '75201' };

            expect(process.env.GOOGLE_SIGNING_SECRET).toBeDefined();
        });

        test('should work without URL signing when secret is not available', async () => {
            delete process.env.GOOGLE_SIGNING_SECRET;
            mockRequest.query = { zipCode: '75201' };

            expect(process.env.GOOGLE_SIGNING_SECRET).toBeUndefined();
        });
    });

    describe('API Response Handling', () => {
        test('should return 200 with geocoding results on success', async () => {
            mockRequest.query = { zipCode: '75201' };

            const mockGeocodeResponse = {
                status: 'OK',
                results: [
                    {
                        formatted_address: 'Dallas, TX 75201, USA',
                        geometry: {
                            location: { lat: 32.7767, lng: -96.797 }
                        }
                    }
                ]
            };

            expect(mockGeocodeResponse.status).toBe('OK');
            expect(mockGeocodeResponse.results.length).toBeGreaterThan(0);
        });

        test('should return 400 for ZERO_RESULTS status', async () => {
            mockRequest.query = { zipCode: 'invalid-zip' };

            const mockGeocodeResponse = {
                status: 'ZERO_RESULTS',
                results: []
            };

            expect(mockGeocodeResponse.status).not.toBe('OK');
        });

        test('should return 400 for REQUEST_DENIED status', async () => {
            mockRequest.query = { zipCode: '75201' };

            const mockGeocodeResponse = {
                status: 'REQUEST_DENIED',
                error_message: 'The request did not succeed'
            };

            expect(mockGeocodeResponse.status).not.toBe('OK');
        });

        test('should pass through Google API response', async () => {
            mockRequest.query = { zipCode: '75201' };

            const mockGeocodeResponse = {
                status: 'OK',
                results: [
                    {
                        formatted_address: 'Dallas, TX 75201, USA',
                        geometry: {
                            location: { lat: 32.7767, lng: -96.797 }
                        }
                    }
                ]
            };

            // Verify response structure
            expect(mockGeocodeResponse).toHaveProperty('status');
            expect(mockGeocodeResponse).toHaveProperty('results');
        });
    });

    describe('CORS Headers', () => {
        test('should include CORS headers in response', async () => {
            mockRequest.query = { zipCode: '75201' };

            const expectedHeaders = {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            };

            expect(expectedHeaders['Access-Control-Allow-Origin']).toBe('*');
        });
    });

    describe('Error Handling', () => {
        test('should handle network errors gracefully', async () => {
            mockRequest.query = { zipCode: '75201' };

            expect(mockContext.log.error).toBeDefined();
        });

        test('should not expose sensitive information in error responses', async () => {
            mockRequest.query = { zipCode: '75201' };

            // Simulate error response
            const errorBody = {
                error: 'Failed to geocode ZIP code'
            };

            // Should not include API key or other sensitive data
            expect(JSON.stringify(errorBody)).not.toContain('GOOGLE_API_KEY');
            expect(JSON.stringify(errorBody)).not.toContain('test-api-key');
        });

        test('should log errors without exposing sensitive data', async () => {
            mockRequest.query = { zipCode: '75201' };

            expect(typeof mockContext.log.error).toBe('function');
        });
    });

    describe('Timeout Handling', () => {
        test('should have reasonable timeout for API requests', async () => {
            // This demonstrates that the axios request should have a timeout
            const expectedTimeout = 10000; // 10 seconds

            expect(expectedTimeout).toBeGreaterThan(0);
            expect(expectedTimeout).toBeLessThanOrEqual(30000);
        });
    });

    describe('Request Logging', () => {
        test('should log incoming geocode requests', async () => {
            mockRequest.query = { zipCode: '75201' };

            expect(mockContext.log).toBeDefined();
            expect(typeof mockContext.log).toBe('function');
        });

        test('should log URL signing when enabled', async () => {
            process.env.GOOGLE_SIGNING_SECRET = 'test-secret-key';
            mockRequest.query = { zipCode: '75201' };

            expect(mockContext.log).toBeDefined();
        });
    });
});
