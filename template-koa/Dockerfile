FROM node:11.4-alpine AS builder

# set node to run in production mode
ENV NODE_ENV=production

# copy all content (except those in .dockerignore)
COPY . /app
WORKDIR /app

# install all dependencies
RUN npm install

FROM builder as run

# install pino-papertrail
RUN npm install pino-papertrail

COPY --from=builder /app /app

# expose needed port
EXPOSE ${API_PORT}

# ENV variables: API_PORT, LOG_LEVEL, RUN_ENV
ENTRYPOINT node "/app/src/index.js" --port ${API_PORT} --loglevel ${LOG_LEVEL} --env ${RUN_ENV} \
    | node "/app/node_modules/pino-papertrail/cli.js" --host <ppt>.papertrailapp.com --port <pptport> --appname <applicationName>-${RUN_ENV} --connection tcp
