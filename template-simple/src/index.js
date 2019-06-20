'use strict';

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

// set logging
var logger = pino({
    level: argv.loglevel
});
logger.debug('index-logging: success');

var httpHandler = (req, res) => {
    logger.info('hello world');
    res.end('end');
};

// run
var listenToPort = argv.port;

if (argv.nohttps) {
    const http = require('http');
    http.createServer(httpHandler).listen(listenToPort);
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

    https.createServer(sslOptions, httpHandler).listen(listenToPort);
}

let protocol = argv.nohttps ? 'http' : 'https';
let ipaddr = ip.address();
logger.info(`index-start: success in ${protocol}://${ipaddr}:${listenToPort}`);

// cleanup
require('node-cleanup')((exitCode, signal) => {
    console.info(`index-end: with code ${exitCode} and signal ${signal}`);
});
