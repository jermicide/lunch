// API function for proxying Google Geocoding API requests with URL signing
const axios = require('axios');
const crypto = require('crypto');
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
    context.log('Processing geocode API request with URL signing');
    
    try {
        const { zipCode } = req.query;
        
        if (!zipCode) {
            context.res = {
                status: 400,
                body: { error: "Missing ZIP code" }
            };
            return;
        }
        
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        
        if (!GOOGLE_API_KEY) {
            context.log.error("Missing Google API Key configuration");
            context.res = {
                status: 500,
                body: { error: "Server configuration error - missing API key" }
            };
            return;
        }
        
        // Build the base URL with parameters
        const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
        const params = {
            address: zipCode,
            key: GOOGLE_API_KEY
        };
        
        // Sign the URL
        const signedUrl = `${baseUrl}?${paramString}`;
        
        context.log(`Geocoding ZIP code: ${zipCode} with signed URL`);
        
        // Make the request with the signed URL
        const response = await axios.get(signedUrl);
        const data = response.data;
        
        // Check if the geocoding was successful
        if (data.status !== 'OK') {
            context.log.error(`Geocoding error: ${data.status} - ${data.error_message || 'Unknown error'}`);
            context.res = {
                status: 400,
                body: { 
                    error: "Geocoding failed", 
                    status: data.status,
                    message: data.error_message || "Could not geocode the ZIP code"
                }
            };
            return;
        }
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*' // Enable CORS
            },
            body: data
        };
        
    } catch (error) {
        context.log.error(`Error in geocode API: ${error.message}`);
        if (error.response) {
            context.log.error(`Response status: ${error.response.status}`);
            context.log.error(`Response data: ${JSON.stringify(error.response.data)}`);
        }
        context.res = {
            status: 500,
            body: { 
                error: "Failed to geocode ZIP code", 
                details: error.message,
                stack: error.stack,
                responseData: error.response ? error.response.data : null
            }
        };
    }
};