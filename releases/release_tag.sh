#!/bin/bash


if [ -z "$1" ]
then
  echo "Please enter a version"
  exit
fi

if [ -z "$2" ]
then
  echo "Please enter a version message"
  exit
fi

VERSION=v$1
MESSAGE=$2

cd ../
if [ -z "$3" ]
then
  echo "Building..."
  npm run build:netex
else
  echo "Building dev..."
  npm run build:netex-dev
  VERSION=$VERSION
fi

cd ../
echo "Cloning Release Repo..."
git clone git@github.com:AndiMajore/drugstone-releases.git
echo "Updating Repo..."
if [ -z "$3" ]
then
  cp frontend/drugsTone-build/* drugstone-releases/releases/
else
  cp frontend/drugsTone-build/* drugstone-releases/dev/
fi
cd drugstone-releases || echo "Error!" exit
git commit -am "$VERSION commit: $MESSAGE"
git push
echo "Tagging Version..."
git tag -a "$VERSION" -m "$MESSAGE"
echo "Releasing Version..."
git push origin "$VERSION"
echo "Clean up..."
cd ../
rm -rf drugstone-releases
echo "Done!"
