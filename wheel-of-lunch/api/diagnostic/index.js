// Diagnostic API function to help debug deployment issues
const os = require('os');
const axios = require('axios');

module.exports = async function (context, req) {
    try {
        // Get environment info
        const envInfo = {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            memory: {
                total: `${Math.round(os.totalmem() / 1024 / 1024)} MB`,
                free: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
            },
            uptime: `${Math.round(os.uptime() / 60)} minutes`,
            env: {
                // Only include safe environment variables
                NODE_ENV: process.env.NODE_ENV,
                WEBSITE_SITE_NAME: process.env.WEBSITE_SITE_NAME,
                FUNCTIONS_WORKER_RUNTIME: process.env.FUNCTIONS_WORKER_RUNTIME,
                // Show if API key is set without revealing it
                GOOGLE_API_KEY_SET: process.env.GOOGLE_API_KEY ? "Yes" : "No"
            }
        };

        // Test Google API connectivity with a simple geocoding request
        let googleApiTest = { status: "Not tested" };
        
        if (process.env.GOOGLE_API_KEY) {
            try {
                const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Dallas&key=${process.env.GOOGLE_API_KEY}`;
                const response = await axios.get(testUrl);
                googleApiTest = {
                    status: response.status,
                    googleStatus: response.data.status,
                    hasResults: response.data.results && response.data.results.length > 0
                };
            } catch (apiError) {
                googleApiTest = {
                    status: "Error",
                    message: apiError.message,
                    response: apiError.response ? {
                        status: apiError.response.status,
                        data: apiError.response.data
                    } : null
                };
            }
        }

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                message: "Diagnostic API is working",
                timestamp: new Date().toISOString(),
                environment: envInfo,
                googleApiTest: googleApiTest
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: {
                error: "Diagnostic failed",
                details: error.message,
                stack: error.stack
            }
        };
    }
};