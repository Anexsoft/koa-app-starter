const fs = require('fs-extra');
const jsyaml = require('js-yaml');

async function readYaml(sourceFile) {
    if (await fs.exists(sourceFile)) {
        var inyaml = await fs.readFile(sourceFile, 'utf-8');
        return jsyaml.safeLoad(inyaml);
    } else {
        return null;
    }
}

async function writeYaml(content, destFile) {
    var outyaml = jsyaml.safeDump(content);
    await fs.writeFile(destFile, outyaml);
}

module.exports = {
    readYaml: readYaml,
    writeYaml: writeYaml
}
