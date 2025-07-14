#!/bin/bash

# Build Extension Script
# This script builds the application and packages it as a browser extension

# Set variables
DIST_DIR="dist"
EXTENSION_DIR="$DIST_DIR/extension"
WEB_BUILD_DIR="$DIST_DIR/web"

# Create necessary directories
mkdir -p $EXTENSION_DIR
mkdir -p $WEB_BUILD_DIR

echo "🔨 Building getBPay extension..."

# Run extension preparation script (will create manifest.json and other extension files)
echo "📦 Preparing extension files..."
node scripts/prepare-extension.js

# Check if preparation was successful
if [ $? -ne 0 ]; then
  echo "❌ Extension preparation failed"
  exit 1
fi

# Build the web application
echo "🏗️ Building web application..."
npm run build

# Copy the built files to the extension directory
echo "📋 Copying web build to extension directory..."
cp -r $WEB_BUILD_DIR/* $EXTENSION_DIR/

# Create icons directory if it doesn't exist
mkdir -p $EXTENSION_DIR/icons

# If no icons exist, create placeholders with simple text
if [ ! -f "$EXTENSION_DIR/icons/icon128.png" ]; then
  echo "⚠️ No icons found, creating placeholders..."
  echo "Please replace these with real icons before publishing"
fi

echo "✅ Extension build complete!"
echo "📂 Your extension files are in: $EXTENSION_DIR"
echo ""
echo "To load the extension in Chrome:"
echo "1. Go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked'"
echo "4. Select the '$EXTENSION_DIR' directory"
echo ""