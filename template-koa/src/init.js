const koaHealthProbe = require('@juntoz/koa-health-probe');
const koaPackInfo = require('@juntoz/koa-package-info');
const config = require('config');
const _initAuthJwt = require('./init-auth-jwt');

async function init(koaApp, moduleEntryPath) {
    // pre-processing
    await _pre(koaApp);

    // auth
    await _initAuth(koaApp);

    // api
    await _initApi(koaApp, moduleEntryPath);

    // post-processing
    _post(koaApp);
}

async function _pre(koaApp) {
    // set request id
    const xRequestId = require('koa-x-request-id');
    koaApp.use(xRequestId({ noHyphen: true, inject: true }, koaApp));
    koaApp.log.debug('app-xrequestid: success');

    // gather info about the last request, ignore the koa-health-probe default path
    const koaLastRequest = require('@juntoz/koa-last-request');
    koaApp.use(koaLastRequest({ pathsToIgnore: [koaHealthProbe.defaultPath] }));
    koaApp.log.debug('app-lastrequest: success');

    // configure the body parser which will help parse the body and turn in json objects. form fields, etc.
    const koaBodyParser = require('koa-bodyparser');
    koaApp.use(koaBodyParser());
    koaApp.log.debug('app-bodyparser: success');
}

async function _initAuth(koaApp) {
    if (config.has('auth')) {
        await _initAuthJwt(koaApp, config.get('auth'));
        koaApp.log.debug('passport-setup: jwt success');
    } else {
        koaApp.log.info('passport-setup: anonymous access');
    }
}

async function _initApi(koaApp, modulePath) {
    // load the api module from the index root
    const moduleSetup = require.main.require(modulePath);
    if (!moduleSetup || typeof moduleSetup !== 'function') {
        throw new Error(`app-api: ${modulePath} not found or not a function`);
    } else {
        koaApp.log.debug(`app-api: ${modulePath} found`);
    }

    // call the api setup
    await moduleSetup(koaApp);
    koaApp.log.info(`app-api: ${modulePath} success`);
}

function _post(koaApp) {
    koaHealthProbe(koaApp);
    koaApp.log.debug('app-probe: success');

    koaPackInfo(koaApp, {
        pathToPackageJson: '../package.json'
    });
    koaApp.log.debug('app-packinfo: success');
}

module.exports = init;
