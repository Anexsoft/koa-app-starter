const passport = require('koa-passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const _intersect = require('lodash.intersection');

var strategyName = 'jwt';

async function initAuthJwt(koaApp, authCfg) {
    if (!authCfg.jwt) {
        throw new Error('jwt is the only passport method available');
    }

    koaApp.use(passport.initialize());
    koaApp.log.debug('passport-setup: passport init success');

    var jwtOptions = {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        issuer: authCfg.jwt.issuer,
        secretOrKey: authCfg.jwt.secretOrKey,
        audience: authCfg.jwt.audience,
        // NOTE: usually we should limit to RS256. Yet certain apis may require other algorithms, so with this setting they can decide.
        algorithms: authCfg.jwt.algorithms || ['RS256']
    };

    koaApp.log.trace(`passport-setup: strategy ${strategyName} with options ${JSON.stringify(jwtOptions)}`);

    passport.use(strategyName, new JwtStrategy(jwtOptions, getPassportVerifier(koaApp)));
    koaApp.log.debug(`passport-setup: strategy ${strategyName} configured`);

    // create passport middleware getters
    koaApp.pptMW = {
        getAuthenticate: _mwAuthenticate,
        getAuthorizeRoles: _mwAuthorize
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
    return passport.authenticate(strategyName, { session: false });
}

function _mwAuthorize(acceptRoles) {
    // always end in an array
    acceptRoles = typeof acceptRoles === 'string' && acceptRoles ? [acceptRoles] : acceptRoles || [];

    // return the middleware
    return async(ctx, next) => {
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
