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

cd ../../
echo "Cloning Release Repo..."
git clone git@github.com:AndiMajore/drugstone-releases.git
echo "Updating Repo..."

echo "Building release..."
cd frontend || exit
npm run build:netex
cd ../
cp frontend/drugsTone-build/* drugstone-releases/releases/

echo "Building dev..."
cd frontend || exit
npm run build:netex-dev
cd ../
cp frontend/drugsTone-build/* drugstone-releases/dev/

echo "Building remote..."
cd frontend || exit
npm run build:netex-remote
cd ../
cp frontend/drugsTone-build/* drugstone-releases/remote/


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
