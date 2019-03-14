'use strict';

const mssql = require('mssql');

function koaGetMsSql(koaApp, connectionObject, methodName) {
    if (!methodName) {
        methodName = 'getDb';
    }

    var instName = '_' + methodName;

    var fn = function() {
        if (!koaApp[instName]) {
            try {
                koaApp.log.debug(`${methodName}: creating connection`, connectionObject);
                koaApp[instName] = mssql.connect(connectionObject);
                koaApp.log.info(`${methodName}: connected`);
            } catch (err) {
                koaApp.log.error(`${methodName}: connection error`, err);
                throw err;
            }
        }

        return koaApp[instName];
    };

    koaApp[methodName] = fn;
}

module.exports = koaGetMsSql;
