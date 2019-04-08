'use strict';

const mssql = require('mssql');

function koaGetMsSql(koaApp, connectionObject, methodName) {
    if (!methodName) {
        methodName = 'getDb';
    }

    var instName = '_' + methodName;
    var fnGetDb = async function() {
        if (!koaApp[instName]) {
            koaApp.log.debug(`mssql ${methodName}: pool creating...`, connectionObject);
            koaApp[instName] = new mssql.ConnectionPool(connectionObject);
            koaApp.log.info(`mssql ${methodName}: pool created`);

            koaApp[instName].on('error', err => {
                switch (err.message) {
                // NOTE: these are known errors when the connections simply go idle, in theory mssql.ConnectionPool should handle
                // reconnecting and expanding the pool when necessary.
                // https://github.com/tediousjs/node-mssql/issues/568
                case 'Connection lost - write ECONNRESET':
                case 'Connection lost - read ECONNRESET':
                case 'Connection lost - socket hang up':
                    koaApp.log.debug(`mssql ${methodName}: pool connection reset`, err);
                    break;
                default:
                    koaApp.log.error(`mssql ${methodName}: pool event error`, err);
                }
            });
        }

        if (!koaApp[instName].connected) {
            try {
                await koaApp[instName].connect();
                koaApp.log.info(`mssql ${methodName}: pool connect ok`);
            } catch (err) {
                koaApp.log.error(`mssql ${methodName}: pool connect error`, err);
                throw err;
            }
        }

        return koaApp[instName];
    };

    mssql.on('connect', err => {
        if (err) {
            koaApp.log.error(`mssql ${methodName}: connect event error`, err);
        } else {
            koaApp.log.info(`mssql ${methodName}: connect event ok`);
        }
    });

    mssql.on('error', err => {
        koaApp.log.error(`mssql ${methodName}: error event`, err);
    });

    koaApp[methodName] = fnGetDb;
}

module.exports = koaGetMsSql;
