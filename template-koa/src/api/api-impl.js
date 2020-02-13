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

async function xxx1(ctx, next) {
    try {
        ctx.body = AR.ok({
            id: ctx.params.id,
            name: 'My id1 is ' + ctx.params.id
        });
    } catch (error) {
        _handleAppErrorOrThrow(ctx, error);
    }
}

async function xxx2(ctx, next) {
    try {
        ctx.body = AR.ok({
            id: ctx.params.id,
            name: 'Protected ' + ctx.params.id
        });
    } catch (error) {
        _handleAppErrorOrThrow(ctx, error);
    }
}

async function xxx3(ctx, next) {
    try {
        ctx.body = AR.ok({
            id: ctx.params.id,
            name: 'Protected and Role ' + ctx.params.id
        });
    } catch (error) {
        _handleAppErrorOrThrow(ctx, error);
    }
}

module.exports = {
    setup: setup,
    xxx1: xxx1,
    xxx2: xxx2,
    xxx3: xxx3
};
