'use strict';

const KoaRouter = require('koa-router');
const _merge = require('lodash.merge');

const loadConfig = require('../common/load-config.js');
const koaMsSql = require('../common/koa-get-mssql');
const db = require('./db.js');
const passportAuth = require('../common/passport-adapter.js').passportAuth;

/**
 * Setup the api (config and routes)
 * @param {*} koaApp Current koa application that will contain this api
 * @param {*} config Configuration
 */
function setup(koaApp, config) {
    if (config == null) {
        try {
            config = loadConfig(__dirname);
        } catch (error) {
            throw new Error('Config object was null, and config file was not loaded. ' + error.message);
        }
    }

    // read the config
    _setupConfig(koaApp, config);

    // setup the routes
    _setupRoutes(koaApp);

    // setup the db connection
    koaMsSql(koaApp, config.connectionObject);
}

function _setupConfig(koaApp, config) {
    var defaultOptions = { /* TODO: set the default options for this api */ };

    config.options = _merge(defaultOptions, config.options);

    // store the options for quick reference
    koaApp.config[config.name] = config;
    return koaApp.config[config.name];
}

function _setupRoutes(koaApp) {
    var koaRouter = new KoaRouter();
    koaApp.router = koaRouter;

    // TODO: setup routes
    __setupRoutes(koaApp, koaRouter);

    koaApp
        .use(koaRouter.routes())
        .use(koaRouter.allowedMethods());
    koaApp.log.debug('Routes configured');
}

function __setupRoutes(koaApp, koaRouter) {
    // TODO: these are examples, you should use them as basis, and then delete them

    // unprotected endpoint
    koaRouter
        .get('/xxx/:id', async function(ctx, next) {
            ctx.log.debug('getXXXById-api: start', ctx.params);
            var xxxData = await db.getXXXById(ctx.app, ctx.params['id']);
            if (xxxData) {
                ctx.body = xxxData;
            } else {
                ctx.status = 404;
                ctx.body = {};
            }

            await next();
        });

    // protected endpoint, note that 'passportAuth' is used as a pre-step to the real action
    koaRouter
        .get('/xxx2/:id', passportAuth, async function(ctx, next) {
            ctx.log.debug('getXXX2ById-api: start', ctx.params);
            ctx.body = {
                id: ctx.params['id'],
                name: 'my real name is ' + ctx.params['id']
            };

            await next();
        });
}

module.exports = setup;
