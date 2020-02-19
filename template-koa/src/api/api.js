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
        .get('/free/:id', apiImpl.time)
        // protected endpoint with token (could be client_credentials or sub-based)
        .get('/token/:id', koaApp.pptMW.getAuthenticate(), apiImpl.time)
        // protected endpoint with token and roles
        .get('/roles/:id', koaApp.pptMW.getAuthenticate(), koaApp.pptMW.getAuthorizeRoles(['admin']), apiImpl.time)
        // protected endpoint with token and sub (you can add roles if needed too)
        .get('/sub/:id', koaApp.pptMW.getAuthenticate(), koaApp.pptMW.getRequiresSub(), apiImpl.time);

    koaApp
        .use(koaRouter.routes())
        .use(koaRouter.allowedMethods());
    koaApp.log.debug('api-routes: success');
}

module.exports = setup;
