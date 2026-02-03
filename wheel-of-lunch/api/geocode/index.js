const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');

/**
 * Signs a URL with HMAC-SHA1 signature for Google API requests
 * @param {string} urlToSign - The URL to sign
 * @param {string} secretKey - The secret key (base64 encoded)
 * @returns {string} The signed URL
 */
function signUrl(urlToSign, secretKey) {
    try {
        const parsedUrl = new URL(urlToSign);
        const pathWithQuery = parsedUrl.pathname + parsedUrl.search;

        const signature = crypto
            .createHmac('sha1', Buffer.from(secretKey, 'base64'))
            .update(pathWithQuery)
            .digest('base64');

        return `${urlToSign}&signature=${encodeURIComponent(signature)}`;
    } catch (error) {
        console.error('Error signing URL:', error.message);
        throw new Error('Failed to sign URL');
    }
}

/**
 * Validates ZIP code format
 * @param {string} zipCode
 * @returns {boolean}
 */
function isValidZipCode(zipCode) {
    return zipCode && typeof zipCode === 'string' && zipCode.trim().length > 0;
}

/**
 * Azure Function: Geocode a ZIP code to coordinates
 * @param {Object} context - Azure Function context
 * @param {Object} req - HTTP request with zipCode query parameter
 */
module.exports = async function (context, req) {
    context.log('Processing geocode API request');

    try {
        const { zipCode } = req.query;

        // Validate ZIP code
        if (!isValidZipCode(zipCode)) {
            context.res = {
                status: 400,
                body: { error: 'Missing or invalid ZIP code' }
            };
            return;
        }

        // Validate API key exists
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        if (!GOOGLE_API_KEY) {
            context.log.error('Missing Google API Key configuration');
            context.res = {
                status: 500,
                body: { error: 'Server configuration error' }
            };
            return;
        }

        // Build the base URL with parameters
        const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
        const params = {
            address: zipCode.trim(),
            key: GOOGLE_API_KEY
        };

        // Create the URL string
        const paramString = querystring.stringify(params);
        let requestUrl = `${baseUrl}?${paramString}`;

        // Sign URL if signing secret is available
        const GOOGLE_SIGNING_SECRET = process.env.GOOGLE_SIGNING_SECRET;
        if (GOOGLE_SIGNING_SECRET) {
            requestUrl = signUrl(requestUrl, GOOGLE_SIGNING_SECRET);
            context.log('Using URL signing for geocode request');
        }

        context.log(`Geocoding ZIP code: ${zipCode}`);

        // Make the request
        const response = await axios.get(requestUrl, {
            timeout: 10000
        });
        const data = response.data;

        // Check if the geocoding was successful
        if (data.status !== 'OK') {
            context.log.error(`Geocoding error: ${data.status}`);
            context.res = {
                status: 400,
                body: {
                    error: 'Geocoding failed',
                    status: data.status
                }
            };
            return;
        }

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: data
        };
    } catch (error) {
        context.log.error(`Geocode API error: ${error.message}`);
        context.log.error(`Stack: ${error.stack}`);

        if (error.response) {
            context.log.error(`Response status: ${error.response.status}`);
        }

        context.res = {
            status: 500,
            body: {
                error: 'Failed to geocode ZIP code'
            }
        };
    }
};