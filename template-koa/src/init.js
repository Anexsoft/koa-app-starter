'use strict';

const path = require('path');
const fs = require('fs-extra');
const _merge = require('lodash.merge');
const xRequestId = require('koa-x-request-id');
const koaBodyParser = require('koa-bodyparser');
const koaLastRequest = require('@juntoz/koa-last-request');
const koaHealthProbe = require('@juntoz/koa-health-probe');

async function init(koaApp, moduleEntryPath, options) {
    options = options || {};

    // pre-processing
    _initRequestPrepare(koaApp, options);

    // api
    await _initApi(koaApp, moduleEntryPath);

    // post-processing
    _initTools(koaApp);
}

function _initRequestPrepare(koaApp, options) {
    // set request id
    koaApp.use(xRequestId({ noHyphen: true, inject: true }, koaApp));
    koaApp.log.debug('app-xrequestid: success');

    // gather info about the last request, ignore the koa-health-probe default path
    koaApp.use(koaLastRequest({ pathsToIgnore: [koaHealthProbe.defaultPath] }));
    koaApp.log.debug('app-lastrequest: success');

    // configure the body parser which will help parse the body and turn in json objects. form fields, etc.
    koaApp.use(koaBodyParser());
    koaApp.log.debug('app-bodyparser: success');
}

async function _initApi(koaApp, modulePath) {
    // load the api module from the index root
    const moduleSetup = require.main.require(modulePath);
    if (!moduleSetup || typeof moduleSetup !== 'function') {
        throw new Error(`app-api: ${modulePath} not found or not a function`);
    } else {
        koaApp.log.trace(`app-api: ${modulePath} found`);
    }

    // load the api config
    var configPath = path.join(__dirname, 'config.json');
    var loadedCfg = await fs.readJson(configPath);
    koaApp.cfg = _merge(_defaultConfig(), loadedCfg);

    // call the api setup
    await moduleSetup(koaApp);
    koaApp.log.info(`app-api: ${modulePath} success`);
}

function _defaultConfig() {
    return {
        name: null,
        auth: {
            jwt: {
                whoIssuedTheToken: null,
                keyToEncryptTheToken: null,
                whoUsesTheToken: null            
            }
        }
    };
}

function _initTools(koaApp) {
    koaHealthProbe(koaApp);
    koaApp.log.debug('app-probe: success');
}

module.exports = init;
