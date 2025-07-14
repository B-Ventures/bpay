/**
 * Build Extension Script
 * 
 * This script prepares the getBPay browser extension for distribution by:
 * 1. Creating the output directory structure
 * 2. Copying all extension files to the output directory
 * 3. Generating placeholder icons if needed
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const EXTENSION_SRC_DIR = path.join(__dirname, '..', 'client', 'public', 'extension');
const EXTENSION_OUTPUT_DIR = path.join(__dirname, '..', 'dist', 'extension');
const ICONS_DIR = path.join(__dirname, '..', 'client', 'public', 'icons');

// Ensure directories exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Copy file helper
function copyFile(srcPath, destPath) {
  fs.copyFileSync(srcPath, destPath);
  console.log(`Copied file: ${srcPath} -> ${destPath}`);
}

// Generate placeholder icon
function generatePlaceholderIcon(filePath, size) {
  // This is a very simple placeholder icon generator
  const canvas = new Uint8Array(size * size * 4);
  
  // Fill with blue color (#3B82F6)
  for (let i = 0; i < canvas.length; i += 4) {
    canvas[i] = 59;     // R
    canvas[i + 1] = 130; // G
    canvas[i + 2] = 246; // B
    canvas[i + 3] = 255; // A
  }
  
  // Create a PNG file (this is a minimal implementation)
  const header = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    // IHDR chunk
    0x00, 0x00, 0x00, 0x0D, // length of IHDR chunk
    0x49, 0x48, 0x44, 0x52, // "IHDR"
    0x00, 0x00, 0x00, size >> 8, size & 0xFF, // width
    0x00, 0x00, 0x00, size >> 8, size & 0xFF, // height
    0x08, // bit depth
    0x06, // color type (RGBA)
    0x00, // compression method
    0x00, // filter method
    0x00, // interlace method
    // CRC for IHDR chunk (precalculated)
    0x00, 0x00, 0x00, 0x00,
  ]);
  
  fs.writeFileSync(filePath, header);
  console.log(`Created placeholder icon: ${filePath}`);
}

// Main function
async function buildExtension() {
  console.log('Building getBPay browser extension...');
  
  // Create output directory
  ensureDirectoryExists(EXTENSION_OUTPUT_DIR);
  
  // Create icons directory
  const iconsOutputDir = path.join(EXTENSION_OUTPUT_DIR, 'icons');
  ensureDirectoryExists(iconsOutputDir);
  
  // Copy all extension files to the output directory
  const extensionFiles = fs.readdirSync(EXTENSION_SRC_DIR);
  for (const file of extensionFiles) {
    const srcPath = path.join(EXTENSION_SRC_DIR, file);
    const destPath = path.join(EXTENSION_OUTPUT_DIR, file);
    
    if (fs.statSync(srcPath).isFile()) {
      copyFile(srcPath, destPath);
    }
  }
  
  // Copy icons if they exist or create placeholders
  const iconSizes = [16, 32, 48, 128];
  for (const size of iconSizes) {
    const sourceIconPath = path.join(ICONS_DIR, `icon${size}.png`);
    const destIconPath = path.join(iconsOutputDir, `icon${size}.png`);
    
    if (fs.existsSync(sourceIconPath)) {
      copyFile(sourceIconPath, destIconPath);
    } else {
      console.warn(`Warning: Icon ${sourceIconPath} not found. Creating a placeholder.`);
      generatePlaceholderIcon(destIconPath, size);
    }
  }
  
  console.log('\nExtension build complete! 🎉');
  console.log(`Files are ready in: ${EXTENSION_OUTPUT_DIR}`);
  console.log('\nNext steps:');
  console.log('1. Open Chrome and go to chrome://extensions/');
  console.log('2. Enable "Developer mode"');
  console.log('3. Click "Load unpacked" and select the extension directory');
}

// Run the main function
buildExtension().catch(error => {
  console.error('Error building extension:', error);
  process.exit(1);
});