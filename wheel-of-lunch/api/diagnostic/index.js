// Diagnostic API function to help debug deployment issues
const os = require('os');
const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');

// Function to sign a URL with your API key
function signUrl(urlToSign, secretKey) {
  try {
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
  } catch (error) {
    console.error('Error signing URL:', error);
    return null;
  }
}

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
                GOOGLE_API_KEY_SET: process.env.GOOGLE_API_KEY ? "Yes" : "No",
                GOOGLE_SIGNING_SECRET_SET: process.env.GOOGLE_SIGNING_SECRET ? "Yes" : "No"
            }
        };

        // Test Google API connectivity with a simple geocoding request and URL signing
        let googleApiTest = { status: "Not tested" };
        let urlSigningTest = { status: "Not tested" };
        
        if (process.env.GOOGLE_API_KEY) {
            try {
                const testAddress = "Dallas";
                
                // Test with regular API key first
                const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${testAddress}&key=${process.env.GOOGLE_API_KEY}`;
                const response = await axios.get(testUrl);
                googleApiTest = {
                    status: response.status,
                    googleStatus: response.data.status,
                    hasResults: response.data.results && response.data.results.length > 0,
                    errorMessage: response.data.error_message || null
                };
                
                // Now test with URL signing if signing secret is available
                if (process.env.GOOGLE_SIGNING_SECRET) {
                    // Build the base URL with parameters
                    const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
                    const params = {
                        address: testAddress,
                        key: process.env.GOOGLE_API_KEY
                    };
                    
                    // Create the URL string
                    const paramString = querystring.stringify(params);
                    const urlToSign = `${baseUrl}?${paramString}`;
                    
                    // Sign the URL
                    const signedUrl = signUrl(urlToSign, process.env.GOOGLE_SIGNING_SECRET);
                    
                    if (urlToSign) {
                        const signedResponse = await axios.get(urlToSign);
                        urlSigningTest = {
                            status: signedResponse.status,
                            googleStatus: signedResponse.data.status,
                            hasResults: signedResponse.data.results && signedResponse.data.results.length > 0,
                            errorMessage: signedResponse.data.error_message || null,
                            urlSigningSuccess: true
                        };
                    } else {
                        urlSigningTest = {
                            status: "Error",
                            message: "Failed to sign URL",
                            urlSigningSuccess: false
                        };
                    }
                }
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
                googleApiTest: googleApiTest,
                urlSigningTest: urlSigningTest
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