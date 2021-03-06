const koaHealthProbe = require('@juntoz/koa-health-probe');
const koaPackInfo = require('@juntoz/koa-package-info');
const config = require('config');
const _initAuthJwt = require('./init-auth-jwt');
const koaRequireHeader = require('@juntoz/koa-require-header');

async function init(koaApp, moduleEntryPath, loglevel) {
    // set logging
    setLog(koaApp, loglevel);

    // load config
    loadConfig(koaApp);

    // pre-processing
    await _pre(koaApp);

    // auth
    await _initAuth(koaApp);

    // api
    await _initApi(koaApp, moduleEntryPath);

    // post-processing
    _post(koaApp);
}

function setLog(koaApp, loglevel) {
    const KoaPinoLogger = require('@juntoz/koa-pino-logger');
    var kplmw = KoaPinoLogger({
        level: loglevel,
        autoLogging: {
            ignorePaths: [koaHealthProbe.defaultPath]
        }
    });
    koaApp.use(kplmw);
    koaApp.log = kplmw.logger;
    koaApp.log.debug('index-log: success');
}

function loadConfig(koaApp) {
    const config = require('config');
    koaApp.log.trace('app-config: config sources object', config.util.getConfigSources());

    koaApp.getAppName = () => config.get('name');
    koaApp.log.info(`app-config: success, app (${koaApp.getAppName()},${global.env})`);
}

async function _pre(koaApp) {
    // set request id
    const xRequestId = require('koa-x-request-id');
    koaApp.use(xRequestId({ noHyphen: true, inject: true }, koaApp));
    koaApp.log.debug('app-xrequestid: success');

    // set cors allow access control allow origin.
    const cors = require('@koa/cors');
    koaApp.use(cors());

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
    // require a header and store in ctx.state
    if (config.has('requireHeader.headerName')) {
        var requireHeaderName = config.get('requireHeader.headerName');
        if (requireHeaderName) {
            koaApp.use(koaRequireHeader({
                headerName: requireHeaderName,
                ignorePaths: [koaHealthProbe.defaultPath, koaPackInfo.defaultPath]
            }));
            koaApp.log.debug('app-require-header: success');
        } else {
            koaApp.log.debug('app-require-header: deactivated');
        }
    }

    if (config.has('auth')) {
        await _initAuthJwt(koaApp, config.get('auth'));
    } else {
        koaApp.log.warn('passport-setup: anonymous access');
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

    koaPackInfo(koaApp, { pathToPackageJson: '../package.json' });
    koaApp.log.debug('app-packinfo: success');
}

module.exports = init;