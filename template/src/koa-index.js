'use strict';

// ================ requires ===================
const Koa = require('koa');
const KoaPinoLogger = require('koa-pino-logger');
const ip = require('ip');
const koaapp = require('./koa-app.js');

// command args
const argv = require('yargs')
    .usage('Usage: $0 --port [listen to port] --module [module entry path] --loglevel [log level]')
    .demandOption(['port'])
    .argv;

// global app
const koaApp = new Koa();

// create a config repository so the APIs can store and quick reference that
koaApp.config = [];

// set the default module
argv.module = argv.module || './api/api.js';

// set logging
var loglevel = argv.loglevel || 'info';
var kplmw = KoaPinoLogger({
    level: loglevel
});
koaApp.use(kplmw);
koaApp.log = kplmw.logger;
koaApp.log.debug('Logging configured');

// init
koaapp(koaApp, argv.module);

// run
var listenToPort = argv.port;
koaApp.listen(listenToPort, () => {
    koaApp.log.info(`Server ${ip.address()} listening on port ${listenToPort}`);
});

// cleanup
require('node-cleanup')((exitCode, signal) => {
    console.info(`Exit with code ${exitCode} and signal ${signal}`);
});
