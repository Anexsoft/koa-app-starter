# koa-app-starter
CLI to start a nodejs web api or application

# Intro
This CLI will serve as a starting point to create a new web api or application based on Koa (https://koajs.com).

To use it, install the package globally
```
npm install -g @juntoz/koa-app-starter
```

And then you can call the command `koa-app-starter` from any folder.

To update to a new version, simply run the same command.

**Why this CLI?**
Because I need to create many APIs and I want them to share a single base design, dependencies, and configurations. However, doing it while creating a node package is not the best solution because customizing to the needs of a specific API would be very hard and not future-proof.

By providing a CLI to do so, we can have a shared base which we can adapt and yet update it in the future very easily, as long as the pattern is followed.

## Opinionated
This is definitely an opinionated starter based on my own experience and what I'm continuously learning about NodeJs.

# How to create a new app?

1. Create your project using `npm init` as usual. This will create the package.json for your project.

2. Type in `koa-app-starter`. This will start showing the needed questions for you to fill in, so the application can be created. The starter will automatically create the needed files to run the application and install the needed dependencies.

3. Once the CLI is finished, you just need to run it using `node src/index.js --port 3000`, and you have your new app running!.

4. The CLI will create an additional file called `.starterlast` which will contain the timestamp and version from which the application was created. This file is just as a trace. It is not used to run the application and you can certainly commit it or not as you see fit.

## Core vs App

The CLI will copy and minify those files that are core to the application, because we want to keep those files intact. If you want to modify the logic within those files, you should upgrade this starter, so this way all applications can benefit from that change.

Those files that are considered to be part of the application layer will not be minified, and you can certainly modify them at will.

# How to update my app with a new version?

Once you have your app running, and you want to upgrade to a new version of the starter, you should:

1. This CLI will **OVERWRITE** any file found, therefore the first step is to either commit all your changes to your local git or stash them.
2. The CLI will **add** new packages to `package.json` and **upgrade** those that were brought before to their latest version. The rest of `package.json` is left intact.
3. Once the CLI is finished, you should review the changes that were made:
    * Any core file should just be accepted as is (they are minified).
    * App files that were overwritten should be reviewed and merged. Do not make the mistake to just discard the incoming changes because you may be missing an important update on those files.

# Contribute

## To publish a new version of the CLI
Every time you make a change either to the core or to a template, you need to commit and also publish a new version to npm.

Steps:
- Update package.json to have the new version (e.g. 1.2.10 > 1.2.11)
- Run npm install. This will not upgrade any package but will replicate the new version into `package-lock.json` which should always match.
- Commit and push.
- Run `publish.bat` to upload to npm.

## Plugin
The `Plugin` class is the tool we have to extend the CLI which must have the following folder structure:
```
/koa-app-starter
|---/myplugin
|---|---/mysubfolder
|---|---|---mysubfile.js
|---|---myfile.js
|---|---plugin-cfg.yml
```
* A subfolder within the CLI
* A `plugin-cfg.yml` file that will instruct the CLI what to do in each step.
* [files] Any file that is in the folder (next to plugin-cfg.yml) will be copied maintaining the folder structure. So in the above example, the target application will contain

```
/myappfolder
|---/mysubfolder
|---|---mysubfile.js
|---myfile.js
|---package.json >> (that was created when the application was initialized)
```

Every plugin is an instance of the same process. The process has the following steps:
* Copy (and minify)
* Insert settings to application configuration (`default.yml`)
* Insert settings to configuration environmnent file (`custom-environment-variables.yml`)
* Add npm dependencies to target application

If one of the steps is deleted from the file, it will not execute except for the Copy step which will always be executed.

### plugin-cfg.yml
This file contains the configuration options that will tell the CLI how to execute the plugin. Below the complete settings with their default values.

Globs are processed with [fast-glob](https://www.npmjs.com/package/fast-glob).
```
copy:
  ignore: [] # array of glob paths to ignore when copying. Default ['!**/node_modules', '!**/package*.json', '!**/readme.txt', '!**/plugin-cfg.yml']
  minify:
    enabled: boolean # whether the minify is turned on or not. Default true.
    extensions: [] # list of extensions to minify. Default [.js].
    ignore: [] # array of glob paths to ignore when minifying. Default [].

npm:
  install: # yaml array of packages that need to be installed
  - mssql

configfile: # objects to add to the default.yml config file
  foo:
    bar: 1
    baz: 2
  waldo:
    found: 1
  qux: xyz

envfile: # objects to add to custom-environment-variables.yml config file
  foo:
    bar: FOO_BAR
  waldo:
    found: WALDO_FOUND
```

NOTE: to understand the difference between `configfile` and `envfile`, go to [node-config](https://www.npmjs.com/package/node-config).

A `Plugin` can be either a template or a partial.

A `Template` is the target application basis or boilerplate.

A `Partial` is a component that we can add to that application.

## Templates
A template is an application boilerplate, and as such, it has to be able to run as is.

A template must have a `package.json` on its own, and be able to run/debug without needing to be installed by the CLI. This `package.json` will contain also the needed dependencies required for the target application to run.

Try to not commit the `package-lock.json` for the template. This is very important otherwise it could break the target application (although is in the copy default ignore list, so it will never be copied).

## How to debug in VSCode?
In order to run either the CLI or the template, you can modify your `launch.json` to have two configurations like this:
```
{
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "CLI",
            "program": "${workspaceFolder}/index.js",
            "outputCapture": "std",
            "console": "externalTerminal"
        },
        {
            "type": "node",
            "request": "launch",
            "name": "KOA",
            "program": "${workspaceFolder}/template-koa/src/index.js",
            "args": ["--port", "3000"],
            "outputCapture": "std"
        }
    ]
}
```

The first configuration is for the CLI. `console: externalTerminal` means that it must run on an outside console because it requires user input (and VS Code Debug console does not support input).

The second configuration is to run the template application.

# Template: Koa
This template was designed to create an API based on Koa. It comes with many functionalities built in.

standard packages
* `koa-pino-logger` as logger
* `koa-bodyparser` to parse input body as json
* `koa-passport` to authenticate using jwt
* `koa-x-request-id` to mark each request with a unique id
* `node-config` for layered configuration

juntoz packages
* Health probe route (default is `/tools/probe`)
* Version route (default is `/tools/version`)

This template only supports `http` intentionally. This is because we want to force `https` to an external process (probably an API gateway).
