const fs = require('fs-extra');
const path = require('path');
const jsyaml = require('js-yaml');
const _merge = require('lodash.merge');
const _get = require('lodash.get');
const _set = require('lodash.set');
const fg = require('fast-glob');
const normalizePath = require('normalize-path');
const replaceInFile = require('replace-in-file');

class Plugin
{
    constructor(pluginPath) {
        this.pluginPath = pluginPath;
    }

    async init() {
        // if the file does not exist, simply assume the default config
        var confpath = path.join(this.pluginPath, 'plugin-cfg.yml');
        if (await fs.exists(confpath)) {
            this._pluginCfg = jsyaml.safeLoad(await fs.readFile(confpath, 'utf-8'));
        } else {
            this._pluginCfg = null;
        }
    }

    copyTask() {
        var ct = new CopyTask(this.pluginPath);
        ct.merge(_get(this._pluginCfg, 'copy'));
        return ct;
    }

    npmInstallTask() {
        var ni = new NpmInstallTask(this.pluginPath);
        ni.merge(_get(this._pluginCfg, 'npm'));
        return ni;
    }

    updateConfigTask() {
        var uc = new UpdateConfigTask(this.pluginPath);
        uc.merge(_get(this._pluginCfg, 'configfile'));
        return uc;
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
                defaultIgnore: []
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
        var globin = path.join(this.config.path, '**');

        // fg globs always work with forward slash
        var nglobin = normalizePath(globin);
        return await fg(nglobin, { dot: true, ignore: this.config.finalIgnore });
    }

    async shouldMinify(filePath) {
        // verify if it has the extension
        var yes = this.config.minify.finalExtensions.indexOf(path.extname(filePath)) >= 0;

        if (yes) {
            // verify if file is not in the ignore list

            // fg globs always work with forward slash
            var nglobin = normalizePath(filePath);
            let entries = await fg(nglobin, { dot: true, ignore: this.config.minify.finalIgnore });
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

    async readDependencies() {
        // open template package.json if exists
        var pkgInfo = {};
        var pkgPath = path.resolve(this.sourcePath, 'package.json');
        if (await fs.exists(pkgPath)) {
            pkgInfo = await fs.readJson(pkgPath);
        }

        // return the dependencies merged between package.json and plugin config file
        var result = {
            dependencies: _merge(pkgInfo.dependencies || {}, this.config.install || {}),
            devDependencies: pkgInfo.devDependencies || {}
        };

        result.hasAny =
            result.dependencies && Object.keys(result.dependencies).length > 0 ||
            result.devDependencies && Object.keys(result.devDependencies).length > 0;

        return result;
    }
}

class UpdateConfigTask {
    constructor(sourcePath) {
        this.sourcePath = sourcePath;
    }

    _defaultCfg() {
        // no default config
        return [];
    }

    merge(cfg) {
        this.config = _merge(this._defaultCfg(), cfg || []);
    }

    hasAny() {
        return this.config.length > 0;
    }

    async applyToFile(filePath) {
        if (this.hasAny()) {
            var inyaml = fs.readFileSync(filePath, 'utf8');
            var fileCfg = await jsyaml.safeLoad(inyaml);

            for (let i = 0; i < this.config.length; i++) {
                const elem = this.config[i];
                _set(fileCfg, elem.path, await jsyaml.safeLoad(elem.value));
            }

            var outyaml = jsyaml.safeDump(fileCfg);
            await fs.writeFile(filePath, outyaml);
        }
    }
}

class ReplaceVarsTask {
    constructor(sourcePath) {
        this.sourcePath = sourcePath;
    }

    _defaultCfg() {
        // no default config
        return [];
    }

    merge(cfg) {
        this.config = _merge(this._defaultCfg(), cfg || []);
    }

    async process(vars) {
        // convert the variables object into keys and values for faster processing
        var fromKeys = Object.keys(vars).map(key => new RegExp(`<${key}>`, 'g'));
        var toValues = Object.keys(vars).map(key => vars[key]);

        var globs = [
            normalizePath(path.join(this.sourcePath, 'Dockerfile')),
            normalizePath(path.join(this.sourcePath, '*.json')),
            normalizePath(path.join(this.sourcePath, '*.cmd')),
            normalizePath(path.join(this.sourcePath, '*.yml')),
            normalizePath(path.join(this.sourcePath, '*.yaml')) 
        ]

        var allResults = [];
        var entries = await fg(globs, { dot: true });
        for (let i = 0; i < entries.length; i++) {
            var _results = await this.applyToFile(entries[i], fromKeys, toValues);
            allResults.push(..._results);
        }

        return allResults;
    }

    async applyToFile(filePath, fromKeys, toValues) {
        var results = await replaceInFile({
            files: filePath,
            from: fromKeys,
            to: toValues
        });

        // return only those that changed
        return results.filter(x => x.hasChanged);
    }
}

module.exports = {
    Plugin: Plugin,
    CopyTask: CopyTask,
    NpmInstallTask: NpmInstallTask,
    UpdateConfigTask: UpdateConfigTask,
    ReplaceVarsTask: ReplaceVarsTask
};
