'use strict';

const path = require('path');
const fs = require('fs-extra');
const _get = require('lodash.get');
const execSync = require('child_process').execSync;

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

    async init(destPath) {
        console.log('Initializing to ' + destPath);

        // if we are running thru debugger on the same app, this will screw up the app
        if (destPath.indexOf('koa-app-starter') >= 0) {

            destPath = path.resolve(destPath, 'dist');
        }

        // copy the template folder
        this.copyFiles(destPath);

        // npm install all dependencies that were found in the template
        this.installTemplateDeps();

        // await (() => {});
    }

    copyFiles(destPath) {
        fs.copySync(
            this.templatePath(),
            destPath
        );
    }

    installTemplateDeps() {
        // NOTE: only do this when the program is really running, not while debugging locally, because it will
        // screw up the cli package file

        // open cli template package.json
        var pkg = require(path.resolve(this.templatePath(), 'package.json'));

        // and install the dependencies
        var instarray = [
            { list: _get(pkg, 'dependencies'), cmd: 'npm install' },
            { list: _get(pkg, 'devDependencies'), cmd: 'npm install --save-dev' },
        ];

        instarray.forEach(elem => {
            if (elem.list) {
                for (const key in elem.list) {
                    var cmd = elem.cmd + ' ' + key;
                    if (!this.isDebugEnv()) {
                        execSync(cmd + ' ' + key);
                    } else {
                        console.log('<mock> ' + cmd + ' ' + key);
                    }
                }
            }
        });
    }
}

module.exports = App;
