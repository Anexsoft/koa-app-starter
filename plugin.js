const fs = require('fs-extra');
const path = require('path');
const jsyaml = require('js-yaml');
const _merge = require('lodash.merge');
const fg = require('fast-glob');

class Plugin
{
    constructor(pluginPath) {
        this.pluginPath = pluginPath;

        // if the file does not exist, simply assume the default config
        var confpath = path.join(this.pluginPath, 'plugin-cfg.yml');
        if (fs.existsSync(confpath)) {
            this._configData = jsyaml.safeLoad(fs.readFileSync(confpath, 'utf-8'));
        } else {
            this._configData = null;
        }        
    }

    copyTask() {
        var ct = new CopyTask(this.pluginPath);
        ct.merge(this._configData ? this._configData.copy : null);
        return ct;
    }

    npmInstallTask() {
        var ni = new NpmInstallTask(this.pluginPath);
        ni.merge(this._configData ? this._configData.npm : null);
        return ni;
    }
}

class CopyTask {
    constructor(sourcePath) {
        this.sourcePath = sourcePath;
    }

    _defaultCfg() {
        return {
            path: '.', // base path to copy all files from
            ignore: [], // array of glob paths to ignore to copy
            defaultIgnore: [
                '!**/node_modules',
                '!**/package*.json',
                '!**/readme.txt',
                '!**/plugin-cfg.yml'
            ],
            minify: {
                enabled: true, // enable js minify
                extensions: [],
                defaultExtensions: ['.js'],
                ignore: [], // array of glob paths to ignore to minify
                defaultIgnore: [
                    '!**/src/api/*'
                ]
            },
        };
    }

    merge(cfg) {
        this.config = _merge(this._defaultCfg(), cfg || {});

        // based on the given sourcePath, convert to absolute path
        this.config.path = path.resolve(this.sourcePath, this.config.path);

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
        var yes = this.config.minify.finalExtensions.indexOf(path.extname(filePath)) >= 0;

        if (yes) {
            // verify if file is not in the ignore list
            let entries = await fg(filePath, { dot: true, ignore: this.config.minify.finalIgnore });
            yes = entries.length > 0;
        }
        
        return yes;
    }
}

class NpmInstallTask {
    constructor(sourcePath) {
        this.sourcePath = sourcePath;
    }

    _defaultCfg() {
        return {
            install: {}
        };
    }

    merge(cfg) {
        this.config = _merge(this._defaultCfg(), cfg || {});

        // if it's an array, convert to a dictionary (highly probable it is declared like this)
        // if it was declared as object, leave as is
        if (Array.isArray(this.config.install)) {
            var dict = {};
            for (let i = 0; i < this.config.install.length; i++) {
                dict[this.config.install[i]] = null;                
            }

            this.config.install = dict;
        }
    }

    readDependencies() {
        // open template package.json if exists
        var pkgInfo = {};        
        var pkgPath = path.resolve(this.sourcePath, 'package.json');
        if (fs.existsSync(pkgPath)) {
            pkgInfo = fs.readJsonSync(pkgPath);
        }

        // return the dependencies merged between package.json and plugin config file
        return {
            dependencies: _merge(pkgInfo.dependencies || {}, this.config.install || {}),
            devDependencies: pkgInfo.devDependencies || {}
        };
    }
}

module.exports = {
    Plugin: Plugin,
    CopyTask: CopyTask,
    NpmInstallTask: NpmInstallTask
};