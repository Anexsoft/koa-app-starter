#!/usr/bin/env node

const inquirer = require('inquirer');
const process = require('process');
const path = require('path');
const fs = require('fs-extra');

const run = require('./app');

async function doInit() {
    var root = await _checkCwdRoot();
    var answers = await inquirer.prompt(_questions(root));

    // expand appname with appns
    answers.appname = ns_plus_domain(answers.appns, answers.appname);
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

function ns_plus_domain(ns, dom) {
    return ns + '-' + dom;
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
            message: 'APP: What type should this app be?',
            name: 'apptype',
            default: 'koa-api',
            choices: ['koa-api']
        },
        {
            type: 'input',
            message: 'AUTH: What audience should this app belong to?',
            name: 'appaudience',
            when: (ans) => ans.apptype == 'koa-api',
            validate: (input, ans) => input !== ''
        },
        {
            type: 'confirm',
            message: 'DB: Does this app need to connect to mssql?',
            name: 'addmssql',
            default: false,
        },
        {
            type: 'input',
            message: 'K8S: What should be the k8s namespace for your docker image?',
            name: 'appns',
            validate: (input, ans) => input !== '' && /^(-?[a-z]+)+/g.test(input)
        },         
        {
            type: 'input',
            message: (ans) => `K8S: Complete ${ans.appns} with your app main domain`,
            name: 'appname',
            transformer: (input, ans, opt) => ns_plus_domain(ans.appns, input),
            validate: (input, ans) => input !== ''
        },
        {
            type: 'number',
            message: 'NET: Which port should this app listen to?',
            name: 'appport',
            default: 3000,
            when: (ans) => ans.apptype == 'koa-api'
        },        
        {
            type: 'input',
            message: 'FINAL: Where should the files be copied?',
            name: 'dest',
            default: root
        },   
    ];
}

(async () => {
    const boxen = require('boxen');
    const { version } = require('./package.json');
    console.log(boxen('KOA-APP-STARTER v' + version, { padding: 1 }));
    await doInit();
})();
