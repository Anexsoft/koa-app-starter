const passport = require('koa-passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const _intersect = require('lodash.intersection');

var strategyName = 'jwt';

async function initAuthJwt(koaApp, authCfg) {
    if (!authCfg.jwt) {
        throw new Error('jwt is the only passport method available');
    }

    if (!authCfg.jwt.issuer) {
        throw new Error('jwt.issuer is mandatory');
    }

    if (!authCfg.jwt.secretOrKey) {
        throw new Error('jwt.secretOrKey is mandatory');
    }

    if (!authCfg.jwt.audience) {
        throw new Error('jwt.audience is mandatory');
    }

    koaApp.use(passport.initialize());
    koaApp.log.debug('passport-setup: passport init success');

    var jwtOptions = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        issuer: authCfg.jwt.issuer,
        secretOrKey: authCfg.jwt.secretOrKey,
        audience: authCfg.jwt.audience
    };

    passport.use(strategyName, new JwtStrategy(jwtOptions, _passportVerify));

    // create passport middleware getters
    koaApp.pptMW = {
        getAuthenticate: () => { return _mwAuthenticate; },
        getAuthorizeRoles: _mwAuthorize
    };
}

function _passportVerify(payload, doneCallback) {
    // verify the payload and convert to the user object which becomes the identity
    // of the request.
    try {
        // var user = fnPayloadToUser(payload);
        var user = payload;
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
}

async function _mwAuthenticate(ctx, next) {
    // https://github.com/rkusa/koa-passport/issues/125#issuecomment-462614317

    return passport.authenticate(strategyName, { session: false }, async (err, user, info) => {
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

function _mwAuthorize(acceptRoles) {
    // always end in an array
    acceptRoles = typeof acceptRoles === 'string' && acceptRoles ? [acceptRoles] : acceptRoles || [];

    // return the middleware
    return async (ctx, next) => {
        if (acceptRoles.length > 0 && ctx.req.user && ctx.req.user.roles) {
            var matched = _intersect(ctx.req.user.roles, acceptRoles);
            if (matched.length === 0) {
                ctx.log.error('passport-auth: user unauthorized', { user: ctx.req.user, expected: acceptRoles });
                ctx.throw(401, 'passport-auth: user unauthorized');
            } else {
                ctx.log.debug('passport-auth: user authorized', { user: ctx.req.user, expected: acceptRoles });
            }
        }

        // if no roles are needed, just bypass
        await next();
    };
};

module.exports = initAuthJwt;
