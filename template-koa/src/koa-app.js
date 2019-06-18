'use strict';

// ================ requires ===================
const xRequestId = require('koa-x-request-id');
const koaBodyParser = require('koa-bodyparser');
const compress = require('koa-compress');

const koaLastRequest = require('@juntoz/koa-last-request');
const koaHealthProbe = require('@juntoz/koa-health-probe');

function init(koaApp, moduleEntryPath, options) {
    options = options || {};

    // pre-processing
    _initRequestPrepare(koaApp, options);

    // api
    _initApi(koaApp, moduleEntryPath);

    // post-processing
    _initTools(koaApp);
}

function _initRequestPrepare(koaApp, options) {
    // set request id
    koaApp.use(xRequestId({ noHyphen: true, inject: true }, koaApp));
    koaApp.log.debug('app-xrequestid: success');

    // gather info about the last request, ignore the koa-health-probe default path
    koaApp.use(koaLastRequest({ pathsToIgnore: ['tools/probe'] }));
    koaApp.log.debug('app-lastrequest: success');

    // configure the body parser which will help parse the body and turn in json objects. form fields, etc.
    koaApp.use(koaBodyParser());
    koaApp.log.debug('app-bodyparser: success');

    // configure compress for text and json content types
    if (options.compress) {
        koaApp.use(compress({
            threshold: 2048,
            flush: require('zlib').Z_SYNC_FLUSH
        }));
        koaApp.log.debug('app-compress: success');
    }
}

function _initApi(koaApp, moduleEntryPath) {
    // load the api module from the index root
    const moduleSetup = require.main.require(moduleEntryPath);
    if (!moduleSetup || typeof moduleSetup !== 'function') {
        throw new Error(`app-api: ${moduleEntryPath} not found or not a function`);
    } else {
        koaApp.log.trace(`app-api: ${moduleEntryPath} found`);
    }

    // call the api setup
    moduleSetup(koaApp);
    koaApp.log.info(`app-api: ${moduleEntryPath} success`);
}

function _initTools(koaApp) {
    koaHealthProbe(koaApp);
    koaApp.log.debug('app-probe: success');
}

module.exports = init;
