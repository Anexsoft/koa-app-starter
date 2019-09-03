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

    setup(busCtx) {
        // customize busCtx if needed
    }

    async onMessage(busCtx, message) {
        // handle the incoming message.
        // if it runs ok, it will mark the message as completed automatically.
    }

    async onError(busCtx, error) {
        // manage an error that may happen
    }
}

module.exports = MessageHandler;
