const { ReceiveMode } = require("@azure/service-bus");

class MessageHandler {
    getReceiveMode() {
        // see ReceiveMode for enum values
        return ReceiveMode.peekLock;
    }

    getMessageHandlerOptions() {
        // see MessageHandlerOptions for content
        return null;
    }

    setup(busInfo) {
        // NOTE: if this method returns an object, it will replace the busInfo object that is passed in all methods, this way you can carry config entries here
        return busInfo;
    }

    async onMessage(busCtx, message) {
    }

    async onError(busCtx, error) {
    }

    messageStringify(message) {
        // use this method to stringify the message and discard other members that will create a circular reference
        // update it to add more info as needed
        let m = {
            deliveryCount: message.deliveryCount,
            lockToken: message.lockToken,
            userProperties: message.userProperties,
            messageId: message.messageId,
            enqueuedSequenceNumber: message.enqueuedSequenceNumber,
            sequenceNumber: message.sequenceNumber,
            enqueuedTimeUtc: message.enqueuedTimeUtc,
            lockedUntilUtc: message.lockedUntilUtc,
            expiresAtUtc: message.expiresAtUtc,
            body: message.body.toString('utf8')
        }

        return JSON.stringify(m);
    }
}

module.exports = MessageHandler;
