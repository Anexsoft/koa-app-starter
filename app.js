'use strict';

const path = require('path');
const fs = require('fs-extra');
const _get = require('lodash.get');
const execSync = require('child_process').execSync;
const fg = require('fast-glob');

async function run(options) {
    console.log('> Starting');

    // copy the template folder
    await _buildDestinationFolder(_getTemplatePath(options.apptype), options.dest);

    // npm install all dependencies that were found in the template
    _installTemplateDeps(_getTemplatePath(options.apptype));
}

/**
 * Gets the folder path of this cli
 */
function _getCliPath() {
    return __dirname;
}

function _getTemplatePath(apptype) {
    return path.resolve(_getCliPath(), apptype === 'koa' ? 'template-koa' : 'template-simple');
}

/**
 * Gets the folder path of the destination application that will be started
 */
function _getRunPath() {
    // cwd is the directory where the program is run.
    // Normally the developer will locate himself in the root of the project to call node commands.
    return process.cwd();
}

function _isDebugEnv() {
    return _getCliPath() === _getRunPath();
}

async function _buildDestinationFolder(src, destPath) {
    let options = {
        dot: true,
        ignore: [
            '!**/node_modules',
            '!**/package*.json',
            '!**/readme.txt'
        ]
    };

    let entries = await fg(path.join(src, '**'), options);
    for (let i = 0; i < entries.length; i++) {
        let entry = entries[i];

        // remove the source dir
        let relpath = path.relative(src, entry);

        // copy file
        let destfile = path.resolve(destPath, relpath);
        await fs.copy(entry, destfile, { overwrite: true });
        console.log(`>> Copied ${destfile}`);
    }
}

function _installTemplateDeps(src) {
    // NOTE: only do this when the program is really running, not while debugging locally, because it will
    // screw up the cli package file

    console.log('> Starting to install npm dependencies (this could take some minutes). Please do not touch the console.');

    // open cli template package.json
    var packagejson = require(path.resolve(src, 'package.json'));

    // and install the dependencies
    var instarray = [
        { list: _get(packagejson, 'dependencies'), args: '--save' },
        { list: _get(packagejson, 'devDependencies'), args: '--save-dev' },
    ];

    // NOTE: Why not just copy the template package.json and run a global npm install? Because by doing a fresh npm install of
    // each package (without the version), we will always get the latest version of each library.
    instarray.forEach(elem => {
        if (elem.list) {
            for (const pkgKey in elem.list) {
                var cmd = `npm install ${elem.args} ${pkgKey}`;
                if (!_isDebugEnv()) {
                    execSync(cmd, { stdio: [0, 1, 2] });
                } else {
                    console.log('>> <mock> ' + cmd);
                }
            }
        }
    });
}

module.exports = run;
