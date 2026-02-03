const crypto = require('crypto');

/**
 * Shared utility functions for API functions
 */

/**
 * Signs a URL with HMAC-SHA1 signature for Google API requests
 * @param {string} urlToSign - The URL to sign
 * @param {string} secretKey - The secret key (base64 encoded)
 * @returns {string} The signed URL
 * @throws {Error} If URL signing fails
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
        throw new Error(`Failed to sign URL: ${error.message}`);
    }
}

/**
 * Creates a standardized HTTP error response
 * @param {number} status - HTTP status code
 * @param {string} error - Error message
 * @param {string} [message] - Optional additional message
 * @returns {Object}
 */
function createErrorResponse(status, error, message) {
    return {
        status,
        body: {
            error,
            ...(message && { message })
        }
    };
}

/**
 * Creates a standardized HTTP success response
 * @param {*} data - Response data
 * @param {number} [status=200] - HTTP status code
 * @returns {Object}
 */
function createSuccessResponse(data, status = 200) {
    return {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: data
    };
}

/**
 * Validates environment variables required by API functions
 * @param {string[]} required - Array of required environment variable names
 * @returns {boolean}
 * @throws {Error} If required environment variables are missing
 */
function validateEnvVars(required) {
    const missing = required.filter((envVar) => !process.env[envVar]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    return true;
}

/**
 * Safe logging function that doesn't expose sensitive data
 * @param {Function} logger - Context logger function
 * @param {string} level - Log level (log, error, warn)
 * @param {string} message - Log message
 * @param {*} [data] - Optional data to log (will be sanitized)
 */
function safeLog(logger, level, message, data) {
    const logFn = logger[level] || logger;

    if (data) {
        // Remove sensitive keys before logging
        const sanitized = sanitizeObject(data);
        logFn(`${message}: ${JSON.stringify(sanitized)}`);
    } else {
        logFn(message);
    }
}

/**
 * Removes sensitive information from objects
 * @param {*} obj - Object to sanitize
 * @returns {*} Sanitized object
 */
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    const sensitiveKeys = ['key', 'secret', 'password', 'token', 'authorization'];
    const result = Array.isArray(obj) ? [...obj] : { ...obj };

    for (const key in result) {
        if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
            result[key] = '***REDACTED***';
        } else if (typeof result[key] === 'object') {
            result[key] = sanitizeObject(result[key]);
        }
    }

    return result;
}

module.exports = {
    signUrl,
    createErrorResponse,
    createSuccessResponse,
    validateEnvVars,
    safeLog,
    sanitizeObject
};
