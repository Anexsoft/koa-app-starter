#!/usr/bin/env node

const commander = require('commander');
const process = require('process');

const App = require('./app.js');

var app = new App();

commander
    .version(process.env.npm_package_version)
    .description('CLI to create/update a NodeJs Koa web api/application');

commander
    .command('init')
    .description('Initializes a new app')
    .action(async () => {
        app.init();
    });

commander
    .parse(process.argv);
