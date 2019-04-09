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

async function authenticate(ctx, next) {
    // https://github.com/rkusa/koa-passport/issues/125#issuecomment-462614317

    // FIXME: strategyName should come from the default options
    return passport.authenticate('jwt', { session: false }, async(err, user, info) => {
        if (err || !user) {
            ctx.log.error('passport-auth: user unauthenticated', { err: err, user: user, info: info });
            ctx.throw(401, 'passport-auth: user unauthenticated');
        }

        ctx.log.debug('passport-auth: user authenticated', { user: user });

        // NOTE: in theory passport should do this automatically, although I haven't found a way to do it
        // The good part is by assigning this, ctx.isAuthenticated gives you true as expected
        ctx.req.user = user;

        await next();
    })(ctx);
};

function buildAuthorizeMw(acceptRoles) {
    if (!acceptRoles) {
        acceptRoles = [];
    }

    if (typeof acceptRoles === 'string') {
        acceptRoles = [acceptRoles];
    }

    if (acceptRoles.length === 0) {
        // if no roles are needed, just return a dummy middleware
        return async(ctx, next) => { await next(); };
    } else {
        return async(ctx, next) => {
            if (ctx.req.user && ctx.req.user.roles) {
                var rolesMatch = ctx.req.user.roles.filter(r => acceptRoles.indexOf(r) >= 0);
                if (rolesMatch.length === 0) {
                    ctx.log.error('passport-auth: user unauthorized', { user: ctx.req.user, expected: acceptRoles });
                    ctx.throw(401, 'passport-auth: user unauthorized');
                } else {
                    ctx.log.debug('passport-auth: user authorized', { user: ctx.req.user, expected: acceptRoles });
                }
            }

            await next();
        };
    }
};

module.exports = {
    setup: setup,
    authenticate: authenticate,
    buildAuthorizeMw: buildAuthorizeMw
};
