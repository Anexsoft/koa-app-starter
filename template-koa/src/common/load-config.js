'use strict';

const fs = require('fs');
const path = require('path');

module.exports = function loadConfig(apiDir, configfile) {
    configfile = configfile || 'config.json';

    var configPath = path.resolve(apiDir, configfile);

    var contents = fs.readFileSync(configPath);
    if (contents) {
        var config = JSON.parse(contents);
        return config;
    } else {
        return null;
    }
};
