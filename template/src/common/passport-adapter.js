'use strict';

const passport = require('koa-passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

function passportSetup(koaApp, options) {
    // setup passport
    koaApp.use(passport.initialize());

    // setup the strategy as jwt
    var jwtOptions = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        issuer: options.whoIssuedTheToken,
        secretOrKey: options.keyToEncryptTheToken,
        audience: options.whoUsesTheToken
    };

    passport.use(new JwtStrategy(jwtOptions, _createPassportVerifyDelegate(options)));

    koaApp.log.debug('Passport jwt configured');
}

function _createPassportVerifyDelegate(options) {
    return function passportVerify(payload, doneCallback) {
        var user = null;

        if (options.payloadToUser) {
            user = options.payloadToUser(payload);
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
