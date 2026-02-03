module.exports = async function (context, req) {
    context.log('Test function called');
    
    context.res = {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: {
            message: 'Hello from test function',
            timestamp: new Date().toISOString(),
            node: process.version
        }
    };
};
