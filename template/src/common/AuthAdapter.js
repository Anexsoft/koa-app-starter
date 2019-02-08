'use strict';

// const passport = require('koa-passport');
// var PassportHttpBearerStrategy = require('passport-http-bearer').Strategy;

class AuthAdapter {
    /**
     * Configures the authentication and authorization process
     * @param {*} koaApp
     */
    setup(koaApp) {
        // initialize passport koa middleware
        /*
        passport.use('http-bearer', new PassportHttpBearerStrategy(function(token, done) {
            koaApp.log.info('passport: payload request', token);

            // if (err) { return done(err); }
            // if (!client) { return done(null, false); }

            return done(null, { clientId: 1 });
        }));

        koaApp.use(passport.initialize());
        koaApp.log.debug('passport: initialized');
        */
    }

    authmw() {
        // return passport.authenticate('http-bearer', this.authroutecb);
    }

    authroutecb(error, user, info) {
        /*
        if (error) {
            ctx.log.error('Passport-Route-Mw: error', { error: error, user: user, info: info });
            ctx.throw(500, 'Authentication Error');
        } if (!user) {
            // this occurs when passport strategy verify function was not executed, or could not resolve the user
            ctx.log.error('Passport-Route-Mw: forbidden', { error: error, user: user, info: info });
            ctx.throw(403, 'Authentication Forbidden');
        } else {
            ctx.log.debug('Passport-Route-Mw: auth ok', { user: user, info: info });
        }
        */

        if (error) {
            console.log('authroutecb err');
        }
    }
}

module.exports = AuthAdapter;
