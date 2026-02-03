/**
 * Shared middleware and utility functions for Azure Functions
 */

/**
 * CORS headers for API responses
 * Configure allowed origins based on environment
 */
function getCorsHeaders() {
    const allowedOrigins = [
        'https://icy-mushroom-0aa01d710.azurestaticapps.net',
        'http://localhost:5173',
        'http://localhost:3000'
    ];
    
    // In production, only allow specific origins
    const origin = process.env.NODE_ENV === 'production' 
        ? allowedOrigins[0] 
        : '*';
    
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '3600'
    };
}

/**
 * Handle CORS preflight requests
 * @param {Object} context - Azure Function context
 */
function handleCorsPreFlight(context) {
    context.res = {
        status: 204,
        headers: getCorsHeaders()
    };
}

/**
 * Add CORS headers to response
 * @param {Object} response - Response object
 * @returns {Object} Response with CORS headers
 */
function addCorsHeaders(response) {
    return {
        ...response,
        headers: {
            ...response.headers,
            ...getCorsHeaders()
        }
    };
}

/**
 * Validate required environment variables
 * @param {Array<string>} requiredVars - Array of required variable names
 * @returns {Object|null} Error object if validation fails, null otherwise
 */
function validateEnvironment(requiredVars) {
    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
        return {
            status: 500,
            body: {
                error: 'Server configuration error',
                message: `Missing required environment variables: ${missing.join(', ')}`
            }
        };
    }
    
    return null;
}

/**
 * Rate limiting check (simple in-memory implementation)
 * For production, use Azure Redis Cache or Azure API Management
 * @param {string} key - Rate limit key (e.g., IP address)
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} True if rate limit exceeded
 */
const rateLimitStore = new Map();

function checkRateLimit(key, maxRequests = 100, windowMs = 60000) {
    const now = Date.now();
    const record = rateLimitStore.get(key);
    
    if (!record) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        return false;
    }
    
    if (now > record.resetTime) {
        rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        return false;
    }
    
    if (record.count >= maxRequests) {
        return true;
    }
    
    record.count++;
    return false;
}

/**
 * Clean up old rate limit records
 */
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 60000); // Clean up every minute

/**
 * Get client IP address from request headers
 * @param {Object} req - HTTP request
 * @returns {string} Client IP address
 */
function getClientIp(req) {
    if (!req || !req.headers) {
        return 'unknown';
    }
    
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() 
        || req.headers['x-real-ip'] 
        || 'unknown';
}

/**
 * Error response with proper formatting
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 * @returns {Object} Formatted error response
 */
function errorResponse(status, message, details = {}) {
    return {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders()
        },
        body: {
            error: message,
            ...details,
            timestamp: new Date().toISOString()
        }
    };
}

/**
 * Success response with proper formatting
 * @param {Object} data - Response data
 * @param {number} status - HTTP status code (default: 200)
 * @returns {Object} Formatted success response
 */
function successResponse(data, status = 200) {
    return {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders()
        },
        body: data
    };
}

/**
 * Sanitize user input to prevent injection attacks
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        return input;
    }
    
    // Remove potentially dangerous characters
    return input
        .replace(/[<>]/g, '')
        .trim()
        .substring(0, 1000); // Limit length
}

/**
 * Log API request with details
 * @param {Object} context - Azure Function context
 * @param {Object} req - HTTP request
 */
function logRequest(context, req) {
    if (!req || !context) {
        return;
    }
    
    const ip = getClientIp(req);
    const userAgent = req.headers?.['user-agent'] || 'unknown';
    
    context.log({
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        ip,
        userAgent,
        params: req.query
    });
}

module.exports = {
    getCorsHeaders,
    handleCorsPreFlight,
    addCorsHeaders,
    validateEnvironment,
    checkRateLimit,
    getClientIp,
    errorResponse,
    successResponse,
    sanitizeInput,
    logRequest
};
