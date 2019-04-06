'use strict';

const mssql = require('mssql');

function koaGetMsSql(koaApp, connectionObject, methodName) {
    if (!methodName) {
        methodName = 'getDb';
    }

    var instName = '_' + methodName;
    var fnGetDb = async function() {
        if (!koaApp[instName]) {
            try {
                koaApp.log.debug(`mssql ${methodName}: creating pool`, connectionObject);
                koaApp[instName] = new mssql.ConnectionPool(connectionObject);
                koaApp.log.info(`mssql ${methodName}: pool created`);
            } catch (err) {
                koaApp.log.error(`mssql ${methodName}: connection error`, err);
                throw err;
            }
        }

        if (!koaApp[instName].connected) {
            await koaApp[instName].connect();
            koaApp.log.info(`mssql ${methodName}: pool connected`);
        }

        return koaApp[instName];
    };

    mssql.on('error', err => {
        koaApp.log.error(`mssql ${methodName}: error`, err);
    });

    koaApp[methodName] = fnGetDb;
}

module.exports = koaGetMsSql;
