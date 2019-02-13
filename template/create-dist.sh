#!/bin/sh

# clear and create dist folder
rm -r -f dist && mkdir -p dist

# copy npm package info
cp package.json dist
cp package-lock.json dist

# copy app files
cp ./src/koa-*.js dist
cp -r ./src/common dist/common
cp -r ./src/passport dist/passport
cp -r ./src/api dist/api
