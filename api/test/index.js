/**
 * Azure Function: Simple test endpoint for connectivity verification
 * This is a minimal health check endpoint to verify the Function App is running
 * and can respond to HTTP requests. For detailed diagnostics, use /api/diagnostic
 * 
 * @param {Object} context - Azure Function context
 * @param {Object} req - HTTP request
 */
function handler(context, req) {
    context.log('Test function invoked');
    context.res = {
        status: 200,
        body: 'OK'
    };
}

module.exports = handler;

