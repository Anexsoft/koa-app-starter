'use strict';

const path = require('path');
const execSync = require('child_process').execSync;
const Plugin = require('./Plugin');
const ReplaceVarsTask = require('./tasks/ReplaceVarsTask');

async function run(options) {
    console.log('> Starting');

    // get valid plugins only
    var plugins = [
        options.addmssql ? new Plugin(path.resolve(_getCliPath(), 'partial-mssql')) : null,
        options.apptype === 'koa-api' ? new Plugin(path.resolve(_getCliPath(), 'template-koa')) : null
    ].filter(i => i);

    // build the folder first with all files from all plugins
    for (let i = 0; i < plugins.length; i++) {
        await plugins[i].init();
        await plugins[i].copyFiles(options.dest);
    }

    // apply config from all plugins
    for (let i = 0; i < plugins.length; i++) {
        await plugins[i].injectConfig(path.join(options.dest, 'config', 'default.yml'));
    }

    // replace variables in all files that were generated
    var vars = {
        appport: options.appport,
        appname: options.appname,
        appns: options.appns,
        appaudience: options.appaudience
    };
    await _replaceVariablesInFiles(options.dest, vars);

    // run npm completely (always set as the last step)

    // gather all dependencies from all plugins
    var deps = [];
    var devDeps = [];
    for (let i = 0; i < plugins.length; i++) {
        var pdeps = await plugins[i].getDependencies();
        if (pdeps) {
            deps.push(...pdeps.dependencies);
            devDeps.push(...pdeps.devDependencies);
        }
    }

    await _npmInstall(deps, devDeps);
}

/**
 * Gets the folder path of this cli
 */
function _getCliPath() {
    return __dirname;
}

function _isDebugEnv() {
    // https://stackoverflow.com/a/45074641/915865
    var hasDebugger = typeof v8debug === 'object' || /--debug|--inspect/.test(process.execArgv.join(' '));

    // cwd is the directory where the program is run.
    // Normally the developer will locate himself in the root of the project to call node commands.
    return _getCliPath() === process.cwd() || hasDebugger;
}

async function _npmInstall(dependencies, devDependencies) {
    console.log('> Install npm dependencies (this could take some minutes). Please do not touch the console.');

    // NOTE: Why not just copy the template package.json and run a global npm install? Because by doing a fresh npm install of
    // each package (without the version), we will always get the latest version of each library.
    [
        { list: dependencies, args: '--save' },
        { list: devDependencies, args: '--save-dev' },
    ].forEach(elem => {
        for (let i = 0; i < elem.list.length; i++) {
            // set @latest to always force the latest option
            // this works well when the package.json already contains a version of the package.
            var cmd = `npm install ${elem.args} ${elem.list[i]}@latest`;
            if (!_isDebugEnv()) {
                // force sync processing because we want to wait until doing the following npm install
                execSync(cmd, { stdio: [0, 1, 2] });
            } else {
                // NOTE: when debugging, do not mess with any package.json
                console.log('>> <mock> ' + cmd);
            }
        }
    });
}

async function _replaceVariablesInFiles(sourcePath, vars) {
    var replaceTask = new ReplaceVarsTask();
    var results = await replaceTask.execute(sourcePath, vars);

    console.log(`> Updating vars in files in ${sourcePath}`);
    for (let i = 0; i < results.length; i++) {
        console.log(`>> Vars found and updated in file ${results[i].file}`);
    }

    console.log(`> Done updated vars`);
}

module.exports = run;
