'use strict';

const passport = require('koa-passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const _merge = require('lodash.merge');

function passportSetup(koaApp, options) {
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
        // function to convert from payload to a user object
        fnPayloadToUser: null
    }, options);

    var jwtOptions = {
        jwtFromRequest: options.extractJwtFrom,
        issuer: options.whoIssuedTheToken,
        secretOrKey: options.keyToEncryptTheToken,
        audience: options.whoUsesTheToken
    };

    passport.use(new JwtStrategy(jwtOptions, _createPassportVerifyDelegate(koaApp, options)));

    koaApp.log.debug('Passport jwt configured');
}

function _createPassportVerifyDelegate(koaApp, options) {
    // We need to do this pattern so the method signature remains the same yet still use the given callback
    return function passportVerify(payload, doneCallback) {
        var user = null;

        if (options.fnPayloadToUser) {
            user = options.fnPayloadToUser(payload);
        } else {
            koaApp.log.warn('passport: fnPayloadToUser was not set, no authentication is possible.');
        }

        try {
            if (user) {
                return doneCallback(null, user);
            } else {
                return doneCallback(null, false);
            }
        } catch (error) {
            return doneCallback(error, false);
        }
    };
}

async function passportAuth(ctx, next) {
    // https://github.com/rkusa/koa-passport/issues/125#issuecomment-462614317
    return passport.authenticate('jwt', { session: false }, async(err, user, info) => {
        if (err || !user) {
            ctx.app.log.error('passport: unauthorized', { err: err, user: user, info: info });
            ctx.throw(401, 'Unauthorized');
        }

        // TODO: define what to do when the user was really authenticated, probably just move on to the next middleware.
        ctx.app.log.debug('passport: authenticated ok', { user: user });
        await next();
    })(ctx);
};

module.exports = {
    passportSetup: passportSetup,
    passportAuth: passportAuth
};
