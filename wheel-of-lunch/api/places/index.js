// API function for proxying Google Places API v2 requests
const axios = require('axios');

module.exports = async function (context, req) {
    context.log('Processing places API v2 request');
    
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
        const searchRadius = Math.min(Math.max(Number(radius) || 1500, 500), 5000);
        
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        if (!GOOGLE_API_KEY) {
            context.log.error("Missing Google API Key configuration");
            context.res = {
                status: 500,
                body: { error: "Server configuration error" }
            };
            return;
        }
        
        // Using Google Places API v2 for nearby search
        const url = 'https://places.googleapis.com/v2/places:searchNearby';
        
        context.log(`Fetching places near ${lat},${lng} with radius ${searchRadius}m using Places API v2`);
        
        // Build the request payload for Places API v2
        const requestPayload = {
            includedTypes: ["restaurant", "cafe", "bakery", "meal_takeaway", "meal_delivery"],
            maxResultCount: 20,
            locationRestriction: {
                circle: {
                    center: {
                        latitude: parseFloat(lat),
                        longitude: parseFloat(lng)
                    },
                    radius: searchRadius
                }
            },
            rankPreference: "DISTANCE",
            languageCode: "en"
        };
        
        // Make the request to Places API v2
        const response = await axios({
            method: 'POST',
            url: url,
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.priceLevel,places.primaryType,places.businessStatus,places.primaryTypeDisplayName,places.editorialSummary,places.photos'
            },
            data: requestPayload
        });
        
        const data = response.data;
        
        context.log(`Places API v2 Response - Places found: ${data.places ? data.places.length : 0}`);
        
        // Handle error responses from Google
        if (data.error) {
            context.log.error(`Google Places API v2 error: ${JSON.stringify(data.error)}`);
            context.res = {
                status: data.error.code || 500,
                body: { 
                    error: "Google Places API error", 
                    details: data.error.message || "Error fetching places"
                }
            };
            return;
        }
        
        // Handle case where no places were found
        if (!data.places || data.places.length === 0) {
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
        
        // Return the API v2 response directly - its format already matches our app's expected structure
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: data
        };
        
    } catch (error) {
        context.log.error(`Error in places API v2: ${error.message}`);
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