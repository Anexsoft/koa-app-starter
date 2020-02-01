#!/usr/bin/env node

const inquirer = require('inquirer');
const process = require('process');
const path = require('path');
const fs = require('fs-extra');
const jsyaml = require('js-yaml');

const run = require('./app');

var starterOutputPath = null; 

async function doInit(initData) {
    var root = process.cwd();

    // if we are running thru debugger on the same app, this will
    // screw up this app, therefore append a dist folder so it will not interfere
    if (root.indexOf('koa-app-starter') >= 0) {
        root = path.resolve(root, '_test');
        console.info('Warning: you are located in the koa-app-starter root folder');
    }

    starterOutputPath = path.join(root, '.starter');

    var lastAnswers = await loadYamlToJson(path.join(starterOutputPath, 'answers.yml'));
    if (!lastAnswers) {
        console.debug(`Note: No answers file found.`);
    }

    console.log('\n');
    var answers = await inquirer.prompt(_questions(root, lastAnswers));
    if (answers.go) {
        answers.fullappname = ns_plus_domain(answers.appns, answers.appname);

        // save the current runtime
        await saveRuntime(initData);

        // save the answers first
        await saveAnswers(answers);

        // execute
        await run({
            
            dest: root,
            answers: answers
        });
    }
}

function ns_plus_domain(ns, dom) {
    return ns + '-' + dom;
}

function _questions(root, lastAnswers) {
    lastAnswers = lastAnswers || {};

    // validator for namespaces and application name
    var _minLettersAndHyphen = '^[a-z]{2,20}(-[a-z]{2,20})###$';
    var minTwoWordsLettersAndHyphen = new RegExp(_minLettersAndHyphen.replace('###', '+'));
    var minOneWordLettersAndHyphen = new RegExp(_minLettersAndHyphen.replace('###', '*'));
    
    var defaultPort = 3000;

    return [
        {
            type: 'list',
            message: 'APP: What type should this app be?',
            name: 'apptype',
            default: lastAnswers.apptype || 'koa-api',
            choices: ['koa-api']
        },
        {
            type: 'input',
            message: 'AUTH: What audience should this app belong to?',
            name: 'appaudience',
            default: lastAnswers.appaudience || null,
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
            default: lastAnswers.addmssql || false,
        },
        {
            type: 'input',
            message: 'K8S: What should be the app namespace in kubernetes?',
            name: 'appns',
            default: lastAnswers.appns || null,
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
            default: lastAnswers.appname || null,
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
            default: lastAnswers.appport || defaultPort,
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
            message: `WARN: This folder ${root} does not contain a package.json file. Do you want to continue?`,
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

async function saveRuntime(initData) {
    initData.ts = new Date().toISOString();

    var headerdoc = `
## This file was created to timestamp the last execution to know which starter version was used in the application.
## It is safe to delete. It is not mandatory to have it to run the starter.
    `;

    var ymltxt = 
        headerdoc + '\n' + 
        jsyaml.safeDump(initData);

    await saveYaml(path.join(starterOutputPath, 'last.yml'), ymltxt);
}

async function saveAnswers(answers) {
    var toSave = Object.assign({}, answers);
    
    // clear some answers that we do need to ask every time
    delete toSave.continueWithoutPkgJson;
    delete toSave.go; 

    var headerdoc = `
## This file was created to store the last answers that were put so we can reuse them when a new version needs to be updated.
## It is safe to delete. It is not mandatory to have it to run the starter.
    `;

    var ymltxt = 
        headerdoc + '\n' + 
        jsyaml.safeDump(toSave);

    await saveYaml(path.join(starterOutputPath, 'answers.yml'), ymltxt);
}

async function loadYamlToJson(srcFile) {
    try {
        var inputContent = await fs.readFile(srcFile);
        return jsyaml.safeLoad(inputContent);
    } catch (error) {
        return null;
    }
}

async function saveYaml(destFile, yamlContent) {
    await fs.ensureFile(destFile);
    await fs.writeFile(destFile, yamlContent);
}

(async () => {
    const boxen = require('boxen');
    const { version } = require('./package.json');
    console.log(boxen('KOA-APP-STARTER v' + version, { padding: 1 }));
    await doInit({
        appVersion: version,
        user: require("os").userInfo().username,
    });
})();
