'use strict';

// ================ requires ===================
const Koa = require('koa');
const KoaPinoLogger = require('koa-pino-logger');
const koaSslify = require('koa-sslify').default;
const ip = require('ip');
const fs = require('fs');
const path = require('path');

const koaapp = require('./koa-app.js');

// command args
// TIP: in dev environment, usually use nohttps=true so no cert is needed
const argv = require('yargs')
    .usage('Usage: $0 --port [listen to port] --module [module entry path] --loglevel [log level] --nohttps --env [dev or stg or prod]')
    .demandOption(['port'])
    .boolean('nohttps')
    .default('module', './api/api.js')
    .default('loglevel', 'info')
    .default('nohttps', false)
    .default('env', 'dev')
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

// setup sslify before any request, only if https is configured. This way any request is protected.
if (!argv.nohttps) {
    koaApp.use(koaSslify());
}

// init application
koaapp(koaApp, argv.module);

// run
var listenToPort = argv.port;
var server = null;
if (argv.nohttps) {
    const http = require('http');
    server = http.createServer(koaApp.callback()).listen(listenToPort);
} else {
    const https = require('https');

    var sslOptions = null;
    try {
        // assume the cert folder is next to the current index file
        var certfolder = path.resolve(__dirname, 'cert', argv.env);

        var keypath = path.resolve(certfolder, 'server.key');
        var crtpath = path.resolve(certfolder, 'server.crt');

        sslOptions = {
            key: fs.readFileSync(keypath),
            cert: fs.readFileSync(crtpath)
        };

        koaApp.log.info(`index-cert: cert files success`, { paths: [keypath, crtpath] });
    } catch (error) {
        if (error.code === 'ENOENT') {
            koaApp.log.error(`index-cert: cert file ${error.path} not found`);
        }

        throw error;
    }

    server = https.createServer(sslOptions, koaApp.callback()).listen(listenToPort);
}

let protocol = argv.nohttps ? 'http' : 'https';
let ipaddr = ip.address();
koaApp.log.info(`index-start: success in ${protocol}://${ipaddr}:${listenToPort}`);

// cleanup
require('node-cleanup')((exitCode, signal) => {
    console.info(`index-end: with code ${exitCode} and signal ${signal}`);
});
