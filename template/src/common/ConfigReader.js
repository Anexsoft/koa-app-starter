'use strict';

var _get = require('lodash.get');

class ConfigReader {
    constructor(globalConfig, moduleName) {
        this.config = globalConfig || {};
        this.moduleName = moduleName;

        this.configPerModule = _get(this.config, this.moduleName, {});
        if (!this.configPerModule.api) {
            throw new Error(`Module ${this.moduleName} is not found in the config file`);
        }
    }

    readLogLevel() {
        return _get(this.configPerModule, 'log.level', 'info');
    }

    readApiName() {
        return _get(this.configPerModule, 'api.name', '');
    }

    readApiPath() {
        return _get(this.configPerModule, 'api.path', '');
    }

    readApiOptions() {
        return _get(this.configPerModule, 'api.options', {});
    }

    readListenToPort() {
        return _get(this.configPerModule, 'port', null);
    }
}

module.exports = ConfigReader;
