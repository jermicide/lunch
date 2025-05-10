// API function for proxying Google Places API requests
const axios = require('axios');

module.exports = async function (context, req) {
    context.log('Processing places API request');
    
    try {
        const { lat, lng } = req.query;
        
        if (!lat || !lng) {
            context.res = {
                status: 400,
                body: { error: "Missing location coordinates" }
            };
            return;
        }
        
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        if (!GOOGLE_API_KEY) {
            context.log.error("Missing Google API Key configuration");
            context.res = {
                status: 500,
                body: { error: "Server configuration error" }
            };
            return;
        }
        
        // Using the well-established Places API Nearby Search endpoint
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;
        
        context.log(`Fetching places near ${lat},${lng}`);
        
        const response = await axios.get(url, {
            params: {
                location: `${lat},${lng}`,
                radius: 1500,
                type: 'restaurant',
                key: GOOGLE_API_KEY
            }
        });
        
        const data = response.data;
        
        // Handle error responses from Google
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            context.log.error(`Google API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
            context.res = {
                status: 400,
                body: { 
                    error: "Google Places API error", 
                    status: data.status,
                    message: data.error_message || "Error fetching places"
                }
            };
            return;
        }
        
        // Transform the response to match our expected format
        const transformedResponse = {
            places: (data.results || []).map(place => ({
                id: place.place_id,
                displayName: { text: place.name },
                formattedAddress: place.vicinity,
                rating: { value: place.rating || 0 },
                userRatingCount: place.user_ratings_total || 0,
                priceLevel: place.price_level ? 
                    `PRICE_LEVEL_${['INEXPENSIVE', 'MODERATE', 'EXPENSIVE', 'VERY_EXPENSIVE'][place.price_level-1] || 'MODERATE'}` : 
                    'PRICE_LEVEL_MODERATE',
                primaryTypeDisplayName: { 
                    text: place.types?.filter(t => t !== 'restaurant' && t !== 'establishment')
                          .map(t => t.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))[0] || 'Restaurant'
                },
                photos: place.photos ? [{ name: place.photos[0]?.photo_reference || null }] : [],
                businessStatus: place.business_status || 'OPERATIONAL'
            }))
        };
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: transformedResponse
        };
        
    } catch (error) {
        context.log.error(`Error in places API: ${error.message}`);
        context.res = {
            status: 500,
            body: { 
                error: "Failed to fetch restaurants", 
                details: error.message,
                stack: error.stack
            }
        };
    }
};