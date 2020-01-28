#!/usr/bin/env node

const inquirer = require('inquirer');
const process = require('process');
const path = require('path');
const fs = require('fs-extra');

const run = require('./app');

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
            message: 'What type of app do you want?',
            name: 'apptype',
            default: 'koa-api',
            choices: ['koa-api']
        },
        {
            type: 'number',
            message: 'Which port number to open?',
            name: 'appport',
            default: 3000,
            when: (ans) => ans.apptype == 'koa-api'
        },
        {
            type: 'input',
            message: 'What audience will this API belong to?',
            name: 'appaudience',
            when: (ans) => ans.apptype == 'koa-api',
            validate: (input, ans) => input !== ''
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
        {
            type: 'input',
            message: 'What should be the name of your docker image (e.g. juntoz-api-core-client)? This is mandatory.',
            name: 'appname',
            validate: (input, ans) => input !== ''
        },
    ];
}

(async () => {
    const boxen = require('boxen');
    const { version } = require('./package.json');
    console.log(boxen('KOA-APP-STARTER v' + version, { padding: 1 }));
    await doInit();
})();
