'use strict';

const passport = require('koa-passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const _merge = require('lodash.merge');

function setup(koaApp, passport, options) {
    // setup the strategy as jwt
    options = _merge(_defaultOptions(), options);

    var jwtOptions = {
        jwtFromRequest: options.extractJwtFrom,
        issuer: options.whoIssuedTheToken,
        secretOrKey: options.keyToEncryptTheToken,
        audience: options.whoUsesTheToken
    };

    passport.use(options.strategyName, new JwtStrategy(jwtOptions, passport.passportVerifyDelegate));
    koaApp.log.debug('passport-jwt-setup: success', jwtOptions);
}

function _defaultOptions() {
    return {
        // set the strategy name in case we want duplicate strategies
        strategyName: 'jwt',
        // extraction mode (Authorization Bearer, Headers, etc)
        extractJwtFrom: ExtractJwt.fromAuthHeaderAsBearerToken(),
        // who issued the token
        whoIssuedTheToken: null,
        // secret key in plain text to decrypt the token
        keyToEncryptTheToken: null,
        // who was going to use the token
        whoUsesTheToken: null
    };
}

async function auth(ctx, next) {
    // https://github.com/rkusa/koa-passport/issues/125#issuecomment-462614317

    // FIXME: strategy name should come from the setup
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
    setup: setup,
    auth: auth
};
