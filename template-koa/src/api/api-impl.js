const AR = require('../common/api-response');

async function setup(koaApp) {
    // TODO: fill with setup logic
}

function _handleAppErrorOrThrow(ctx, error) {
    if (error.name == 'AppError') {
        if (error.errorCode == 'ERR_GET_ID') {
            ctx.throw(404);
        } else {
            ctx.throw(400, error.toString());
        }
    } else {
        throw error;
    }
}

async function time(ctx, next) {
    try {
        ctx.body = AR.ok({
            id: ctx.params.id,
            name: new Date(),
            route: ctx._matchedRoute
        });
    } catch (error) {
        _handleAppErrorOrThrow(ctx, error);
    }
}

module.exports = {
    setup,
    time
};
