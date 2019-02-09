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
    if (!answers.overwrite) {
        process.exit(0);
    }

    await app.init(answers);
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
    // if we are running thru debugger on the same app, this will 
    // screw up this app, therefore append a dist folder so it will not interfere
    if (root.indexOf('koa-app-starter') >= 0) {
        root = path.resolve(root, '_test');
        console.warn('Warning: you are located in the koa-app-starter');
    }

    return [
        {
            type: 'input',
            message: 'Where should the files be copied?',
            name: 'dest',
            default: root
        },
        {
            type: 'confirm',
            message: 'The destination already exists, do you want to overwrite?',
            name: 'overwrite',
            default: false,
            when: (ans) => { return fs.existsSync(ans.dest); }
        }
    ];
}

(async () => {
    await doInit();
})();