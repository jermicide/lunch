// API function for proxying Google Geocoding API requests
const axios = require('axios');

module.exports = async function (context, req) {
    context.log('Processing geocode API request');
    
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
                body: { error: "Server configuration error" }
            };
            return;
        }
        
        // Simple geocoding request without URL signing
        const url = `https://maps.googleapis.com/maps/api/geocode/json`;
        
        context.log(`Geocoding ZIP code: ${zipCode}`);
        
        // Make the request with the API key as a query parameter
        const response = await axios.get(url, {
            params: {
                address: zipCode,
                key: GOOGLE_API_KEY
            },
            headers: {
                'Accept': 'application/json'
            }
        });
        
        const data = response.data;
        
        // Log detailed info for debugging
        context.log(`Geocoding API Response Status: ${data.status}`);
        if (data.error_message) {
            context.log.error(`API Error Message: ${data.error_message}`);
        }
        
        // Check if the geocoding was successful
        if (data.status !== 'OK') {
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