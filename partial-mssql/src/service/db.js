const koaMsSql = require('../common/koa-get-mssql');

function setup(koaApp, config) {
    // setup the db connection
    koaMsSql(koaApp, config.connectionObject);
}

async function getXXXById(koaApp, xxxId) {
    var sqlstr =
        'select xxxId from XXX where xxxId = @xxxId';

    koaApp.log.trace('getXXXById-db: sql', { sql: sqlstr, xxxId: xxxId });

    try {
        var db = await koaApp.getDb();
        var result = await db.request()
            .input('xxxId', xxxId)
            .query(sqlstr);

        var list = result.recordsets[0];
        if (list && list.length > 0) {
            koaApp.log.trace('getXXXById-db: found', list[0]);
            return list[0];
        } else {
            return null;
        }
    } catch (error) {
        koaApp.log.error('getXXXById-db: error', error);
        throw error;
    }
}

module.exports = {
    setup: setup,
    getXXXById: getXXXById
};
