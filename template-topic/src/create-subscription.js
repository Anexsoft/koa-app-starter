const { ServiceBusService } = require('azure-sb');
const { promisify } = require('util');

async function createSubscriptionIfNotExists(busInfo) {
    var sbs = new ServiceBusService(busInfo.cs);

    var getSubsAsync = promisify(sbs.getSubscription);
    var createSubsAsync = promisify(sbs.createSubscription);

    var subscription = await getSubsAsync(busInfo.topic, busInfo.subscription);
    if (!subscription) {
        subscription = await createSubsAsync(busInfo.topic, busInfo.subscription);
    }

    return subscription;
}

module.exports = createSubscriptionIfNotExists;
