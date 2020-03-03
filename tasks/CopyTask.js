const _merge = require('lodash.merge');
const fg = require('fast-glob');
const fs = require('fs-extra');
const normalizePath = require('normalize-path');
const path = require('path');
const terser = require('terser');

class CopyTask {
    _defaultCfg() {
        return {
            ignore: [], // array of glob paths to ignore to copy
            defaultIgnore: [
                '!**/node_modules',
                '!**/package*.json',
                '!**/readme.txt',
                '!**/plugin-cfg.yml'
            ],
            minify: {
                enabled: true, // enable js minify
                extensions: [],
                defaultExtensions: ['.js'],
                ignore: [], // array of glob paths to ignore to minify
                defaultIgnore: []
            }
        };
    }

    applyConfig(cfg) {
        this.config = _merge(this._defaultCfg(), cfg || {});

        // build the copy final ignore list
        this.config.finalIgnore = this.config.defaultIgnore.concat(this.config.ignore || []);

        // build the minify final extension list
        this.config.minify.finalExtensions = this.config.minify.defaultExtensions.concat(this.config.minify.extensions || []);

        // build the minify final ignore list
        this.config.minify.finalIgnore = this.config.minify.defaultIgnore.concat(this.config.minify.ignore || []);
    }

    async execute(sourcePath, destPath) {
        const entries = await this._getFilesToCopy(sourcePath);
        for (let i = 0; i < entries.length; i++) {
            const srcfile = entries[i];

            // get the relative path based on the plugin root, so we mimic the same structure
            const relSrcFile = srcfile.replace(sourcePath, '');

            const destfile = path.join(destPath, relSrcFile);

            // copy the file to the destination
            await fs.copy(srcfile, destfile, { overwrite: true });

            var minResult = null;
            const shouldMinify = await this._shouldMinify(destfile);
            if (shouldMinify) {
                minResult = await this._minifyJs(destfile, destfile);
            }

            if (minResult == null) {
                console.log(`>> Copied only ${destfile}`);
            } else if (minResult.ok) {
                console.log(`>> Copied and Minified ${destfile}`);
            } else {
                console.log(`>> Copied ${destfile} but with error while minifying (${minResult.reason}): ${JSON.stringify(minResult.error)}`);
            }
        }
    }

    async _getFilesToCopy(sourcePath) {
        // path.join will convert to os slash
        var globin = path.join(sourcePath, '**');

        // fg globs need forward slash and its output is forward slash too
        var nglobin = normalizePath(globin);
        var results = await fg(nglobin, { dot: true, ignore: this.config.finalIgnore });

        // convert to os slash
        return results.map(i => path.normalize(i));
    }

    async _shouldMinify(filePath) {
        // verify if it has the extension
        var yes = this.config.minify.finalExtensions.includes(path.extname(filePath));

        if (yes) {
            // verify if file is not in the ignore list
            var nglobin = normalizePath(filePath);
            const entries = await fg(nglobin, { dot: true, ignore: this.config.minify.finalIgnore });
            yes = entries.length > 0;
        }

        return yes;
    }

    async _minifyJs(inPath, outPath) {
        var inContent = await fs.readFile(inPath, 'utf8');

        var mincode = {};
        mincode[path.basename(inPath)] = inContent;
        var uglycode = terser.minify(mincode, {
            mangle: false
        });
        if (uglycode.error) {
            return {
                ok: false,
                reason: 'uglify',
                error: uglycode.error
            };
        } else {
            try {
                // disable eslint on minified files
                uglycode.code = '/* eslint-disable */\n' + uglycode.code;
                await fs.writeFile(outPath, uglycode.code);
            } catch (ex) {
                return {
                    ok: false,
                    reason: 'writeFile',
                    error: ex
                };
            }
        }

        return {
            ok: true
        };
    }
}

module.exports = CopyTask;
