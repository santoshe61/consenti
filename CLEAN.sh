#!/bin/bash

while true; do
    read -p "Do you want to remove all node_modules, .next, dist ? (y/n): " yn
    case $yn in
        [Yy]* ) 
            echo "Proceeding with deletion..."
            break
            ;;
        [Nn]* ) 
            echo "Execution aborted by you."
            exit 1
            ;;
        * ) 
            echo "Please answer yes (y) or no (n)."
            ;;
    esac
done

# The rest of your script goes here
echo "Deleting all node_modules, .next, dist..."

# Root
rm -rf .next
rm -rf .turbo
rm -rf node_modules 
rm package-lock.json

echo "✅ Deleted from root now apps/api"

# API
rm -rf apps/api/.turbo
rm -rf apps/api/dist
rm -rf apps/api/node_modules

echo "✅ Deleted from apps/api now apps/ui"

# UI
rm -rf apps/ui/.turbo
rm -rf apps/ui/dist

echo "✅ Deleted from apps/ui now apps/docs"

# Docs
rm -rf apps/docs/.turbo
rm -rf apps/docs/.next
rm -rf apps/docs/out
rm apps/docs/tsconfig.tsbuildinfo

echo "✅ Deleted all node_modules, .next, dist..."