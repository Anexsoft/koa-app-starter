#!/usr/bin/env node

const process = require('process');

const App = require('./app.js');

var app = new App();

// command args
const argv = require('yargs')
    .usage('Usage: $0 <command>')
    .command('init', 'initializes/updates an nodejs application', (yargs) => {
        app.init();
    })
    .help()
    .argv;
