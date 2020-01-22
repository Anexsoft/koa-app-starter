#!/usr/bin/env node

const inquirer = require('inquirer');
const process = require('process');
const path = require('path');
const fs = require('fs-extra');

const run = require('./app');

// command args
const argv = require('yargs')
    .help()
    .argv;

async function doInit() {
    var root = await _checkCwdRoot();
    var answers = await inquirer.prompt(_questions(root));
    await run(answers);
}

async function _checkCwdRoot() {
    var cwd = process.cwd();
    var pckjson = path.resolve(cwd, 'package.json');
    var found = await fs.exists(pckjson);
    if (!found) {
        console.warn('Warning: you are not currently located in the root of the folder (no package.json was found). It is better to exit and relocate.');
    }

    return cwd;
}

function _questions(root) {
    // if we are running thru debugger on the same app, this will
    // screw up this app, therefore append a dist folder so it will not interfere
    if (root.indexOf('koa-app-starter') >= 0) {
        root = path.resolve(root, '_test');
        console.info('Warning: you are located in the koa-app-starter root folder');
    }

    return [
        {
            type: 'list',
            message: 'What type of app do you want (koa)?',
            name: 'apptype',
            default: 'koa',
            choices: ['koa']
        },
        {
            type: 'confirm',
            message: 'Add mssql?',
            name: 'addmssql',
            default: false,
        },
        {
            type: 'input',
            message: 'Where should the files be copied?',
            name: 'dest',
            default: root
        },
    ];
}

(async () => {
    await doInit();
})();
