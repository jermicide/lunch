const { Client } = require('@googlemaps/google-maps-services-js');

module.exports = async function (context, req) {
    context.log('Processing places SDK request');
    
    try {
        const { lat, lng, radius = 1500 } = req.query;
        
        if (!lat || !lng) {
            context.res = {
                status: 400,
                body: { error: "Missing location coordinates" }
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
        
        context.log(`Fetching places near ${lat},${lng} with radius ${searchRadius}m using Places SDK`);
        
        // Initialize Google Maps client
        const client = new Client({});
        
        // Perform nearby search using Places SDK
        const response = await client.placesNearby({
            params: {
                location: { lat: parseFloat(lat), lng: parseFloat(lng) },
                radius: searchRadius,
                type: ['restaurant', 'cafe', 'bakery', 'meal_takeaway', 'meal_delivery'],
                key: GOOGLE_API_KEY,
                rankby: 'distance',
                language: 'en'
            }
        });
        
        const data = response.data;
        
        context.log(`Places SDK Response - Places found: ${data.results ? data.results.length : 0}`);
        
        // Handle error responses from Google
        if (data.status !== 'OK') {
            context.log.error(`Google Places SDK error: ${data.status} - ${data.error_message || 'Unknown error'}`);
            context.res = {
                status: 500,
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
            context.log.error(`Response data: ${JSON.stringify(error.response.data)}`);
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