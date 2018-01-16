
export class PermanentError extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class TransientError extends Error {
    constructor(message?: string) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
