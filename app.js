'use strict';

const inquirer = require('inquirer');
// const fs = require('fs');
var ncp = require('ncp').ncp;
// const child_process = require('child_process');

class App {
    async init() {
        console.log('init');
        
        var answers = await inquirer.prompt([
            {
                type: 'input',
                message: 'Enter the destination folder:',
                name: 'dest'
            }
        ]);

        ncp.limit = 16;
        await ncp('template/src/', answers.dest);
    }
}

module.exports = App;