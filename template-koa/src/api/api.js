const KoaRouter = require('koa-router');
const apiImpl = require('./api-impl');

async function setup(koaApp) {
    // setup the routes
    _setupRoutes(koaApp);

    await apiImpl.setup(koaApp);
}

function _setupRoutes(koaApp) {
    var koaRouter = new KoaRouter();

    // TODO: setup routes
    koaRouter
        // unprotected endpoint
        .get('/xxx/:id', apiImpl.xxx1)
        // protected endpoint with token
        .get('/xxx2/:id', koaApp.pptMW.getAuthenticate(), apiImpl.xxx2)
        // protected endpoint with token and roles
        .get('/xxx3/:id', koaApp.pptMW.getAuthenticate(), koaApp.pptMW.getAuthorizeRoles(['admin']), apiImpl.xxx3);

    koaApp
        .use(koaRouter.routes())
        .use(koaRouter.allowedMethods());
    koaApp.log.debug('api-routes: success');
}

module.exports = setup;
