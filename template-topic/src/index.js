const { ServiceBusClient } = require("@azure/service-bus");
const pino = require('pino');
const AppMessageHandler = require('./app.js');

const argv = require('yargs')
    .usage('Usage: $0 --cs [azure service bus connection string] --top [topic name] --sub [subscription name to the topic] --loglevel [log level]')
    .demandOption('cs')
    .demandOption('top')
    .demandOption('sub')
    .default('loglevel', 'info')
    .argv;

// set logging, in this case we are using pino library directly (not koa-pino)
var logger = pino({
    level: argv.loglevel
});
logger.debug('index-logging: success');

// context object
var busCtx = {
    options: {
        cs: argv.cs,
        topic: argv.top,
        subscription: argv.sub
    },
    logger: logger
};

async function main() {
    var appHandler = new AppMessageHandler();

    appHandler.setup(busCtx);
    logger.info('index-app: setup done');

    busCtx.sbClient = ServiceBusClient.createFromConnectionString(busCtx.options.cs);
    logger.info(`index-bus ${busCtx.options.topic}/${busCtx.options.subscription}: bus client connected ${busCtx.options.cs}`);

    busCtx.subsClient = busCtx.sbClient.createSubscriptionClient(busCtx.options.topic, busCtx.options.subscription);
    logger.info(`index-bus ${busCtx.options.topic}/${busCtx.options.subscription}: subscription client connected `);

    busCtx.receiver = busCtx.subsClient.createReceiver(appHandler.getReceiveMode());
    logger.info(`index-bus ${busCtx.options.topic}/${busCtx.options.subscription}: receiver connected`);

    // The message handler should keep the loop running and block the exit
    busCtx.receiver.registerMessageHandler(async (msg) => {
        logger.info(`index-message ${busCtx.options.topic}/${busCtx.options.subscription}: message received id ${msg.messageId} seq ${msg.sequenceNumber}`);
        await appHandler.onMessage(busCtx, msg);
        logger.info(`index-message ${busCtx.options.topic}/${busCtx.options.subscription}: message done id ${msg.messageId} seq ${msg.sequenceNumber}`);
    }, async (err) => {
        logger.error(`index-message: error id ${msg.messageId} seq ${msg.sequenceNumber}`, err);
        await appHandler.onError(busCtx, err);
    },
        appHandler.getMessageHandlerOptions()
    );
    logger.info(`index-bus ${busCtx.options.topic}/${busCtx.options.subscription}: registered message handler. Waiting ...`);
}

main()
    .catch(err => {
        logger.error(err);
    });

// TODO: verify if cleanup works
/*
require('node-cleanup')((exitCode, signal) => {
    try {
        busCtx.receiver ? await busCtx.receiver.close() : null;
        console.info(`index-end: clean receiver`);
    } catch (error) {
        console.info(`index-end: clean receiver error ${error.message}`);
    }

    try {
        busCtx.subsClient ? await busCtx.subsClient.close() : null;
        console.info(`index-end: clean subsClient`);
    } catch (error) {
        console.info(`index-end: clean subsClient error ${error.message}`);
    }

    try {
        busCtx.sbClient ? await busCtx.sbClient.close() : null;
        console.info(`index-end: clean sbClient`);
    } catch (error) {
        console.info(`index-end: clean sbClient error ${error.message}`);
    }

    console.info(`index-end: with code ${exitCode} and signal ${signal}`);
});
*/
