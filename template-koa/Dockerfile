FROM node:11.4-alpine AS builder

# set node to run in production mode
ENV NODE_ENV=production

WORKDIR /app

# copy package.json
COPY package*.json ./

# install all dependencies
RUN npm ci
RUN npm install pino-papertrail

# copy the rest of files
COPY . .

# expose needed port
EXPOSE ${API_PORT}

# ENV variables: API_PORT, LOG_LEVEL, RUN_ENV
ENTRYPOINT node "/app/src/index.js" --port ${API_PORT} --loglevel ${LOG_LEVEL} --env ${RUN_ENV} \
    | node "/app/node_modules/pino-papertrail/cli.js" --host <ppt>.papertrailapp.com --port <pptport> --appname <applicationName>-${RUN_ENV} --connection tcp
