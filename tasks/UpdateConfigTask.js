const fs = require('fs-extra');
const jsyaml = require('js-yaml');
const _merge = require('lodash.merge');
const ymlUtil = require('../common/ymlutil');

class UpdateConfigTask {
    _defaultCfg() {
        // no default config
        return {};
    }

    applyConfig(cfg) {
        this.config = cfg || {};
    }

    _hasAnyEntry() {
        return Object.keys(this.config).length > 0;
    }

    async execute(destFile) {
        if (this._hasAnyEntry()) {
            var cfgContent = await ymlUtil.readYaml(destFile);
            cfgContent = _merge(cfgContent, this.config);
            var outyaml = jsyaml.safeDump(cfgContent);
            await fs.writeFile(destFile, outyaml);
        }
    }
}

module.exports = UpdateConfigTask;
