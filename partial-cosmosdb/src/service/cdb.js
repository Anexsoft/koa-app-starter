const config = require('config');
const cosmosUtil = require('../common/cosmos-util');
const JuntozSchema = require('@juntoz/joi-schema');

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

async function xxxcreate(session, pkey, obj) {
    obj.id = JuntozSchema.utils.uuid();
    obj.createdBy = session.sub;
    obj.createdOn = JuntozSchema.utils.utcNow();

    await JuntozSchema.User.validateAsync(obj);

    return await cosmosUtil.create(cnt, pkey, obj);
}

async function xxxupdate(session, obj) {
    obj.modifiedBy = session.sub;
    obj.updatedOn = JuntozSchema.utils.utcNow();

    await JuntozSchema.User.validateAsync(obj);

    return await cosmosUtil.update(cnt, obj.siteId, obj);
}

module.exports = {
    setup,
    xxxquery1,
    xxxcreate,
    xxxupdate
};
