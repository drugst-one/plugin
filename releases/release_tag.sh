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

echo "Adjusting package.json version"
npm version "$1"
git push
echo "Tagging Version..."
git tag -a "$VERSION" -m "$MESSAGE"
echo "Releasing Version..."
git push origin "$VERSION"

echo "Done!"
