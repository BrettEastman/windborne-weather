#!/bin/bash

# Find all function directories and install dependencies
FUNCTIONS_DIR=".vercel/output/functions"

if [ ! -d "$FUNCTIONS_DIR" ]; then
  echo "No functions directory found"
  exit 0
fi

# Find all directories with .vc-config.json (these are function directories)
find "$FUNCTIONS_DIR" -name ".vc-config.json" -type f | while read -r vc_config; do
  FUNC_DIR=$(dirname "$vc_config")
  echo "Installing dependencies in $FUNC_DIR"
  
  if [ -f "$FUNC_DIR/package.json" ]; then
    cd "$FUNC_DIR"
    npm install
    cd - > /dev/null
  fi
done

echo "Dependency installation complete"

