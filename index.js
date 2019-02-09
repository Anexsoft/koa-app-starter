#!/usr/bin/env node

const inquirer = require('inquirer');
const process = require('process');
const path = require('path');
const fs = require('fs-extra');

const App = require('./app.js');

var app = new App();

// command args
const argv = require('yargs')
    .usage('Usage: $0 <command>')
    .command('init', 'initializes/updates an nodejs application')
    .help()
    .argv;

async function doInit() {
    var root = _checkCwdRoot();
    var answers = await inquirer.prompt(_questions(root));
    await app.init(answers.dest);
}

function _checkCwdRoot() {
    var cwd = process.cwd();
    var pckjson = path.resolve(cwd, 'package.json');
    if (!fs.existsSync(pckjson)) {
        console.warn('Warning: you are not currently located in the root of the folder (no package.json was found). It is better to exit and relocate.');
    }

    return cwd;
}

function _questions(root) {
    return [
        {
            type: 'input',
            message: 'Where should the files be copied?',
            name: 'dest',
            default: root
        }
    ];
}

(async () => {
    await doInit();
})();