
const testRunner = require('promises-aplus-tests');

const Otter = require('./otter');

var adapter = {
    resolved: function (value) {
        return new Otter(function (resolve) {
            resolve(value);
        });
    },
    rejected: function (reason) {
        return new Otter(function (resolve, reject) {
            reject(reason);
        });
    },
    deferred: function () {
        var resolve, reject;

        return {
            promise: new Otter(function (rslv, rjct) {
                resolve = rslv;
                reject = rjct;
            }),
            resolve: resolve,
            reject: reject
        };
    }
};

testRunner(adapter, function (err) {
    console.log(err);
});
