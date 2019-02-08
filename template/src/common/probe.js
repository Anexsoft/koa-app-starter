'use strict';

const KoaRouter = require('koa-router');
const process = require('process');

class HealthProbeRouter {
    setup(koaApp) {
        var koaRouter = new KoaRouter();
        koaRouter
            .get('/tools/probe', async(ctx, next) => {
                ctx.body = {
                    result: 'OK',
                    pid: process.pid,
                    ts: ctx.app.lastRequest.timestamp
                };

                await next();
            });

        koaApp
            .use(koaRouter.routes())
            .use(koaRouter.allowedMethods());
        koaApp.log.debug('Probe configured');
    }
}

module.exports = HealthProbeRouter;
