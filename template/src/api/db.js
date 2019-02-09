'use strict';

const mssql = require('mssql');

async function getXXXById(koaApp, xxxId) {
    var sqlstr =
        'select xxxId, twoIsoCod from XXX where xxxId = @xxxId';

    koaApp.log.trace('getXXXById-db: sql', { sql: sqlstr, xxxId: xxxId });

    var db = await koaApp.getDb();
    let result = await db.request()
        .input('xxxId', mssql.Int, xxxId)
        .query(sqlstr);

    var list = result.recordsets[0];
    if (list && list.length > 0) {
        koaApp.log.trace('getXXXById-db: found', list[0]);
        return list[0];
    } else {
        return null;
    }
}

module.exports = {
    getXXXById: getXXXById
};
