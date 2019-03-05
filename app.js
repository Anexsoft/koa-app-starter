'use strict';

const path = require('path');
const fs = require('fs-extra');
const _get = require('lodash.get');
const execSync = require('child_process').execSync;
const fg = require('fast-glob');

class App {
    /**
     * Gets the folder path of this cli
     */
    cliPath() {
        return __dirname;
    }

    templatePath() {
        return path.resolve(this.cliPath(), 'template');
    }

    /**
     * Gets the folder path of the destination application that will be started
     */
    runPath() {
        // cwd is the directory where the program is run.
        // Normally the developer will locate himself in the root of the project to call node commands.
        return process.cwd();
    }

    isDebugEnv() {
        return this.cliPath() === this.runPath();
    }

    async init(options) {
        console.log('> Starting');

        // copy the template folder
        await this.buildFolder(options.dest);

        // npm install all dependencies that were found in the template
        this.installTemplateDeps();

        console.log('> Finished');
    }

    async buildFolder(destPath) {
        let src = this.templatePath();

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

    installTemplateDeps() {
        // NOTE: only do this when the program is really running, not while debugging locally, because it will
        // screw up the cli package file

        console.log('> Starting to install npm dependencies (this could take some minutes). Please do not touch the console.');

        // open cli template package.json
        var pkg = require(path.resolve(this.templatePath(), 'package.json'));

        // and install the dependencies
        var instarray = [
            { list: _get(pkg, 'dependencies'), cmd: 'npm install' },
            { list: _get(pkg, 'devDependencies'), cmd: 'npm install --save-dev' },
        ];

        // NOTE: Why not just copy the template package.json and run a global npm install? Because by doing a fresh npm install of
        // each package (without the version), we will always get the latest version of each library.
        instarray.forEach(elem => {
            if (elem.list) {
                for (const key in elem.list) {
                    var cmd = elem.cmd + ' ' + key;
                    console.log('>> Exec ' + cmd);
                    if (!this.isDebugEnv()) {
                        // inherit stdio so the output shows up
                        execSync(cmd, { stdio: 'inherit' });
                    } else {
                        console.log('<mock> ' + cmd);
                    }
                }
            }
        });
    }
}

module.exports = App;
