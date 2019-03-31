const utils = require('./utils');

// object map to store the valid states
const validStates = {
    PENDING: 0,
    FULFILLED: 1,
    REJECTED: 2
};

const isValidState = (state) => {
    return ((state === validStates.PENDING) ||
        (state === validStates.REJECTED) ||
        (state === validStates.FULFILLED));
};

// to run functions asynchronously 
const runAsync = (fn) => {
    setTimeout(fn, 0);
}

/**
 * Resolve Function to handle the promise resolution 
 *  
 */
const Resolve = function (promise, x) {
    if (promise === x) {
        promise.transition(validStates.REJECTED, new TypeError("The promise and its value refer to the same object"));
    } else if (utils.isPromise(x, Otter)) {
        if (x.state === validStates.PENDING) {
            x.then(function (val) {
                Resolve(promise, val);
            }, function (reason) {
                promise.transition(validStates.REJECTED, reason);
            });
        } else {
            promise.transition(x.state, x.value);
        }
    } else if (utils.isObject(x) || utils.isFunction(x)) {
        let called = false;
        let thenHandler;
        try {
            thenHandler = x.then;

            if (utils.isFunction(thenHandler)) {
                thenHandler.call(x,
                    function (y) {
                        if (!called) {
                            Resolve(promise, y);
                            called = true;
                        }
                    },
                    function (r) {
                        if (!called) {
                            promise.reject(r);
                            called = true;
                        }
                    });
            } else {
                promise.fulfill(x);
                called = true;
            }
        } catch (e) {
            if (!called) {
                promise.reject(e);
                called = true;
            }
        }
    } else {
        promise.fulfill(x);
    }
}

/**
 * The constructor to resolve/reject the functions 
 */
const Otter = function (fn) {
    const that = this;

    this.value = null;
    this.state = validStates.PENDING;
    this.queue = [];
    this.handlers = {
        fulfill: null,
        reject: null
    };

    if (fn) {
        fn(function (value) {
            Resolve(that, value);
        }, function (reason) {
            that.reject(reason);
        });
    }
};

/**
 * The function to return a new promise with success and error handlers
 */
const then = function (onFulfilled, onRejected) {
    const queuedPromise = new Otter();
    if (utils.isFunction(onFulfilled)) {
        queuedPromise.handlers.fulfill = onFulfilled;
    }

    if (utils.isFunction(onRejected)) {
        queuedPromise.handlers.reject = onRejected;
    }

    this.queue.push(queuedPromise);
    this.process();

    return queuedPromise;
};

/**
 * The function to update the promise's state and value after validating the state
 */
const transition = function (state, value) {
    if (this.state === state ||
        this.state !== validStates.PENDING ||
        !isValidState(state) ||
        arguments.length !== 2) {
        return;
    }

    this.value = value;
    this.state = state;
    this.process();
};

/**
 * The function invokes the handlers asynchronously after the state transitions
 */
const process = function () {
    const that = this;
    const fulfillFallBack = (value) => {
        return value;
    };
    const rejectFallBack = (reason) => {
        throw reason;
    };

    if (this.state === validStates.PENDING) {
        return;
    }

    runAsync(function () {
        while (that.queue.length) {
            const queuedPromise = that.queue.shift();
            let handler = null;
            let value;

            if (that.state === validStates.FULFILLED) {
                handler = queuedPromise.handlers.fulfill || fulfillFallBack;
            } else if (that.state === validStates.REJECTED) {
                handler = queuedPromise.handlers.reject || rejectFallBack;
            }

            try {
                value = handler(that.value);
            } catch (e) {
                queuedPromise.transition(validStates.REJECTED, e);
                continue;
            }

            Resolve(queuedPromise, value);
        }
    });
};

/**
 * Wrapper function for success transition
 */
const fulfill = function (value) {
    this.transition(validStates.FULFILLED, value);
};

/**
 * Wrapper function for error transition
 */
const reject = function (reason) {
    this.transition(validStates.REJECTED, reason);
};

Otter.prototype.transition = transition;
Otter.prototype.process = process;
Otter.prototype.then = then;
Otter.prototype.fulfill = fulfill;
Otter.prototype.reject = reject;

module.exports = Otter
