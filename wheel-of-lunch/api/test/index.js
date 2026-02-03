module.exports = async function handler(context, req) {
    try {
        context.log('Test function called');
        context.log('Request:', {
            method: req.method,
            url: req.url,
            query: req.query
        });
        
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                message: 'Hello from test function',
                timestamp: new Date().toISOString(),
                node: process.version,
                env: {
                    NODE_ENV: process.env.NODE_ENV,
                    GOOGLE_API_KEY_SET: !!process.env.GOOGLE_API_KEY
                }
            }
        };
    } catch (error) {
        context.log.error('Error in test function:', error.message);
        context.res = {
            status: 500,
            body: {
                error: error.message,
                stack: error.stack
            }
        };
    }
};

