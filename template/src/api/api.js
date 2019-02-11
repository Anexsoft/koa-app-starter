'use strict';

const KoaRouter = require('koa-router');
const _merge = require('lodash.merge');
const loadConfig = require('../common/load-config.js');
const koaMsSql = require('../common/koa-get-mssql');
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

    // setup the routes
    _setupRoutes(koaApp);

    // setup the db connection
    koaMsSql(koaApp, config.connectionObject);
}

function _setupConfig(koaApp, config) {
    var defaultOptions = {
        // TODO: set the default options which vary across apis
    };

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
    koaRouter
        .get('/xxx/:id', getXXXById);
}

async function getXXXById(ctx, next) {
    // TODO: handle the route

    // get rest params
    var restParams = ctx.params;
    var xxxId = ctx.params['id'];
    ctx.log.debug('getXXXById-api: start', restParams);

    var xxxData = await db.getXXXById(ctx.app, xxxId);
    if (xxxData) {
        ctx.body = xxxData;
    } else {
        ctx.status = 404;
        ctx.body = {};
    }

    // TODO: should you call next or not? (calling next is when the ctx.body is not set or finished)
    await next();
}

module.exports = setup;
