'use strict';

const passport = require('koa-passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

function passport_setup(koaApp, options) {
    // setup passport
    koaApp.use(passport.initialize());

    // setup the strategy as jwt
    var jwtOptions = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        issuer: options.whoIssuedTheToken,
        secretOrKey: options.keyToEncryptTheToken,
        audience: options.whoUsesTheToken
    }

    passport.use(new JwtStrategy(jwtOptions, passport_onverify));    

    koaApp.log.debug('Authentication with passport jwt configured');
}

function passport_onverify(payload, doneCallback) {
    // TODO: convert payload into a user object
    var user = null;

    try {
        if (user) {
            return doneCallback(null, user);
        } else {
            return doneCallback(null, false);
        }
    } catch (error) {
        return doneCallback(error, false);
    }
}

async function passport_auth(ctx, next) {
    return passport.authenticate('jwt', { session: false }, async (err, user, info) => {
        if (err || !user) {
            ctx.app.log.error('passport: unauthorized', {err: err, user: user, info: info});
            ctx.throw(401, 'Unauthorized');
        }

        // TODO: define what to do when the user was really authenticated, probably just move on to the next middleware.
        ctx.app.log.debug('passport: authenticated ok', {user: user});
        await next();
    })(ctx);
};

module.exports = {
    passport_setup: passport_setup,
    passport_auth: passport_auth
};
