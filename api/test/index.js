function handler(context, req) {
    context.log('Test function invoked');
    context.res = {
        status: 200,
        body: 'OK'
    };
}

module.exports = handler;

