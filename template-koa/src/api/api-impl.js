const AR = require('../common/api-response');

async function setup(koaApp) {
    // TODO: fill with setup logic
}

async function xxx1(ctx, next) {
    ctx.body = AR.ok({
        id: ctx.params['id'],
        name: 'My id1 is ' + ctx.params['id']
    });
}

async function xxx2(ctx, next) {
    ctx.body = AR.ok({
        id: ctx.params['id'],
        name: 'My id2 is ' + ctx.params['id']
    });
}

async function xxx3(ctx, next) {
    ctx.body = AR.ok({
        id: ctx.params['id'],
        name: 'My id3 is ' + ctx.params['id']
    });
}

module.exports = {
    setup: setup,
    xxx1: xxx1,
    xxx2: xxx2,
    xxx3: xxx3
}
