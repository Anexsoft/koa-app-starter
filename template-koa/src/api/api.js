'use strict';

const KoaRouter = require('koa-router');

/**
 * Setup the api (config and routes)
 * @param {*} koaApp Current koa application that will contain this api
 * @param {*} config Configuration
 */
async function setup(koaApp) {
    // setup the routes
    _setupRoutes(koaApp);
}

function _setupRoutes(koaApp) {
    var koaRouter = new KoaRouter();

    // TODO: setup routes
    __setupRoutes(koaApp, koaRouter);

    koaApp
        .use(koaRouter.routes())
        .use(koaRouter.allowedMethods());
    koaApp.log.debug('api-routes: success');
}

function __setupRoutes(koaApp, koaRouter) {
    // TODO: these are examples, you should use them as basis, and then delete them

    // unprotected endpoint
    koaRouter
        .get('/xxx/:id', async function(ctx, next) {
            ctx.log.debug('getXXXById-api: start', ctx.params);
            ctx.body = {
                id: ctx.params['id'],
                name: '1 my real name is ' + ctx.params['id']
            };

            await next();
        });

    // protected endpoint + user, note that 'passportJwtAuthenticate' is used as a pre-step to the real action
    koaRouter
        .get('/xxx2/:id', koaApp.passportUtil.authenticate, async function(ctx, next) {
            ctx.log.debug('getXXX2ById-api: start', ctx.params);
            ctx.body = {
                id: ctx.params['id'],
                name: '2 my real name is ' + ctx.params['id']
            };

            await next();
        });

    // protected endpoint + roles, validate the user and also which roles that user has
    koaRouter
        .get('/xxx3/:id', koaApp.passportUtil.authenticate, koaApp.passportUtil.generateValidateRoles(['admin']), async function(ctx, next) {
            ctx.log.debug('getXXX3ById-api: start', ctx.params);
            ctx.body = {
                id: ctx.params['id'],
                name: 'my real name is ' + ctx.params['id']
            };

            await next();
        });
}

module.exports = setup;
