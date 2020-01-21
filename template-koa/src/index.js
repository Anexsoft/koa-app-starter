'use strict';

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

// global app
const Koa = require('koa');
const koaApp = new Koa();

// create a config repository so the APIs can store and quick reference that
koaApp.config = [];

// set logging
const KoaPinoLogger = require('koa-pino-logger');
var kplmw = KoaPinoLogger({ level: argv.loglevel });
koaApp.use(kplmw);
koaApp.log = kplmw.logger;
koaApp.log.debug('index-logging: success');

// init application
const appInit = require('./init.js/index.js');
appInit(koaApp, argv.module);

// run
var srv = require('http').createServer(koaApp.callback());
srv._protocolName = 'http';
koaApp.log.debug(`index-http: http server created`);
srv.listen(argv.port);
let fullAddr = `${srv._protocolName}://${require('ip').address()}:${argv.port}`;
koaApp.log.info(`index-start: server listening in ${fullAddr}`);

// cleanup
require('node-cleanup')((exitCode, signal) => {
    console.info(`index-end: with code ${exitCode} and signal ${signal}`);
});
