#!/bin/bash

if [ -z "$1" ]
then
  echo "Please enter a version"
  exit
fi

VERSION=v$1

echo "Deleting Release Version..."
git push --delete origin "$VERSION"
echo "Done!"
