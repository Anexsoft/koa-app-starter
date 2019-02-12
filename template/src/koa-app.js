'use strict';

// ================ requires ===================
const xRequestId = require('koa-x-request-id');
const koaBodyParser = require('koa-bodyparser');

const koaLastRequest = require('@juntoz/koa-last-request');
const koaHealthProbe = require('@juntoz/koa-health-probe');

const passportSetup = require('./common/passport-adapter.js').passportSetup;

function init(koaApp, moduleEntryPath) {
    // pre-processing
    _initRequestPrepare(koaApp);

    // authenticator
    _initAuth(koaApp);

    // in-processing
    _initRequestExec(koaApp);

    // load api
    _initApi(koaApp, moduleEntryPath);

    // post-processing
    _initTools(koaApp);
}

function _initRequestPrepare(koaApp) {
    // set request id
    koaApp.use(xRequestId({ noHyphen: true, inject: true }, koaApp));

    // gather info about the last request, ignore the koa-health-probe default path
    koaApp.use(koaLastRequest({ pathsToIgnore: ['tools/probe'] }));
}

function _initAuth(koaApp) {
    passportSetup(koaApp, {
        whoIssuedTheToken: 'juntoz.com',
        keyToEncryptTheToken: 'mykey',
        whoUsesTheToken: 'juntoz.com'
    });
    koaApp.log.debug('Authentication configured');
}

function _initRequestExec(koaApp) {
    // configure the body parser which will help parse the body and turn in json objects. form fields, etc.
    koaApp.use(koaBodyParser());
}

function _initApi(koaApp, moduleEntryPath) {
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

function _initTools(koaApp) {
    koaHealthProbe(koaApp);
}

module.exports = init;
