'use strict';

// ================ requires ===================
const KoaPinoLogger = require('koa-pino-logger');
const xRequestId = require('koa-x-request-id');
const koaBodyParser = require('koa-bodyparser');
const koaLastRequest = require('koa-last-request');
const koaHealthProbe = require('koa-health-probe');

const AuthAdapter = require('./common/AuthAdapter.js');

function init(koaApp, moduleEntryPath, loglevel) {
    // pre-processing
    initRequestInfo(koaApp);

    initLog(koaApp, loglevel);
    initAuth(koaApp);

    // in-processing
    initRequestExec(koaApp);

    // load api
    initApi(koaApp, moduleEntryPath);

    // post-processing
    initTools(koaApp);
}

function initRequestInfo(koaApp) {
    // set request id
    koaApp.use(xRequestId({ noHyphen: true, inject: true }, koaApp));

    // gather info about the last request, ignore the koa-health-probe default path
    koaApp.use(koaLastRequest({ pathsToIgnore: ['tools/probe'] }));
}

function initLog(koaApp, loglevel) {
    // logging, tracer
    var kplmw = KoaPinoLogger({
        level: loglevel || 'info'
    });
    koaApp.use(kplmw);
    koaApp.log = kplmw.logger;
    koaApp.log.debug('Logging configured');
}

function initAuth(koaApp) {
    // configure authentication before routes
    var aa = new AuthAdapter();
    aa.setup(koaApp);
    koaApp.authAdapter = aa;
    koaApp.log.debug('Authentication configured');
}

function initRequestExec(koaApp) {
    // configure the body parser which will help parse the body and turn in json objects. form fields, etc.
    koaApp.use(koaBodyParser());
}

function initApi(koaApp, moduleEntryPath) {
    // load the api module from the index root
    const apiInit = require.main.require(moduleEntryPath);
    if (!apiInit) {
        throw new Error(`Api ${moduleEntryPath} could not be found`);
    } else {
        koaApp.log.debug(`Api ${moduleEntryPath} found`);
    }

    // call the api init
    apiInit(koaApp);
    koaApp.log.info(`Api ${moduleEntryPath} loaded`);
}

function initTools(koaApp) {
    koaHealthProbe(koaApp);
}

module.exports = init;
