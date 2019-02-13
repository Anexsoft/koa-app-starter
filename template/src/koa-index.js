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
    .default('module', './api/api.js')
    .default('loglevel', 'info')
    .argv;

// global app
const koaApp = new Koa();

// create a config repository so the APIs can store and quick reference that
koaApp.config = [];

// set logging
var kplmw = KoaPinoLogger({
    level: argv.loglevel
});
koaApp.use(kplmw);
koaApp.log = kplmw.logger;
koaApp.log.debug('index-logging: success');

// init application
koaapp(koaApp, argv.module);

// run
var listenToPort = argv.port;
koaApp.listen(listenToPort, () => {
    koaApp.log.info(`index-start: success in ${ip.address()}:${listenToPort}`);
});

// cleanup
require('node-cleanup')((exitCode, signal) => {
    console.info(`index-end: with code ${exitCode} and signal ${signal}`);
});
