const _get = require('lodash.get');
const fs = require('fs-extra');
const path = require('path');
const ymlUtil = require('./common/ymlutil');

class Plugin
{
    constructor(pluginPath) {
        this._pluginPath = pluginPath;
    }

    async init() {
        this._pluginCfg = await ymlUtil.readYaml(path.join(this._pluginPath, 'plugin-cfg.yml'));

        // copy
        const CopyTask = require('./tasks/CopyTask');
        this._copyTask = new CopyTask();
        this._copyTask.applyConfig(_get(this._pluginCfg, 'copy'));

        // update config
        const UpdateConfigTask = require('./tasks/UpdateConfigTask');
        this._updateCfgTask = new UpdateConfigTask();
        this._updateCfgTask.applyConfig(_get(this._pluginCfg, 'configfile'));
        // this._updateCfgTask.applyConfig(_get(this._pluginCfg, 'envfile'));
    }

    async copyFiles(destPath) {
        return await this._copyTask.execute(this._pluginPath, destPath);
    }

    async injectConfig(destFile) {
        return await this._updateCfgTask.execute(destFile);
    }

    async getDependencies() {
        // read from config file
        var resultDeps = _get(this._pluginCfg, 'npm.install') || [];

        // read from package.json if exists
        var pkgFile = path.join(this._pluginPath, 'package.json');
        var pkgInfo = {};
        if (await fs.exists(pkgFile)) {
            pkgInfo = await fs.readJson(pkgFile);
        }

        var pkgDeps = Object.keys(pkgInfo.dependencies || {});
        resultDeps.push(...pkgDeps);

        var pkgDevDeps = Object.keys(pkgInfo.devDependencies || {});
        return {
            dependencies: resultDeps,
            devDependencies: pkgDevDeps
        };
    }
}

module.exports = Plugin;
