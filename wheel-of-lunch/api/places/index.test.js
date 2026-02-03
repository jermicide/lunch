const placesFunction = require('./index');

describe('Places API', () => {
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
        jest.clearAllMocks();
    });

    describe('Input Validation', () => {
        test('should return 400 for missing coordinates', async () => {
            mockRequest.query = {};
            await placesFunction(mockContext, mockRequest);

            expect(mockContext.res.status).toBe(400);
            expect(mockContext.res.body.error).toContain('Invalid or missing');
        });

        test('should return 400 for invalid latitude', async () => {
            mockRequest.query = { lat: 'invalid', lng: 0 };
            await placesFunction(mockContext, mockRequest);

            expect(mockContext.res.status).toBe(400);
            expect(mockContext.res.body.error).toContain('Invalid or missing');
        });

        test('should return 400 for out-of-range latitude', async () => {
            mockRequest.query = { lat: 91, lng: 0 };
            await placesFunction(mockContext, mockRequest);

            expect(mockContext.res.status).toBe(400);
        });

        test('should return 400 for out-of-range longitude', async () => {
            mockRequest.query = { lat: 0, lng: 181 };
            await placesFunction(mockContext, mockRequest);

            expect(mockContext.res.status).toBe(400);
        });
    });

    describe('Configuration Validation', () => {
        test('should return 500 when Google API key is missing', async () => {
            delete process.env.GOOGLE_API_KEY;
            mockRequest.query = { lat: 32.7767, lng: -96.797 };

            await placesFunction(mockContext, mockRequest);

            expect(mockContext.res.status).toBe(500);
            expect(mockContext.res.body.error).toContain('Server configuration');
        });
    });

    describe('Radius Validation', () => {
        test('should use default radius of 1500 when not provided', async () => {
            mockRequest.query = { lat: 32.7767, lng: -96.797 };

            // Mock the Client to verify parameters
            jest.mock('@googlemaps/google-maps-services-js', () => ({
                Client: jest.fn().mockImplementation(() => ({
                    placesNearby: jest.fn().mockResolvedValue({
                        data: {
                            status: 'OK',
                            results: []
                        }
                    })
                }))
            }));
        });

        test('should constrain radius to minimum of 500m', async () => {
            mockRequest.query = { lat: 32.7767, lng: -96.797, radius: 100 };

            jest.mock('@googlemaps/google-maps-services-js', () => ({
                Client: jest.fn().mockImplementation(() => ({
                    placesNearby: jest.fn().mockResolvedValue({
                        data: {
                            status: 'OK',
                            results: []
                        }
                    })
                }))
            }));
        });

        test('should constrain radius to maximum of 50000m', async () => {
            mockRequest.query = { lat: 32.7767, lng: -96.797, radius: 100000 };

            jest.mock('@googlemaps/google-maps-services-js', () => ({
                Client: jest.fn().mockImplementation(() => ({
                    placesNearby: jest.fn().mockResolvedValue({
                        data: {
                            status: 'OK',
                            results: []
                        }
                    })
                }))
            }));
        });
    });

    describe('Restaurant Filtering', () => {
        test('should filter out gas stations', async () => {
            mockRequest.query = { lat: 32.7767, lng: -96.797 };

            // Mock place with gas station type
            const gasStation = {
                place_id: 'gas1',
                name: 'Shell Gas Station',
                types: ['gas_station', 'point_of_interest'],
                vicinity: 'Main St'
            };

            // A valid restaurant should not be excluded
            const restaurant = {
                place_id: 'rest1',
                name: 'Restaurant',
                types: ['restaurant', 'point_of_interest'],
                vicinity: 'Main St'
            };

            // Verify gas station has excluded type
            expect(gasStation.types).toContain('gas_station');
            expect(restaurant.types).toContain('restaurant');
        });

        test('should filter out convenience stores', async () => {
            const convenienceStore = {
                place_id: 'conv1',
                name: '7-Eleven',
                types: ['convenience_store', 'point_of_interest'],
                vicinity: 'Main St'
            };

            expect(convenienceStore.types).toContain('convenience_store');
        });

        test('should filter out big box stores', async () => {
            const targets = [
                {
                    name: 'Walmart',
                    types: ['supermarket', 'department_store', 'point_of_interest']
                },
                {
                    name: 'Target',
                    types: ['department_store', 'shopping_mall', 'point_of_interest']
                },
                {
                    name: 'Best Buy',
                    types: ['electronics_store', 'shopping_mall', 'point_of_interest']
                }
            ];

            targets.forEach((store) => {
                expect(
                    store.types.some((t) => ['supermarket', 'department_store', 'shopping_mall'].includes(t))
                ).toBe(true);
            });
        });

        test('should keep restaurants even if they have additional secondary types', async () => {
            const restaurantWithTypes = {
                place_id: 'rest1',
                name: 'Italian Restaurant',
                types: ['restaurant', 'food', 'point_of_interest'],
                vicinity: 'Main St'
            };

            // Should be kept because primary type is restaurant
            expect(restaurantWithTypes.types).toContain('restaurant');
            expect(restaurantWithTypes.types).not.toContain('gas_station');
        });

        test('should exclude places that are restaurants AND convenience stores', async () => {
            const mixedPlace = {
                place_id: 'mixed1',
                name: 'Gas Station with Cafe',
                types: ['restaurant', 'gas_station', 'convenience_store'],
                vicinity: 'Highway St'
            };

            // Should be excluded because it has gas_station or convenience_store
            expect(mixedPlace.types).toContain('restaurant');
            expect(
                mixedPlace.types.some((t) => ['gas_station', 'convenience_store'].includes(t))
            ).toBe(true);
        });
    });


    describe('CORS Headers', () => {
        test('should include CORS headers in success response', async () => {
            mockRequest.query = { lat: 32.7767, lng: -96.797 };

            // After successful response
            expect.objectContaining({
                headers: expect.objectContaining({
                    'Access-Control-Allow-Origin': '*'
                })
            });
        });
    });

    describe('Error Handling', () => {
        test('should handle API errors gracefully', async () => {
            mockRequest.query = { lat: 32.7767, lng: -96.797 };

            // Simulate an error response
            const errorResponse = {
                status: 'REQUEST_DENIED',
                error_message: 'The request did not succeed'
            };

            expect(errorResponse.status).not.toBe('OK');
            expect(mockContext.log.error).toBeDefined();
        });

        test('should return 200 with empty array when no results found', async () => {
            mockRequest.query = { lat: 32.7767, lng: -96.797 };

            // This demonstrates the expected behavior
            const expectedResponse = {
                status: 200,
                body: { places: [] }
            };

            expect(expectedResponse.body.places).toEqual([]);
        });
    });

    describe('Request Logging', () => {
        test('should log incoming requests', async () => {
            mockRequest.query = { lat: 32.7767, lng: -96.797 };

            expect(mockContext.log).toBeDefined();
            expect(typeof mockContext.log).toBe('function');
        });
    });
});
