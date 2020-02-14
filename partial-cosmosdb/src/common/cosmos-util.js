// NOTE: AppError is supposed to be in common folder as well.
const AppError = require('./AppError');

function queryOptions(pkey, options) {
    // NOTE: in theory, cnt.items.query should accept the value partitionKey, however is not working.
    // as a workaround we can set the header.
    options = options || {};
    options.initialHeaders = options.initialHeaders || {};

    if (pkey) {
        Object.assign(options.initialHeaders, {
            'x-ms-documentdb-partitionkey': `["${pkey}"]`
        });
    }

    return options;
}

async function getByIdActive(cnt, pkey, id, throwErr, fnIsActive) {
    // set throwErr default = true
    throwErr = typeof throwErr == 'undefined' ? true : throwErr;

    // set active verifier
    fnIsActive = fnIsActive || ((i) => !i.isDeleted);

    var result = await cnt.item(id, pkey).read();
    if (result.statusCode == 200 && fnIsActive(result.resource)) {
        return result.resource;
    } else {
        if (throwErr) {
            throw new AppError('ERR_GET_ID', `Obj ${id} does not exist, Pk ${pkey}, ${result.statusCode}`);
        }

        return null;
    }
}

async function create(cnt, pkey, newObj, altKey) {
    var result = await cnt.items.create(newObj, { partitionKey: pkey });
    if (result.statusCode == 201) {
        return result.item.id;
    } else {
        throw new AppError('ERR_CREATE', `Obj ${altKey || newObj.id} not created, Pk ${pkey}, ${result.statusCode}`);
    }
}

async function update(cnt, pkey, updObj) {
    var result = await cnt.item(updObj.id, pkey).replace(updObj);
    if (result.statusCode == 200) {
        return true;
    } else {
        throw new AppError('ERR_UPDATE', `Obj ${updObj.id} not updated, Pk ${pkey}, ${result.statusCode}`);
    }
}

module.exports = {
    create,
    update,
    getByIdActive,
    queryOptions
};
