'use strict';

// ================ requires ===================
const xRequestId = require('koa-x-request-id');
const koaBodyParser = require('koa-bodyparser');
const koaLastRequest = require('@juntoz/koa-last-request');
const koaHealthProbe = require('@juntoz/koa-health-probe');

const AuthAdapter = require('./common/AuthAdapter.js');

function init(koaApp, moduleEntryPath) {
    // pre-processing
    initRequestInfo(koaApp);

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
    const apisetup = require.main.require(moduleEntryPath);
    if (!apisetup || typeof apisetup !== 'function') {
        throw new Error(`Api ${moduleEntryPath} could not be found or it was not a function`);
    } else {
        koaApp.log.debug(`Api ${moduleEntryPath} found`);
    }

    // call the api setup
    apisetup(koaApp);
    koaApp.log.info(`Api ${moduleEntryPath} loaded`);
}

function initTools(koaApp) {
    koaHealthProbe(koaApp);
}

module.exports = init;
