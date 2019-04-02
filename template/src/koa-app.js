'use strict';

// ================ requires ===================
const xRequestId = require('koa-x-request-id');
const koaBodyParser = require('koa-bodyparser');
const compress = require('koa-compress');

const koaLastRequest = require('@juntoz/koa-last-request');
const koaHealthProbe = require('@juntoz/koa-health-probe');

function init(koaApp, moduleEntryPath) {
    // pre-processing
    _initRequestPrepare(koaApp);

    // api
    _initApi(koaApp, moduleEntryPath);

    // post-processing
    _initTools(koaApp);
}

function _initRequestPrepare(koaApp) {
    // set request id
    koaApp.use(xRequestId({ noHyphen: true, inject: true }, koaApp));
    koaApp.log.debug('app-xrequestid: success');

    // gather info about the last request, configure to ignore the koa-health-probe default path
    koaApp.use(koaLastRequest({ pathsToIgnore: ['tools/probe'] }));
    koaApp.log.debug('app-lastrequest: success');

    // configure the body parser which will help parse the body and turn in json objects. form fields, etc.
    koaApp.use(koaBodyParser());
    koaApp.log.debug('app-bodyparser: success');
    koaApp.use(compress({
        threshold: 2048,
        flush: require('zlib').Z_SYNC_FLUSH
    }));
    koaApp.log.debug('app-compress: success');
}

function _initApi(koaApp, moduleEntryPath) {
    // load the api module from the index root
    const apisetup = require.main.require(moduleEntryPath);
    if (!apisetup || typeof apisetup !== 'function') {
        throw new Error(`app-api: ${moduleEntryPath} not found or not a function`);
    } else {
        koaApp.log.trace(`app-api: ${moduleEntryPath} found`);
    }

    // call the api setup
    apisetup(koaApp);
    koaApp.log.info(`app-api: ${moduleEntryPath} success`);
}

function _initTools(koaApp) {
    koaHealthProbe(koaApp);
    koaApp.log.debug('app-probe: success');
}

module.exports = init;
