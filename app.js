'use strict';

const path = require('path');
const fs = require('fs-extra');
const execSync = require('child_process').execSync;
const terser = require('terser');
const Plugin = require('./plugin').Plugin;
const ReplaceVarsTask = require('./plugin').ReplaceVarsTask;

async function run(options) {
    console.log('> Starting');

    var appPluginPath = _mapAppType(options.apptype);

    var plugins = [
        options.addmssql ? new Plugin(path.resolve(_getCliPath(), 'partial-mssql')) : null,
        new Plugin(path.resolve(_getCliPath(), appPluginPath))
    ];

    // build the folder completely
    for (let i = 0; i < plugins.length; i++) {
        const p = plugins[i];
        if (p) {
            // first initialize
            await p.init();

            // then execute it
            await _buildDestinationFolder(p.copyTask(), options.dest);
        }
    }

    // apply config completely
    for (let i = 0; i < plugins.length; i++) {
        const p = plugins[i];
        if (p) {
            await _applyConfig(p.updateConfigTask(), path.join(options.dest, 'src', 'cfg', 'default.yml'));
        }
    }

    // replace variables in all files that were generated
    var vars = {
        appport: options.appport,
        appname: options.appname,
        appns: options.appns,
        appaudience: options.appaudience
    };
    await _replaceVariables(vars, path.join(options.dest, '**'));

    // run npm completely (always set as the last step)
    for (let i = 0; i < plugins.length; i++) {
        const p = plugins[i];
        if (p) {
            await _installTemplateDeps(p.npmInstallTask())
        }
    }
}

function _mapAppType(appType) {
    switch(appType) {
        case 'koa-api':
            return 'template-koa';
        default:
            return null;
    }
}

/**
 * Gets the folder path of this cli
 */
function _getCliPath() {
    return __dirname;
}

function _isDebugEnv() {
    // cwd is the directory where the program is run.
    // Normally the developer will locate himself in the root of the project to call node commands.
    return _getCliPath() === process.cwd();
}

async function _buildDestinationFolder(copyTask, destPath) {
    let entries = await copyTask.getFilesToCopy();
    for (let i = 0; i < entries.length; i++) {
        // NOTE: fg glob output is also forward slash
        let entry = path.normalize(entries[i]);

        // convert the entry to the destination
        let destfile = path.resolve(destPath, path.relative(copyTask.config.path, entry));

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

async function _minifyJs(inPath, outPath) {
    var inContent = await fs.readFile(inPath, "utf8");

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
            await fs.createFile(outPath);
            await fs.writeFile(outPath, inMinContent);
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

async function _installTemplateDeps(npmInsTask) {
    // process package.json
    var pkg = await npmInsTask.readDependencies();
    if (pkg.hasAny) {
        console.log('> Install npm dependencies (this could take some minutes). Please do not touch the console.');

        // NOTE: Why not just copy the template package.json and run a global npm install? Because by doing a fresh npm install of
        // each package (without the version), we will always get the latest version of each library.
        [
            { list: pkg.dependencies, args: '--save' },
            { list: pkg.devDependencies, args: '--save-dev' },
        ].forEach(elem => {
            for (const pkgKey in elem.list) {
                // set @latest to always force the latest option
                // this works well when the package.json already contains a version of the package.
                var cmd = `npm install ${elem.args} ${pkgKey}@latest`;
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
}

async function _applyConfig(configTask, configFile) {
    if (configTask.hasAny()) {
        console.log(`>> Updating config file ${configFile}`);
        await configTask.applyToFile(configFile);
        console.log('>> Updated');
    }
}

async function _replaceVariables(vars, sourcePath) {
    var replaceTask = new ReplaceVarsTask(sourcePath);
    var results = await replaceTask.process(vars);

    console.log(`> Updating vars in files in ${sourcePath}`);
    for (let i = 0; i < results.length; i++) {
        const element = results[i];
        console.log(`>> Vars found and updated in file ${element.file}`);
    }

    console.log(`> Done updated vars`);
}

module.exports = run;
