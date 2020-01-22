const passport = require('koa-passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const _intersect = require('lodash.intersection');

var strategyName = 'jwt';

async function initAuthJwt(koaApp, authCfg) {
    if (!authCfg.jwt) {
        throw new Error('jwt is the only passport method available');
    }
/*
    if (!authCfg.jwt.issuer) {
        throw new Error('jwt.issuer is mandatory');
    }

    if (!authCfg.jwt.secretOrKey) {
        throw new Error('jwt.secretOrKey is mandatory');
    }

    if (!authCfg.jwt.audience) {
        throw new Error('jwt.audience is mandatory');
    }*/

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
        getAuthenticate: _mwAuthenticate,
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

function _mwAuthenticate() {
    // call to passport.authenticate returns a koa middleware
    return passport.authenticate(strategyName, { session: false });
}

async function _debugPassportCallback(err, user, info) {
    // https://dmitryrogozhny.com/blog/easy-way-to-debug-passport-authentication-in-express
    if (global.env !== 'dev') {
        // DO NOT SETUP ON PRODUCTION, only use it for development
        // EVEN WORSE, when activated the response may be 404 instead of the 401, so it
        // definitely needs to be avoided in PRODUCTION
        throw new Error('INVALID CALL TO DEBUG PASSPORT');
    }

    // when error, err is not null or user is false
    if (err || !user) {
        // in this case, it is ok to do console.log because it is for debugging only
        console.log(`passport-debug-error: ${info.message}`);
    }
}

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
