const passport = require('koa-passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const JuntozSchema = require('@juntoz/joi-schema');

var strategyName = 'jwt';

async function initAuthJwt(koaApp, authCfg) {
    if (!authCfg.jwt) {
        throw new Error('jwt is the only passport method available');
    }

    koaApp.use(passport.initialize());
    koaApp.log.debug('passport-setup: passport init success');

    var jwtOptions = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

        // NOTE: usually we should limit to RS256. Yet certain apis may require other algorithms, so with this setting they can decide, but RS256 is always there.
        algorithms: authCfg.jwt.algorithms || ['RS256']
    };

    if (authCfg.jwt.issuer) {
        jwtOptions.issuer = authCfg.jwt.issuer;
    }

    if (authCfg.jwt.secretOrKey) {
        jwtOptions.secretOrKey = authCfg.jwt.secretOrKey;
    }

    if (authCfg.jwt.audience) {
        jwtOptions.audience = authCfg.jwt.audience;
    }

    koaApp.log.trace(`passport-setup: strategy ${strategyName} with options ${JSON.stringify(jwtOptions)}`);

    passport.use(strategyName, new JwtStrategy(jwtOptions, getPassportVerifier(koaApp)));
    koaApp.log.debug(`passport-setup: strategy ${strategyName} configured`);

    // create passport middleware getters
    koaApp.pptMW = {
        getAuthenticate: _mwAuthenticate,
        getRequiresSub: _mwRequiresSub,
        getAuthorizeRoles: _mwAuthorizeNew,
        getAuthorizeRolesLegacy: _mwAuthorizeLegacy
    };
}

function getPassportVerifier(koaApp) {
    return function _passportVerify(payload, doneCallback) {
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
    };
}

function _mwAuthenticate() {
    // NOTE: call to passport.authenticate returns a koa middleware that is going to be used at execution time to authenticate
    // the request based on the given strategy and parameters.
    return passport.authenticate(strategyName, {
        session: false
    });
}

function _mwAuthorizeNew(acceptRoles) {
    acceptRoles = __normalizeAcceptRoles(acceptRoles);

    // return the middleware
    return async(ctx, next) => {
        var userRoles = __getUserRoles(ctx);

        var unauthorized = !JuntozSchema.utils.isAuthorized(acceptRoles, userRoles);
        if (!unauthorized) {
            ctx.throw(401, 'unauthorized by roles mismatch');
        }

        ctx.log.debug('passport-auth: authorized', {
            sub: ctx.state.user.sub,
            expected: acceptRoles
        });
        await next();
    };
}

function _mwAuthorizeLegacy(acceptRoles) {
    acceptRoles = __normalizeAcceptRoles(acceptRoles);

    // return the middleware
    return async(ctx, next) => {
        var userRoles = __getUserRoles(ctx);

        var unauthorized = !JuntozSchema.utils.isAuthorizedLegacy(acceptRoles, userRoles);
        if (!unauthorized) {
            ctx.throw(401, 'unauthorized by roles mismatch');
        }

        ctx.log.debug('passport-auth: authorized', {
            sub: ctx.state.user.sub,
            expected: acceptRoles
        });
        await next();
    };
}

function __normalizeAcceptRoles(acceptRoles) {
    acceptRoles = typeof acceptRoles === 'string' && acceptRoles ? [acceptRoles] : (acceptRoles || []);
    if (!acceptRoles.length) {
        throw new Error('acceptRoles is required');
    }

    return acceptRoles;
}

function __getUserRoles(ctx) {
    // this middleware depends that passport has authenticated and wrote ctx.state.user
    if (!ctx.state.user) {
        ctx.throw(401, 'unauthorized by user missing');
    }

    // NOTE: temporary hack until we get idv3 resolved on whether the claim is "role" or "roles".
    var roles = ctx.state.user.role || ctx.state.user.roles;
    if (!roles) {
        ctx.throw(401, 'unauthorized by roles missing');
    }

    return roles;
}

function _mwRequiresSub() {
    return async(ctx, next) => {
        if (!ctx.state.user) {
            ctx.throw(401, 'unauthorized by user missing');
        }

        if (!ctx.state.user.sub) {
            ctx.throw(401, 'unauthorized by user sub missing');
        }

        ctx.log.debug('passport-sub: authorized', {
            sub: ctx.state.user.sub
        });
        await next();
    };
}

module.exports = initAuthJwt;
