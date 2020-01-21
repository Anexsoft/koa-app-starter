'use strict';

const path = require('path');
const fs = require('fs-extra');
const _merge = require('lodash.merge');
const koaHealthProbe = require('@juntoz/koa-health-probe');
const passport = require('koa-passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

async function init(koaApp, moduleEntryPath) {
    // pre-processing
    await _pre(koaApp);

    // auth
    await _initAuth(koaApp);

    // api
    await _initApi(koaApp, moduleEntryPath);

    // post-processing
    _post(koaApp);
}

async function _pre(koaApp) {
    // load the api config
    var configPath = path.join(__dirname, 'config.json');
    var loadedCfg = await fs.readJson(configPath);
    koaApp.cfg = _merge(_defaultConfig(), loadedCfg);

    // set request id
    const xRequestId = require('koa-x-request-id');
    koaApp.use(xRequestId({ noHyphen: true, inject: true }, koaApp));
    koaApp.log.debug('app-xrequestid: success');

    // gather info about the last request, ignore the koa-health-probe default path
    const koaLastRequest = require('@juntoz/koa-last-request');
    koaApp.use(koaLastRequest({ pathsToIgnore: [koaHealthProbe.defaultPath] }));
    koaApp.log.debug('app-lastrequest: success');

    // configure the body parser which will help parse the body and turn in json objects. form fields, etc.
    const koaBodyParser = require('koa-bodyparser');
    koaApp.use(koaBodyParser());
    koaApp.log.debug('app-bodyparser: success');
}

async function _initAuth(koaApp) {
    if (koaApp.cfg.auth) {
        // setup passport (to authenticate requests)
        koaApp.use(passport.initialize());
        koaApp.log.debug('passport-setup: passport init success');

        if (!koaApp.cfg.auth.jwt) {
            throw new Error('passport only supported method is jwt for now');
        }

        var jwtOptions = {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            issuer: koaApp.cfg.auth.jwt.issuer,
            secretOrKey: koaApp.cfg.auth.jwt.secretOrKey,
            audience: koaApp.cfg.auth.jwt.audience
        };

        passport.use('jwt', new JwtStrategy(jwtOptions, _passportVerify));
        koaApp.passportUtil = {
            authenticate: _authenticate,
            generateValidateRoles: _mwValidateRoles
        };
        koaApp.log.debug('passport-setup: jwt success', jwtOptions);
    } else {
        koaApp.log.info('passport-setup: anonymous access');
    }
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

async function _authenticate(ctx, next) {
    // https://github.com/rkusa/koa-passport/issues/125#issuecomment-462614317

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

function _mwValidateRoles(acceptRoles) {
    if (!acceptRoles) {
        acceptRoles = [];
    }

    if (typeof acceptRoles === 'string') {
        acceptRoles = [acceptRoles];
    }

    return async(ctx, next) => {
        if (acceptRoles.length > 0 && ctx.req.user && ctx.req.user.roles) {
            var rolesMatch = ctx.req.user.roles.filter(r => acceptRoles.indexOf(r) >= 0);
            if (rolesMatch.length === 0) {
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

async function _initApi(koaApp, modulePath) {
    // load the api module from the index root
    const moduleSetup = require.main.require(modulePath);
    if (!moduleSetup || typeof moduleSetup !== 'function') {
        throw new Error(`app-api: ${modulePath} not found or not a function`);
    } else {
        koaApp.log.debug(`app-api: ${modulePath} found`);
    }

    // call the api setup
    await moduleSetup(koaApp);
    koaApp.log.info(`app-api: ${modulePath} success`);
}

function _defaultConfig() {
    return {
        name: null,
        auth: {
            jwt: {
                issuer: null,
                secretOrKey: null,
                audience: null            
            }
        }
    };
}

function _post(koaApp) {
    koaHealthProbe(koaApp);
    koaApp.log.debug('app-probe: success');
}

module.exports = init;
