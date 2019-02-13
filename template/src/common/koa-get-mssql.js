'use strict';

const mssql = require('mssql');

function koaGetMsSql(koaApp, connectionObject, methodName) {
    var fn = function() {
        if (!koaApp._db) {
            try {
                if (typeof connectionObject === 'string') {
                    koaApp.log.debug('getDb: creating connection %s', connectionObject);
                } else {
                    koaApp.log.debug('getDb: creating connection', connectionObject);
                }

                koaApp._db = mssql.connect(connectionObject);
                koaApp.log.info('getDb: connected');
            } catch (err) {
                koaApp.log.error('getDb: connection error', err);
                throw err;
            }
        }

        return koaApp._db;
    };

    if (!methodName) {
        koaApp.getDb = fn;
    } else {
        koaApp[methodName] = fn;
    }
}

module.exports = koaGetMsSql;
