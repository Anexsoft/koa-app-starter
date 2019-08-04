'use strict';

const path = require('path');
const fs = require('fs-extra');
const _get = require('lodash.get');
const execSync = require('child_process').execSync;
const fg = require('fast-glob');
const terser = require("terser");
const Plugin = require("./plugin");

async function run(options) {
    console.log('> Starting');

    // copy the partial common folder first
    var commonPlugin = new Plugin(path.resolve(_getCliPath(), 'partial-common'));
    await _buildDestinationFolder(commonPlugin.copyTask(), options.dest);

    if (options.addmssql) {
        var mssqlPlugin = new Plugin(path.resolve(_getCliPath(), 'partial-mssql'));
        await _buildDestinationFolder(mssqlPlugin.copyTask(), options.dest);
    }

    // copy the template selected folder
    var selectedTemplatePath = path.resolve(_getCliPath(), options.apptype === 'koa' ? 'template-koa' : 'template-simple');
    var tempPlugin = new Plugin(selectedTemplatePath);
    await _buildDestinationFolder(tempPlugin.copyTask(), options.dest);

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

async function _buildDestinationFolder(copyTask, destPath) {
    let entries = await copyTask.getFilesToCopy();
    for (let i = 0; i < entries.length; i++) {
        let entry = entries[i];

        // convert the entry to the destination
        let destfile = path.resolve(destPath, path.relative(copyOptions.path, entry));

        if (await copyTask.shouldMinify(entry)) {
            // minify the js files except for some we want to ignore
            var minResult = _minifyJs(entry, destfile);

            if (!minResult.ok) {
                if (minResult.reason == 'uglify') {
                    console.log(`>> Error to minify ${destfile}: ` + JSON.stringify(minResult.error));
                } else if (minResult.reason == 'write') {
                    console.log(`>> Error to write ${destfile}: ` + minResult.error.message);
                }
            } else {
                console.log(`>> Copied and minified ${destfile}`);
            }
        } else {
            // simple copy of the file
            await fs.copy(entry, destfile, { overwrite: true });
            console.log(`>> Copied ${destfile}`);
        }
    }
}

function _minifyJs(inPath, outPath) {
    var inContent = fs.readFileSync(inPath, "utf8");

    var mincode = {};
    mincode[path.basename(inPath)] = inContent;
    var uglycode = terser.minify(mincode);
    if (uglycode.error) {
        return {
            ok: false,
            reason: 'uglify',
            error: uglycode.error
        };
    } else {
        try {
            // disable eslint on minified files
            var inMinContent = '/* eslint-disable */\n' + uglycode.code;
            fs.createFileSync(outPath);
            fs.writeFileSync(outPath, inMinContent);
            return {
                ok: true
            };
        } catch (ex) {
            return {
                ok: false,
                reason: 'writeFile',
                error: ex
            };
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

function _installTemplateDeps(templatePath, includeMoreDeps) {
    // NOTE: only do this when the program is really running, not while debugging locally, because it will
    // screw up the cli package file

    console.log('> Starting to install npm dependencies (this could take some minutes). Please do not touch the console.');

    // open cli template package.json
    var packagejson = require(path.resolve(templatePath, 'package.json'));

    // and install the dependencies
    var instarray = [
        { list: _get(packagejson, 'dependencies'), args: '--save' },
        { list: _get(packagejson, 'devDependencies'), args: '--save-dev' },
    ];

    if (includeMoreDeps) {
        instarray.push({ list: includeMoreDeps, args: '--save' });
    }

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
