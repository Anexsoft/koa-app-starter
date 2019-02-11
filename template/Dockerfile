FROM node:11.4-alpine AS builder

# copy all content
COPY . .

# create the dist folder
RUN dos2unix create-dist.sh && chmod +x create-dist.sh && ./create-dist.sh

# install all dependencies
WORKDIR /dist
RUN npm install --prod

FROM builder as run

COPY --from=builder /dist ./

# allow custom params on execution
# ENV variables: API_PORT, LOG_LEVEL
ENTRYPOINT node "koa-index.js" "--port" ${API_PORT} "--loglevel" ${LOG_LEVEL}

# expose needed port
EXPOSE ${API_PORT}

# set node to run in production mode
ENV NODE_ENV=production
