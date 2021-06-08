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

echo "Building..."
cd ../
npm run build:netex
cd ../
echo "Cloning Release Repo..."
git clone git@github.com:AndiMajore/drugstone-releases.git
echo "Updating Repo..."
cp frontend/drugsTone-build/* drugstone-releases/releases/
echo "Tagging Version..."
cd drugstone-releases || echo "Error!" exit
git tag -a "$VERSION" -m "$MESSAGE"
echo "Releasing Version..."
git push origin "$VERSION"
echo "Clean up..."
cd ../
rm -rf drugstone-releases
echo "Done!"
