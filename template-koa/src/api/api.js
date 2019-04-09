'use strict';

const KoaRouter = require('koa-router');
const _merge = require('lodash.merge');

const loadConfig = require('../common/load-config.js');
const passportSetup = require('../passport/passport-adapter.js').setup;
const passportJwtSetup = require('../passport/passport-strategy-jwt.js').setup;
const passportJwtAuthenticate = require('../passport/passport-strategy-jwt.js').authenticate;
const passportJwtAuthorizeMw = require('../passport/passport-strategy-jwt.js').buildAuthorizeMw;

// configKey: key to obtain the config object
// eslint-disable-next-line no-unused-vars
var configKey = null;

// #### DEFINE HERE YOUR APIs AND DBs ####
const db = require('./db.js');

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

    // setup the authentication
    _setupAuth(koaApp);

    // setup the routes
    _setupRoutes(koaApp);

    // setup the db layer
    db.setup(koaApp, config);
}

function _setupConfig(koaApp, config) {
    // resolve options
    var defaultOptions = { /* TODO: set the default options for this api */ };
    config.options = _merge(defaultOptions, config.options);

    // store the config for future reference
    koaApp.config[configKey = config.name] = config;
    koaApp.log.debug('api-config: success');
}

function _setupAuth(koaApp) {
    // set the passport basis
    // TODO: change function to convert from payload to user object
    var passport = passportSetup(koaApp, (payload) => payload);

    // set the strategy
    var jwtcfg = koaApp.config[configKey].auth.jwt;
    passportJwtSetup(koaApp, passport, {
        whoIssuedTheToken: jwtcfg.whoIssuedTheToken,
        keyToEncryptTheToken: jwtcfg.keyToEncryptTheToken,
        whoUsesTheToken: jwtcfg.whoUsesTheToken
    });

    koaApp.log.debug('api-auth: success');
}

function _setupRoutes(koaApp) {
    var koaRouter = new KoaRouter();
    koaApp.router = koaRouter;

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
            var xxxData = await db.getXXXById(ctx.app, ctx.params['id']);
            if (xxxData) {
                ctx.body = xxxData;
            } else {
                ctx.throw(404);
            }

            await next();
        });

    // protected endpoint + user, note that 'passportJwtAuthenticate' is used as a pre-step to the real action
    koaRouter
        .get('/xxx2/:id', passportJwtAuthenticate, async function(ctx, next) {
            ctx.log.debug('getXXX2ById-api: start', ctx.params);
            ctx.body = {
                id: ctx.params['id'],
                name: 'my real name is ' + ctx.params['id']
            };

            await next();
        });

    // protected endpoint + roles, validate the user and also which roles that user has
    koaRouter
        .get('/xxx3/:id', passportJwtAuthenticate, passportJwtAuthorizeMw(['admin']), async function(ctx, next) {
            ctx.log.debug('getXXX3ById-api: start', ctx.params);
            ctx.body = {
                id: ctx.params['id'],
                name: 'my real name is ' + ctx.params['id']
            };

            await next();
        });
}

module.exports = setup;
