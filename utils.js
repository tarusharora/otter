const isFunction = (val) => {
    return val && typeof val === "function";
}

const isObject = (val) => {
    return val && typeof val === "object";
};

const isPromise = (val, promise) => {
    return val && val.constructor === promise;
}

module.exports = {
    isFunction,
    isObject,
    isPromise
}

