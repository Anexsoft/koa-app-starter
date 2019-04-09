#!/bin/sh

# clear and create dist folder
rm -r -f dist && mkdir -p dist

# copy npm package info
cp package.json dist
cp package-lock.json dist

# copy app files
cp -r -v ./src/koa-*.js dist
cp -r -v ./src/common dist/common
cp -r -v ./src/passport dist/passport
cp -r -v ./src/api dist/api
cp -r -v ./src/cert dist/cert
