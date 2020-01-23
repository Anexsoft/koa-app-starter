FROM node:11.4-alpine AS builder

# set node to run in production mode
ENV NODE_ENV=production

# copy all content (except those in .dockerignore)
COPY . /app
WORKDIR /app

# install all dependencies
RUN npm install

FROM builder as run

# install pino-papertrail globally so it can be accessed when piping
RUN npm install -g pino-papertrail

# NOTE: it seems that node program only works at root. TODO: This needs to be fixed to make it more robust
COPY --from=builder /app /app

# expose needed port
EXPOSE ${API_PORT}

# ENV variables: API_PORT, LOG_LEVEL, RUN_ENV
ENTRYPOINT node /app/src/index.js --port ${API_PORT} --loglevel ${LOG_LEVEL} --env ${RUN_ENV}
    # | pino-papertrail --host ppthost --port pptport --appname myappname-${RUN_ENV} --connection tcp
