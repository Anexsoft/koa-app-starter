const path = require('path');

// command args
const argv = require('yargs')
    .usage('Usage: $0 --port [listen to port] --module [module entry path] --loglevel [log level] --env [dev or stg or prod]')
    .demandOption(['port'])
    .default('module', './api/api.js')
    .demandOption(['module'])
    .default('loglevel', 'info')
    .choices('loglevel', ['debug', 'info', 'warn', 'error'])
    .default('env', 'dev')
    .choices('env', ['dev', 'stg', 'prod'])
    .argv;

// https://github.com/lorenwest/node-config
// tell to the CONFIG module to load the config file based on the environment that is running
process.env.NODE_CONFIG_ENV = argv.env;
// tell to the CONFIG module to load files from this folder
process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../config');

// global app
const Koa = require('koa');
const koaHealthProbe = require('@juntoz/koa-health-probe');
const koaApp = new Koa();

// set the environment name in the global object so the entire program can read it
global.env = argv.env;

// set logging
const KoaPinoLogger = require('@juntoz/koa-pino-logger');
var kplmw = KoaPinoLogger({
    level: argv.loglevel,
    autoLogging: {
        ignorePaths: [koaHealthProbe.defaultPath]
    }
});
koaApp.use(kplmw);
koaApp.log = kplmw.logger;
koaApp.log.debug('index-logging: success');

const config = require('config');
koaApp.log.trace('index-config: config sources object', config.util.getConfigSources());
koaApp.log.info(`index-config: success, app (${config.get('name')},${global.env})`);

// init application
const appInit = require('./init');
appInit(koaApp, argv.module);
koaApp.log.debug('index-app: success');

// run
var srv = require('http').createServer(koaApp.callback());
srv._protocolName = 'http';
koaApp.log.debug('index-http: http server created');
srv.listen(argv.port);
const fullAddr = `${srv._protocolName}://${require('ip').address()}:${argv.port}`;
koaApp.log.info(`index-start: server listening in ${fullAddr}`);

// cleanup
require('node-cleanup')((exitCode, signal) => {
    console.info(`index-end: with code ${exitCode} and signal ${signal}`);
});
