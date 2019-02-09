'use strict';

const mssql = require('mssql');

function koaGetMsSql(koaApp, connectionObject) {
    koaApp.getDb = function() {
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
}

module.exports = koaGetMsSql;