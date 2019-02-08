'use strict';

const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs-extra');
const _get = require('lodash.get');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

class App {
    /**
     * Gets the folder path of this cli
     */
    cliPath() {
        return path.dirname(__filename);
    }

    /**
     * Gets the folder path of the destination application that will be started
     */
    hostPath() {
        return path.dirname(require.main.filename);
    }

    isDebugEnv() {
        return this.cliPath() === this.hostPath();
    }

    async init() {
        console.log('init');

        // copy the template folder
        await this.copyBaseFiles();

        this.installTemplateDeps();
    }

    async copyBaseFiles() {
        var answers = await inquirer.prompt([
            {
                type: 'input',
                message: `Enter the destination folder (${this.hostPath()} + '/src'):`,
                name: 'dest'
            }
        ]);

        if (!answers.dest) {
            answers.dest = this.hostPath();
        }

        // NOTE: if the cli and host are the same is because we are testing by debugging locally
        // if so, add a suffix so we don't interfere with the cli code
        await fs.copy(
            path.resolve(this.cliPath(), 'template/src'),
            path.resolve(answers.dest, 'src' + (this.cliPath() === this.hostPath() ? 'test': ''))
        );
    }

    installTemplateDeps() {
        // NOTE: only do this when the program is really running, not while debugging locally, because it will
        // screw up the cli package file

        // open cli template package.json
        var pk = require(path.resolve(this.cliPath(), 'template', 'package.json'));

        // and add them to the host app
        var pkdeps = _get(pk, 'dependencies');
        if (pkdeps) {
            for (const key in pkdeps) {
                if (!this.isDebugEnv()) {
                    execSync('npm install ' + key);
                } else {
                    console.log('installing ' + key);
                }
            }
        }
    }
}

module.exports = App;
