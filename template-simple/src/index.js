'use strict';

// *** simple app ***
// ================ requires ===================
const ip = require('ip');
const fs = require('fs');
const path = require('path');
const pino = require('pino');

// command args
// TIP: in dev environment, usually use nohttps=true so no cert is needed
const argv = require('yargs')
    .usage('Usage: $0 --port [listen to port] --loglevel [log level] --nohttps --env [dev or stg or prod]')
    .demandOption(['port'])
    .boolean('nohttps')
    .default('loglevel', 'info')
    .default('nohttps', false)
    .default('env', 'dev')
    .argv;

// set logging, in this case we are using pino library directly (not koa-pino)
var logger = pino({
    level: argv.loglevel
});
logger.debug('index-logging: success');

// set the main http handler
const httpHandler = require('./app');

// run
var listenToPort = argv.port;

var srv = null;
if (argv.nohttps) {
    const http = require('http');
    srv = http.createServer(httpHandler);
    srv._protocolName = 'http';
    logger.debug(`index-http: http server created`);
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

        logger.info(`index-cert: cert files success`, { paths: [keypath, crtpath] });
    } catch (error) {
        if (error.code === 'ENOENT') {
            logger.error(`index-cert: cert file ${error.path} not found`);
        }

        throw error;
    }

    srv = https.createServer(sslOptions, httpHandler);
    srv._protocolName = 'https';
    logger.debug(`index-http: https server created`);
}

srv.listen(listenToPort);
let fullAddr = `${srv._protocolName}://${ip.address()}:${listenToPort}`;
logger.info(`index-start: server listening in ${fullAddr}`);

// cleanup
require('node-cleanup')((exitCode, signal) => {
    console.info(`index-end: with code ${exitCode} and signal ${signal}`);
});
