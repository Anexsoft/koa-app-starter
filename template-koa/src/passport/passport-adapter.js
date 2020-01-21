'use strict';

const passport = require('koa-passport');

function setup(koaApp, fnPayloadToUser) {
    // setup passport
    koaApp.use(passport.initialize());
    passport.passportVerifyDelegate = _createPassportVerifyDelegate(koaApp, fnPayloadToUser);
    koaApp.log.debug('passport-setup: success');
    return passport;
}

function _createPassportVerifyDelegate(koaApp, fnPayloadToUser) {
    if (!fnPayloadToUser) {
        throw new Error('fnPayloadToUser is mandatory');
    }

    // NOTE: We need to do this pattern so we can call the given callback and still comply with the passport-verify method signature
    return function passportVerify(payload, doneCallback) {
        try {
            var user = fnPayloadToUser(payload);
            if (user) {
                koaApp.log.debug('passport-verify: success', user);
                return doneCallback(null, user);
            } else {
                koaApp.log.error('passport-verify: false');
                return doneCallback(null, false);
            }
        } catch (error) {
            koaApp.log.error('passport-verify: error');
            return doneCallback(error, false);
        }
    };
}

module.exports = {
    setup: setup
};
