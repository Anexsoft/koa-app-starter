# koa-app-starter
CLI to start a nodejs web api or application

## Intro
This CLI will serve as a starting point to create a new web api or application based on Koa (https://koajs.com).

**Why Koa?**
Because it is a middleware based on async/await pattern which is much easier to maintain and understand than Express (or so they say :))

**Why this CLI?**
Because I need to create many APIs and I want them to share a single base design, dependencies, and configurations. However, doing it while creating a node package is not the best solution because customizing to the needs of a specific API would be very hard and not future-proof.

By providing a CLI to do so, we can have a shared base which we can adapt and yet update it in the future very easily, as long as the pattern is followed.

## Opinionated
This is definitely an opinionated starter based on my own experience and what I'm continuously learning about NodeJs.

## How to use it?

1. Create your project using `npm init` as usual. This will create the package.json for your project.

2. Add the package to your project
```
npm install @juntos/koa-app-starter
```

3. Go to where your project's package.json file is (root folder).

4. And type in `koa-app-starter`

(if it does not work, type in `node node_modules/@juntoz/koa-app-starter/index.js init`)

5. The CLI will detect if the folder already exists or not

6. The last step is to read the template package.json and do an `npm install` of each package into your project package.json. This ensures that you download the latest version of each library.

7. Do a `node src/koa-index.js --port 3000`, and you have your new app running!

## "Two projects" = Two package.json
Note that the root package.json is for the cli.

There is a folder called template which is the starter template and has its own package.json.

In order to run either of the two from VS Code, you need to define like this:
```
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "name": "Launch Main",
            "program": "${workspaceFolder}/index.js",
            "args": ["init"],
            "outputCapture": "std",
            "console": "externalTerminal"
        },
        {
            "type": "node",
            "request": "launch",
            "name": "Launch Template",
            "program": "${workspaceFolder}/template/src/koa-index.js",
            "args": ["--port", "3010"],
            "outputCapture": "std"
        }
    ]
}
```

The first node/launch is for the CLI, and the second is to run the template koa application.

The CLI needs to run on an outside console because it requires user input (and VS Code Debug console does not support input).

## How to modify the template folder?
You should treat as if it were a separate application (it has its own package.json, and you can certainly update it with npm install xxx, and so on).

## Feedback
All feedback and contributions are welcome
