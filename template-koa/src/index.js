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
// set the environment name in the global object so the entire program can read it
process.env.NODE_CONFIG_ENV = global.env = argv.env;
// tell to the CONFIG module to load files from this folder
process.env.NODE_CONFIG_DIR = path.resolve(__dirname, '../config');

// global app
const Koa = require('koa');
const koaApp = new Koa();

const appInit = require('./init');

// init application
appInit(koaApp, argv.module, argv.loglevel);
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
