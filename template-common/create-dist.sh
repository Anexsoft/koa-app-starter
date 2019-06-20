#!/bin/sh

# clear and create dist folder
rm -r -f dist && mkdir -p dist

# copy npm package info
cp package.json dist
cp package-lock.json dist

# copy app files to the dist root so they represent a regular application with its package.json file
cp -r -v ./src/* dist
