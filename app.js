'use strict';

const path = require('path');
const fs = require('fs-extra');
const _get = require('lodash.get');
const execSync = require('child_process').execSync;
const fg = require('fast-glob');
const terser = require("terser");

async function run(options) {
    console.log('> Starting');

    // copy the template common folder first
    var commonTemplatePath = path.resolve(_getCliPath(), 'template-common');
    await _buildDestinationFolder(commonTemplatePath, options.dest);

    // copy the template selected folder second
    var selectedTemplatePath = path.resolve(_getCliPath(), options.apptype === 'koa' ? 'template-koa' : 'template-simple');
    await _buildDestinationFolder(selectedTemplatePath, options.dest);

    // npm install all dependencies that were found in the template
    _installTemplateDeps(selectedTemplatePath);
}

/**
 * Gets the folder path of this cli
 */
function _getCliPath() {
    return __dirname;
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
    let intactPaths = ['/src/api'];

    let fgCopyOptions = {
        dot: true,
        ignore: [
            '!**/node_modules',
            '!**/package*.json',
            '!**/readme.txt'
        ]
    };

    let entries = await fg(path.join(src, '**'), fgCopyOptions);
    for (let i = 0; i < entries.length; i++) {
        let entry = entries[i];

        // remove the source dir and rebuild the path
        let relpath = path.relative(src, entry);
        let destfile = path.resolve(destPath, relpath);

        if (entry.endsWith('.js') && !_inPaths(entry, intactPaths)) {
            var mincode = {};
            mincode[path.basename(entry)] = fs.readFileSync(entry, "utf8");
            var uglycode = terser.minify(mincode);
            if (uglycode.error) {
                console.log(`>> Error to minify ${destfile}: ` + JSON.stringify(uglycode.error));
            } else {
                try {
                    fs.createFileSync(destfile);
                    fs.writeFileSync(destfile, uglycode.code);
                    console.log(`>> Copied and minified ${destfile}`);
                } catch (ex) {
                    console.log(`>> Error to write ${destfile}: ` + ex.message);
                }
            }
        } else {
            await fs.copy(entry, destfile, { overwrite: true });
            console.log(`>> Copied ${destfile}`);
        }
    }
}

function _inPaths(path, list) {
    var result = false;
    for (let i = 0; !result && i < list.length; i++) {
        result = path.indexOf(list[i]) >= 0;
    }

    return result;
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
