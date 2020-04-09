// NOTE: If this file is moved, verify the links to this file (especially in the partials).

class AppError extends Error {
    constructor(errorCode, message) {
        super(message);

        // Ensure the name of this error is the same as the class name
        this.name = this.constructor.name;

        this.errorCode = errorCode;
    }

    toString() {
        if (this.message) {
            return `${this.errorCode || this.name}:${this.message}`;
        } else {
            return `${this.errorCode || this.name}`;
        }
    }
}

module.exports = AppError;
