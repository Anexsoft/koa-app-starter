const config = require('config');
const dateutils = require('../common/date-utils');
const cosmosUtil = require('../common/cosmos-util');

var dbId = null;
var cntId = null;
var cnt = null;

async function setup(koaApp) {
    dbId = config.get('cosmos.<cdb_host>.<cdb_dbid>');
    cntId = config.get('cosmos.<cdb_host>.<cdb_cntid>');
    cnt = koaApp.cosmos.database(dbId).container(cntId);
}

async function xxxquery1(pkey, field) {
    const querySpec = {
        query: 'select 1 from c where c.field = @field and c.isDeleted = false',
        parameters: [
            { name: '@field', value: field }
        ]
    };

    var result = await cnt.items.query(querySpec, cosmosUtil.queryOptions(pkey)).fetchAll();
    return result.resources.length > 0;
}

async function xxxupdate(session, obj) {
    obj.modifiedBy = session.sub;
    obj.updatedOn = dateutils.utcNow();

    return await cosmosUtil.update(cnt, obj.siteId, obj);
}

async function xxxcreate(session, pkey, obj) {
    obj.id = 123;
    obj.createdBy = session.sub;
    obj.createdOn = dateutils.utcNow();

    return await cosmosUtil.create(cnt, pkey, obj);
}

module.exports = {
    setup,
    xxxquery1,
    xxxupdate,
    xxxcreate
};
