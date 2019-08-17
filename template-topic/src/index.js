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

    logger.debug('index-app: setup start');
    var ret = appHandler.setup(busCtx.options);
    if (ret) {
        // if the method returns a value, assign it so the options can carry more stuff if needed
        busCtx.options = ret;
    }
    logger.info('index-app: setup done');

    busCtx.sbClient = ServiceBusClient.createFromConnectionString(busCtx.options.cs);
    logger.info(`index-bus ${busCtx.options.topic}/${busCtx.options.subscription}: bus client connected ${busCtx.options.cs}`);

    busCtx.subsClient = busCtx.sbClient.createSubscriptionClient(busCtx.options.topic, busCtx.options.subscription);
    logger.info(`index-bus ${busCtx.options.topic}/${busCtx.options.subscription}: subscription client connected `);

    busCtx.receiver = busCtx.subsClient.createReceiver(appHandler.getReceiveMode());
    logger.info(`index-bus ${busCtx.options.topic}/${busCtx.options.subscription}: receiver connected`);

    // The message handler should keep the loop running and block the exit
    busCtx.receiver.registerMessageHandler(async (msg) => {
        logger.info(`index-message ${busCtx.options.topic}/${busCtx.options.subscription}: message received`);
        await appHandler.onMessage(busCtx, msg);
        logger.info(`index-message ${busCtx.options.topic}/${busCtx.options.subscription}: message done`);
    }, async (err) => {
        logger.error('index-message: error', err);
        await appHandler.onError(busCtx, err);
    },
        appHandler.getMessageHandlerOptions()
    );
    logger.info(`index-bus ${busCtx.options.topic}/${busCtx.options.subscription}: registered message handler. Waiting ...`);
}

main()
    .catch(err => {
        logger.error(err);
    })
    .finally(async () => {
        busCtx.receiver ? await busCtx.receiver.close() : null;
        busCtx.subsClient ? await busCtx.subsClient.close() : null;
        busCtx.sbClient ? await busCtx.sbClient.close() : null;
    });
