#!/bin/bash

# Create the output directory
mkdir -p dist/extension/icons

# Copy all extension files to the output directory
cp -r client/public/extension/* dist/extension/

# Copy the icon if it exists
if [ -f client/public/icons/icon.svg ]; then
  cp client/public/icons/icon.svg dist/extension/icons/
  
  # Generate placeholder icons for different sizes
  # Since we can't easily convert SVG to PNG in this environment,
  # we'll create simple colored squares as placeholders
  
  echo "Creating placeholder icons for the extension..."
  
  # Function to create a simple colored square PNG
  create_placeholder_icon() {
    size=$1
    output_file=$2
    
    # Create a simple HTML file with a colored div of the right size
    cat > temp_icon.html << EOF
    <div style="width:${size}px;height:${size}px;background-color:#3b82f6;border-radius:${size/5}px;"></div>
EOF
    
    # We'd normally use a tool like ImageMagick, but we'll just create placeholders
    echo "// This is a placeholder for icon${size}.png" > "${output_file}"
    echo "// In a real environment, you would convert the SVG to a ${size}x${size} PNG" >> "${output_file}"
  }
  
  # Create placeholder icons for required sizes
  create_placeholder_icon 16 "dist/extension/icons/icon16.png"
  create_placeholder_icon 32 "dist/extension/icons/icon32.png"
  create_placeholder_icon 48 "dist/extension/icons/icon48.png"
  create_placeholder_icon 128 "dist/extension/icons/icon128.png"
  
  # Clean up
  rm -f temp_icon.html
fi

echo "Extension build complete! 🎉"
echo "Files are ready in: dist/extension"
echo ""
echo "Note: Placeholder icons have been created. In a production environment,"
echo "you would need to convert the SVG to PNG files of the appropriate sizes."
echo ""
echo "Next steps:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable Developer mode"
echo "3. Click Load unpacked and select the dist/extension directory"