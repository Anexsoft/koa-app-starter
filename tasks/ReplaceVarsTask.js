const _merge = require('lodash.merge');
const fg = require('fast-glob');
const normalizePath = require('normalize-path');
const path = require('path');
const replaceInFile = require('replace-in-file');

class ReplaceVarsTask {
    _defaultCfg() {
        // no default config
        return [];
    }

    applyConfig(cfg) {
        this.config = _merge(this._defaultCfg(), cfg || []);
    }

    async execute(sourcePath, vars) {
        // separate the vars object to regex and values
        var fromKeys = Object.keys(vars).map(key => new RegExp(`<${key}>`, 'g'));
        var toValues = Object.keys(vars).map(key => vars[key]);

        var globs = [
            normalizePath(path.join(sourcePath, '**/Dockerfile')),
            normalizePath(path.join(sourcePath, '**/*.{json,cmd,yml,yaml}'))
        ];

        var allResults = [];
        var entries = await fg(globs, { dot: true });
        for (let i = 0; i < entries.length; i++) {
            var _results = await this._applyToFile(entries[i], fromKeys, toValues);
            allResults.push(..._results);
        }

        return allResults;
    }

    async _applyToFile(filePath, fromKeys, toValues) {
        var results = await replaceInFile({
            files: filePath,
            from: fromKeys,
            to: toValues
        });

        // return only those that changed
        return results.filter(x => x.hasChanged);
    }
}

module.exports = ReplaceVarsTask;
