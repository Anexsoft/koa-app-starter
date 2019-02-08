'use strict';

const fs = require('fs');

class PathUtil {
    static loadJson(path) {
        if (!fs.existsSync(path)) {
            throw new Error(`Path ${path} not found`);
        }

        let contents = null;
        try {
            contents = JSON.parse(fs.readFileSync(path));
        } catch (err) {
            throw new Error(`Path ${path} contents cannot be parsed to json: ${err.message}`);
        }

        return contents;
    }
}

module.exports = PathUtil;
