'use strict';

// *** koa app ***
// ================ requires ===================
const Koa = require('koa');
const KoaPinoLogger = require('koa-pino-logger');
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

if (!argv.nohttps) {
    // setup sslify before any request, only if https is configured. This way any request is protected.
    // this will enforce https
    const koaSslify = require('koa-sslify').default;
    koaApp.use(koaSslify());
    koaApp.log.debug(`index-ssl: enforced`);
}

// init application
koaapp(koaApp, argv.module);

// run
var listenToPort = argv.port;

var srv = null;
if (argv.nohttps) {
    const http = require('http');
    srv = http.createServer(koaApp.callback());
    srv._protocolName = 'http';
    koaApp.log.debug(`index-http: http server created`);
} else {
    // TODO: Research SSL offloading with nginx
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

    srv = https.createServer(sslOptions, koaApp.callback());
    srv._protocolName = 'https';
    koaApp.log.debug(`index-http: https server created`);
}

srv.listen(listenToPort);
let fullAddr = `${srv._protocolName}://${ip.address()}:${listenToPort}`;
koaApp.log.info(`index-start: server listening in ${fullAddr}`);

// cleanup
require('node-cleanup')((exitCode, signal) => {
    console.info(`index-end: with code ${exitCode} and signal ${signal}`);
});
