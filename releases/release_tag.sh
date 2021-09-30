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

echo "Committing all changes"
git commit -am "$MESSAGE"
echo "Tagging Version..."
npm version "$1" -m "$MESSAGE"
git push
echo "Releasing Version..."
git push origin "$VERSION"

echo "Done!"
