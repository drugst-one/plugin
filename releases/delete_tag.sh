#!/bin/bash

if [ -z "$1" ]
then
  echo "Please enter a version"
  exit
fi

VERSION=v$1

cd ../../
echo "Cloning Release Repo..."
git clone git@github.com:AndiMajore/drugstone-releases.git
echo "Deleting Release Version..."
cd drugstone-releases || echo "Error!" exit
git push --delete origin "$VERSION"
echo "Clean up..."
cd ../
rm -rf drugstone-releases
echo "Done!"
