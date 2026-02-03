const os = require('os');
const axios = require('axios');
const crypto = require('crypto');
const querystring = require('querystring');

/**
 * Signs a URL with HMAC-SHA1 signature for Google API requests
 * @param {string} urlToSign - The URL to sign
 * @param {string} secretKey - The secret key (base64 encoded)
 * @returns {string|null} The signed URL or null if signing fails
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
        return null;
    }
}

/**
 * Gathers environment and configuration information
 * @returns {Object}
 */
function getEnvironmentInfo() {
    return {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
            total: `${Math.round(os.totalmem() / 1024 / 1024)} MB`,
            free: `${Math.round(os.freemem() / 1024 / 1024)} MB`
        },
        uptime: `${Math.round(os.uptime() / 60)} minutes`,
        env: {
            NODE_ENV: process.env.NODE_ENV,
            WEBSITE_SITE_NAME: process.env.WEBSITE_SITE_NAME,
            FUNCTIONS_WORKER_RUNTIME: process.env.FUNCTIONS_WORKER_RUNTIME,
            GOOGLE_API_KEY_SET: process.env.GOOGLE_API_KEY ? 'Yes' : 'No',
            GOOGLE_SIGNING_SECRET_SET: process.env.GOOGLE_SIGNING_SECRET ? 'Yes' : 'No'
        }
    };
}

/**
 * Tests Google API connectivity with a simple geocoding request
 * @returns {Promise<Object>}
 */
async function testGoogleApi() {
    if (!process.env.GOOGLE_API_KEY) {
        return { status: 'Skipped', reason: 'GOOGLE_API_KEY not set' };
    }

    try {
        const testAddress = 'Dallas';
        const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${testAddress}&key=${process.env.GOOGLE_API_KEY}`;

        const response = await axios.get(testUrl, { timeout: 5000 });

        return {
            status: response.status,
            googleStatus: response.data.status,
            hasResults: response.data.results && response.data.results.length > 0,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            status: 'Error',
            message: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Tests URL signing functionality if signing secret is available
 * @returns {Promise<Object>}
 */
async function testUrlSigning() {
    if (!process.env.GOOGLE_SIGNING_SECRET) {
        return { status: 'Skipped', reason: 'GOOGLE_SIGNING_SECRET not set' };
    }

    if (!process.env.GOOGLE_API_KEY) {
        return { status: 'Skipped', reason: 'GOOGLE_API_KEY not set' };
    }

    try {
        const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
        const params = {
            address: 'Dallas',
            key: process.env.GOOGLE_API_KEY
        };

        const paramString = querystring.stringify(params);
        const urlToSign = `${baseUrl}?${paramString}`;
        const signedUrl = signUrl(urlToSign, process.env.GOOGLE_SIGNING_SECRET);

        if (!signedUrl) {
            return { status: 'Error', message: 'Failed to sign URL' };
        }

        const response = await axios.get(signedUrl, { timeout: 5000 });

        return {
            status: response.status,
            googleStatus: response.data.status,
            hasResults: response.data.results && response.data.results.length > 0,
            urlSigningSuccess: true,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            status: 'Error',
            message: error.message,
            urlSigningSuccess: false,
            timestamp: new Date().toISOString()
        };
    }
}

/**
 * Azure Function: Diagnostic endpoint to check API health and configuration
 * @param {Object} context - Azure Function context
 * @param {Object} req - HTTP request
 */
async function handler(context, req) {
    try {
        const envInfo = getEnvironmentInfo();
        const googleApiTest = await testGoogleApi();
        const urlSigningTest = await testUrlSigning();

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                message: 'Diagnostic API is working',
                timestamp: new Date().toISOString(),
                environment: envInfo,
                googleApiTest,
                urlSigningTest
            }
        };
    } catch (error) {
        context.log.error(`Diagnostic error: ${error.message}`);
        context.log.error(`Stack: ${error.stack}`);

        context.res = {
            status: 500,
            body: {
                error: 'Diagnostic failed',
                message: error.message
            }
        };
    }
}

module.exports = handler;