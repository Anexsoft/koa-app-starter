#!/bin/sh

# clear and create dist folder
rm -r -f dist && mkdir -p dist

# copy npm package info
cp package.json dist
cp package-lock.json dist

# copy app files
cp -r -v ./src/cert dist/cert
cp -r -v ./src/*.js dist
