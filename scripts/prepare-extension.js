/**
 * Extension Preparation Script
 * 
 * This script helps prepare the getBPay application to be packaged as a browser extension.
 * It:
 * 1. Generates a manifest.json file
 * 2. Creates necessary background and content scripts
 * 3. Ensures icons are available in the public directory
 */

import fs from 'fs';
import path from 'path';
import { generateManifestJson, createBackgroundScript, createContentScript } from '../client/src/utils/extensionHelper.js';

// Configuration
const EXTENSION_OUTPUT_DIR = 'dist/extension';
const PUBLIC_DIR = 'client/public';
const ICONS_DIR = `${PUBLIC_DIR}/icons`;

// Ensure directories exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Write file helper
function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content);
  console.log(`Created file: ${filePath}`);
}

// Main function
async function prepareExtension() {
  console.log('Preparing getBPay browser extension...');
  
  // Create output directory
  ensureDirectoryExists(EXTENSION_OUTPUT_DIR);
  
  // Generate and write manifest.json
  const manifest = generateManifestJson();
  writeFile(
    path.join(EXTENSION_OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  // Create background script
  const backgroundScript = createBackgroundScript();
  writeFile(
    path.join(EXTENSION_OUTPUT_DIR, 'background.js'),
    backgroundScript
  );
  
  // Create content script
  const contentScript = createContentScript();
  writeFile(
    path.join(EXTENSION_OUTPUT_DIR, 'contentScript.js'),
    contentScript
  );
  
  // Create icons directory
  ensureDirectoryExists(path.join(EXTENSION_OUTPUT_DIR, 'icons'));
  
  // Copy icons if they exist or create placeholders
  const iconSizes = [16, 32, 48, 128];
  for (const size of iconSizes) {
    const sourceIconPath = path.join(ICONS_DIR, `icon${size}.png`);
    const destIconPath = path.join(EXTENSION_OUTPUT_DIR, 'icons', `icon${size}.png`);
    
    if (fs.existsSync(sourceIconPath)) {
      fs.copyFileSync(sourceIconPath, destIconPath);
      console.log(`Copied icon: ${sourceIconPath} -> ${destIconPath}`);
    } else {
      console.warn(`Warning: Icon ${sourceIconPath} not found. Extension will need icons.`);
    }
  }
  
  console.log('\nExtension preparation complete! 🎉');
  console.log(`Files are ready in: ${EXTENSION_OUTPUT_DIR}`);
  console.log('\nNext steps:');
  console.log('1. Run the build process (npm run build)');
  console.log('2. Copy the built files to the extension directory');
  console.log('3. Load the unpacked extension in your browser');
}

// Run the main function
prepareExtension().catch(error => {
  console.error('Error preparing extension:', error);
  process.exit(1);
});