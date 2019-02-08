'use strict';

// ================ requires ===================
const Koa = require('koa');
const KoaPinoLogger = require('koa-pino-logger');
const ip = require('ip');
const xRequestId = require('koa-x-request-id');
const nodeCleanup = require('node-cleanup');
const koaBodyParser = require('koa-bodyparser');
const koaLastRequest = require('koa-last-request');
const process = require('process');

const AuthAdapter = require('./common/AuthAdapter.js');
const ConfigReader = require('./common/ConfigReader.js');
const PathUtil = require('./common/PathUtil.js');
const loadType = require('./common/loadType.js');
const HealthProbeRouter = require('./common/probe.js');

// command args
const argv = require('yargs')
    .usage('Usage: $0 --module [module name] --config [config file path] --port [listen to port] --loglevel [log level]')
    .demandOption(['module', 'config', 'port'])
    .argv;

var cfg = null;
try {
    cfg = new ConfigReader(PathUtil.loadJson(argv.config), argv.module);
} catch (error) {
    console.error('Error config file ' + argv.config + ': ' + error.message);
    process.exit(1);
}

// ================ middleware ===================

// global app
const koaApp = new Koa();

// set request id
koaApp.use(xRequestId({ noHyphen: true, inject: true }, koaApp));

// gather info about the last request
koaApp.use(koaLastRequest({ pathsToIgnore: ['tools/probe'] }));

// read apiname (as log main pivot)
var apiName = cfg.readApiName() || argv.module;

var logLevel = (() => {
    // make sure argv loglevel has a real value, because it may be a real argument but have an empty value
    // make sure loglevel is a string because docker could send a value as 'true' when the env variable is not set
    if (typeof argv.loglevel === 'string' && argv.loglevel !== '') {
        return argv.loglevel;
    } else {
        return cfg.readLogLevel() || 'info';
    }
})();

// logging, tracer
var kplmw = KoaPinoLogger({
    name: apiName,
    level: logLevel
});
koaApp.use(kplmw);
koaApp.log = kplmw.logger;
koaApp.log.debug('Logging configured');

// trying to recap logging :) so we can use koaApp.log
koaApp.log.info('Api Name found %s', apiName);

// configure authentication before routes
var aa = new AuthAdapter();
aa.setup(koaApp);
koaApp.authAdapter = aa;
koaApp.log.debug('Authentication configured');

// configure the body parser which will help parse the body and turn in json objects. form fields, etc.
koaApp.use(koaBodyParser());

// load health probe
var probe = new HealthProbeRouter();
probe.setup(koaApp);

// load the given api type
var apiPath = cfg.readApiPath();
koaApp.log.trace('Api path (%s) trying to load ...', apiPath);
koaApp.apiController = loadType(apiPath);
if (!koaApp.apiController) {
    throw new Error('Api %s could not be loaded', apiName);
} else {
    koaApp.log.debug('Api %s loaded', apiName);
}

koaApp.apiController.setup(koaApp, cfg.readApiOptions());
koaApp.log.debug('Api %s configured', apiName);

// ================ run ===================
var listenToPort = argv.port;
koaApp.listen(listenToPort, () => {
    koaApp.log.info('Server %s listening on port %d', ip.address(), listenToPort);
});

// register cleanup events once the app is initialized
nodeCleanup((exitCode, signal) => {
    console.log(`Exiting with code ${exitCode} and signal ${signal}`);
});
