// NOTE: If this file is moved, verify the links to this file (especially in the partials).

class AppError extends Error {
    constructor(errorCode, message, statusCode) {
        super(message);

        // Ensure the name of this error is the same as the class name
        this.name = this.constructor.name;

        this.errorCode = errorCode;
        this.statusCode = statusCode;
    }

    toString() {
        return `${this.errorCode || this.name}:${this.message}` + (this.statusCode ? ':' + this.statusCode : '');
    }
}

module.exports = AppError;
