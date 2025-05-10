// API function for proxying Google Places API requests with URL signing
const axios = require('axios');
const crypto = require('crypto');
const url = require('url');
const querystring = require('querystring');

// Function to sign a URL with your API key
function signUrl(urlToSign, secretKey) {
  // Convert the URL to be signed from a string to a URL object
  const parsedUrl = new URL(urlToSign);
  
  // Get the path with query parameters
  const pathWithQuery = parsedUrl.pathname + parsedUrl.search;
  
  // Create a signature using HMAC-SHA1
  const signature = crypto.createHmac('sha1', Buffer.from(secretKey, 'base64'))
                         .update(pathWithQuery)
                         .digest('base64');
  
  // Add the signature to the URL
  const signedUrl = `${urlToSign}&signature=${encodeURIComponent(signature)}`;
  return signedUrl;
}

module.exports = async function (context, req) {
    context.log('Processing places API request with URL signing');
    
    try {
        const { lat, lng, range = 1500 } = req.query;
        
        if (!lat || !lng) {
            context.res = {
                status: 400,
                body: { error: "Missing location coordinates" }
            };
            return;
        }
        
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        const GOOGLE_SIGNING_SECRET = process.env.GOOGLE_SIGNING_SECRET;
        
        if (!GOOGLE_API_KEY) {
            context.log.error("Missing Google API Key configuration");
            context.res = {
                status: 500,
                body: { error: "Server configuration error - missing API key" }
            };
            return;
        }
        
        if (!GOOGLE_SIGNING_SECRET) {
            context.log.error("Missing Google Signing Secret configuration");
            context.res = {
                status: 500,
                body: { error: "Server configuration error - missing signing secret" }
            };
            return;
        }
        
        // Build the base URL with parameters
        const baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
        const params = {
            location: `${lat},${lng}`,
            radius: range,
            type: 'restaurant',
            key: GOOGLE_API_KEY
        };
        
        // Create the URL string
        const paramString = querystring.stringify(params);
        const urlToSign = `${baseUrl}?${paramString}`;
        
        // Sign the URL
        const signedUrl = signUrl(urlToSign, GOOGLE_SIGNING_SECRET);
        
        context.log(`Fetching places near ${lat},${lng} with signed URL`);
        
        // Make the request with the signed URL
        const response = await axios.get(signedUrl);
        const data = response.data;
        
        // Log detailed info for debugging
        context.log(`Places API Response Status: ${data.status}`);
        if (data.error_message) {
            context.log.error(`API Error Message: ${data.error_message}`);
        }
        
        // Handle error responses from Google
        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
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
                photos: place.photos ? place.photos.map(photo => ({ name: photo.photo_reference || null })) : [],
                businessStatus: place.business_status || 'OPERATIONAL',
                editorialSummary: { text: "" } // Places API V1 doesn't provide this
            }))
        };
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Enable CORS
            },
            body: transformedResponse
        };
        
    } catch (error) {
        context.log.error(`Error in places API: ${error.message}`);
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