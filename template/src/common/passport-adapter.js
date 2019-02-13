'use strict';

const passport = require('koa-passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const _merge = require('lodash.merge');

function passportSetup(koaApp, options, fnPayloadToUser) {
    // setup passport
    koaApp.use(passport.initialize());

    // setup the strategy as jwt
    options = _merge({
        // extraction mode (Authorization Bearer, Headers, etc)
        extractJwtFrom: ExtractJwt.fromAuthHeaderAsBearerToken(),
        // who issued the token
        whoIssuedTheToken: null,
        // secret key in plain text to decrypt the token
        keyToEncryptTheToken: null,
        // who was going to use the token
        whoUsesTheToken: null,
    }, options);

    var jwtOptions = {
        jwtFromRequest: options.extractJwtFrom,
        issuer: options.whoIssuedTheToken,
        secretOrKey: options.keyToEncryptTheToken,
        audience: options.whoUsesTheToken
    };

    passport.use('jwt', new JwtStrategy(jwtOptions, _createPassportVerifyDelegate(koaApp, fnPayloadToUser)));

    koaApp.log.debug('Passport jwt configured');
}

function _createPassportVerifyDelegate(koaApp, fnPayloadToUser) {
    // We need to do this pattern so the method signature remains the same yet still use the given callback
    return function passportVerify(payload, doneCallback) {
        try {
            var user = null;
            if (fnPayloadToUser) {
                user = fnPayloadToUser(payload);
            } else {
                koaApp.log.warn('passport-verify: fnPayloadToUser was not set, no authentication is possible.');
            }

            if (user) {
                koaApp.log.trace('passport-verify: Success', user);
                return doneCallback(null, user);
            } else {
                koaApp.log.error('passport-verify: False');
                return doneCallback(null, false);
            }
        } catch (error) {
            koaApp.log.error('passport-verify: Error');
            return doneCallback(error, false);
        }
    };
}

async function passportAuthJwt(ctx, next) {
    // https://github.com/rkusa/koa-passport/issues/125#issuecomment-462614317
    return passport.authenticate('jwt', { session: false }, async(err, user, info) => {
        if (err || !user) {
            ctx.app.log.error('passport-auth: unauthorized', { err: err, user: user, info: info });
            ctx.throw(401, 'Unauthorized');
        }

        ctx.app.log.trace('passport-auth: success', { user: user });
        await next();
    })(ctx);
};

module.exports = {
    passportSetup: passportSetup,
    passportAuthJwt: passportAuthJwt
};
