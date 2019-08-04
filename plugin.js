const fs = require('fs-extra');
const path = require('path');
const jsyaml = require('js-yaml');
const _merge = require('lodash.merge');
const fg = require('fast-glob');

class Plugin
{
    constructor(pluginPath) {
        var confpath = path.join(pluginPath, 'commands.yml');
        if (!fs.existsSync(confpath)) {
            throw new Error(`Config file needed in ${confpath}`)
        }

        this._configData = jsyaml.safeLoad(fs.readFileSync(confpath, 'utf-8'));
    }

    copyTask() {
        var cbConfig = new CopyBaseConfig();
        cbConfig.merge(this._configData.copy);
        return cbConfig;
    }
}

class CopyTask {    
    _defaultCfg() {
        return {
            path: '.', // base path to copy all files from
            ignore: [], // array of glob paths to ignore to copy
            defaultIgnore: [
                '!**/node_modules',
                '!**/package*.json',
                '!**/readme.txt',
                '!**/commands.yml'
            ],
            minify: {
                enabled: true, // enable js minify
                extensions: [],
                defaultExtensions: ['.js'],
                ignore: [], // array of glob paths to ignore to minify
                defaultIgnore: [
                    '/src/api'
                ]
            },
        };
    }

    merge(cfg) {
        this.config = _merge(this._defaultCfg(), cfg);

        // convert to absolute path
        this.config.path = path.resolve(this.config.path);

        // build the copy final ignore list
        this.config.finalIgnore = this.config.defaultIgnore.concat(this.config.ignore || []);

        // build the minify final extension list
        this.config.minify.finalExtensions = this.config.minify.defaultExtensions.concat(this.config.minify.extensions || []);
        
        // build the minify final ignore list
        this.config.minify.finalIgnore = this.config.minify.defaultIgnore.concat(this.config.minify.ignore || []);
    }

    async getFilesToCopy() {
        return await fg(path.join(this.config.path, '**'), { dot: true, ignore: this.config.finalIgnore });
    }

    async shouldMinify(filePath) {
        // verify if it has the extension
        var yes = this.config.minify.finalExtensions.indexOf(path.extname(filePath));

        if (yes) {
            // verify if file is not in the ignore list
            let entries = await fg(filePath, { dot: true, ignore: copyOptions.minify.finalIgnore });
            yes = entries.length > 0;
        }
        
        return yes;
    }
}

module.exports = {
    Plugin: Plugin,
    CopyTask: CopyTask
};