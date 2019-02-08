'use strict';

module.exports = (path) => {
    // require.main.require will load a given class relative to the index.js (which is the main entrypoint)
    const apiType = require.main.require(path);
    return apiType;
};
