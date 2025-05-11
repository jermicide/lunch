const { Client } = require('@googlemaps/google-maps-services-js');

module.exports = async function (context, req) {
    context.log('Processing places SDK request');
    
    try {
        const { lat, lng, radius = 1500 } = req.query;
        
        // Validate latitude and longitude
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        if (isNaN(latitude) || isNaN(longitude) || 
            latitude < -90 || latitude > 90 || 
            longitude < -180 || longitude > 180) {
            context.res = {
                status: 400,
                body: { error: "Invalid or missing location coordinates" }
            };
            return;
        }
        
        // Parse radius as a number and ensure it's within reasonable limits
        const searchRadius = Math.min(Math.max(Number(radius) || 1500, 500), 50000);
        
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        if (!GOOGLE_API_KEY) {
            context.log.error("Missing Google API Key configuration");
            context.res = {
                status: 500,
                body: { error: "Server configuration error" }
            };
            return;
        }
        
        context.log(`Fetching places near ${latitude},${longitude} with radius ${searchRadius}m using Places SDK`);
        
        // Initialize Google Maps client
        const client = new Client({});
        
        // Perform nearby search using Places SDK
        const params = {
            location: { lat: latitude, lng: longitude },
            type: 'restaurant', // Single type as required by API
            key: GOOGLE_API_KEY,
            language: 'en'
        };

        // Use radius or rankby:distance, not both
        if (req.query.rankBy === 'distance') {
            params.rankby = 'distance';
        } else {
            params.radius = searchRadius;
        }

        context.log(`Places SDK request params: ${JSON.stringify(params, null, 2)}`);
        
        const response = await client.placesNearby({ params });
        
        const data = response.data;
        
        context.log(`Places SDK Response - Status: ${data.status}, Places found: ${data.results ? data.results.length : 0}`);
        
        // Handle error responses from Google
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            context.log.error(`Google Places SDK error: ${data.status} - ${data.error_message || 'Unknown error'}`);
            context.res = {
                status: 400,
                body: { 
                    error: "Google Places SDK error", 
                    details: data.error_message || "Error fetching places",
                    status: data.status
                }
            };
            return;
        }
        
        // Handle case where no places were found
        if (!data.results || data.results.length === 0) {
            context.res = {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: { places: [] }
            };
            return;
        }
        
        // Map SDK response to match the app's expected structure
        const places = data.results.map(place => ({
            id: place.place_id,
            displayName: place.name,
            formattedAddress: place.vicinity,
            location: {
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng
            },
            rating: place.rating,
            userRatingCount: place.user_ratings_total,
            priceLevel: place.price_level,
            primaryType: place.types[0],
            businessStatus: place.business_status,
            photos: place.photos ? place.photos.map(photo => ({
                name: photo.photo_reference,
                widthPx: photo.width,
                heightPx: photo.height
            })) : []
        }));
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: { places }
        };
        
    } catch (error) {
        context.log.error(`Error in places SDK: ${error.message}`);
        if (error.response) {
            context.log.error(`Response status: ${error.response.status}`);
            context.log.error(`Response data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        context.res = {
            status: 500,
            body: { 
                error: "Failed to fetch restaurants", 
                details: error.message,
                stack: error.stack,
                responseData: error.response ? error.response.data : null
            }
        };
    }
};