#!/usr/bin/env node

const inquirer = require('inquirer');
const process = require('process');
const path = require('path');
const fs = require('fs-extra');

const run = require('./app');

async function doInit() {
    var root = await _checkCwdRoot();

    // if we are running thru debugger on the same app, this will
    // screw up this app, therefore append a dist folder so it will not interfere
    if (root.indexOf('koa-app-starter') >= 0) {
        root = path.resolve(root, '_test');
        console.info('Warning: you are located in the koa-app-starter root folder\n');
    }

    var answers = await inquirer.prompt(_questions(root));
    if (answers.go) {
        answers.dest = root;

        // expand appname with appns
        answers.appname = ns_plus_domain(answers.appns, answers.appname);
        await run(answers);
    }
}

async function _checkCwdRoot() {
    return process.cwd();
}

function ns_plus_domain(ns, dom) {
    return ns + '-' + dom;
}

function _questions(root) {
    var _minLettersAndHyphen = '^[a-z]{2,20}(-[a-z]{2,20})###$';
    var minTwoWordsLettersAndHyphen = new RegExp(_minLettersAndHyphen.replace('###', '+'));
    var minOneWordLettersAndHyphen = new RegExp(_minLettersAndHyphen.replace('###', '*'));
    var defaultPort = 3000;

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
            validate: (input, ans) => {
                if (input !== '' && minTwoWordsLettersAndHyphen.test(input)) {
                    return true;
                } else {
                    return "Only accepts characters and hyphens";
                }
            }
        },
        {
            type: 'confirm',
            message: 'DB: Does this app need to connect to mssql?',
            name: 'addmssql',
            default: false,
        },
        {
            type: 'input',
            message: 'K8S: What should be the app namespace in kubernetes?',
            name: 'appns',
            validate: (input, ans) => {
                if (minTwoWordsLettersAndHyphen.test(input)) {
                    return true;
                } else {
                    return "Only accepts characters and hyphens";
                }
            }
        },
        {
            type: 'input',
            message: (ans) => `K8S: What should be the name of your docker image?`,
            name: 'appname',
            transformer: (input, ans, opt) => ns_plus_domain(ans.appns, input),
            validate: (input, ans) => {
                if (input !== '' && minOneWordLettersAndHyphen.test(input)) {
                    return true;
                } else {
                    return "Only accepts characters and hyphens";
                }
            }
        },
        {
            type: 'number',
            message: 'NET: Which port should this app listen to?',
            name: 'appport',
            default: defaultPort,
            when: (ans) => ans.apptype == 'koa-api',
            validate: (input, ans) => {
                if (Number.isInteger(input) && input >= defaultPort) {
                    return true;
                } else {
                    return `Only numbers accepted above ${defaultPort}`;
                }
            }
        },
        {
            type: 'confirm',
            message: 'WARN: This folder does not contain a package.json file. Do you want to continue?',
            name: 'continueWithoutPkgJson',
            default: false,
            when: async (input, ans) => {
                var pckjson = path.resolve(root, 'package.json');
                return !(await fs.exists(pckjson));
            }
        },
        {
            type: 'confirm',
            message: 'FINAL: All set up. Do you want to continue?',
            name: 'go',
            default: true,
            when: (ans) => ans.continueWithoutPkgJson !== false
        },
    ];
}

(async () => {
    const boxen = require('boxen');
    const { version } = require('./package.json');
    console.log(boxen('KOA-APP-STARTER v' + version, { padding: 1 }));
    global.appVersion = version;
    await doInit();
})();
