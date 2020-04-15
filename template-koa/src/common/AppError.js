// NOTE: If this file is moved, verify the links to this file (especially in the partials).

class AppError extends Error {
    constructor(errorCode, message) {
        if (!errorCode || !message) {
            throw new Error('errorCode and message are mandatory');
        }

        super(message);

        // Ensure the name of this error is the same as the class name
        this.name = this.constructor.name;

        this.errorCode = errorCode;
    }

    toString() {
        var title = this.errorCode || this.name;
        return `${title}:${this.message}`;
    }
}

module.exports = AppError;
