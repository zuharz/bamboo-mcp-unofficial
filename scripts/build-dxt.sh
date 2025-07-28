#!/bin/bash

# Build Desktop Extension (.dxt) for BambooHR MCP Server
# Creates a one-click installable package for HR users

set -e

echo "Building BambooHR MCP Desktop Extension (.dxt)..."

# Check if DXT toolchain is available
if ! command -v dxt &> /dev/null; then
    echo "DXT toolchain not found. Installing..."
    if command -v npm &> /dev/null; then
        npm install -g @anthropic-ai/dxt
    else
        echo "ERROR: npm is required to install DXT toolchain"
        echo "Please install Node.js first: https://nodejs.org"
        exit 1
    fi
fi

echo "✓ DXT toolchain found"

# Build the MCP server first
echo "Building MCP server..."
./scripts/build.sh

# Verify required files exist
REQUIRED_FILES=(
    "dist/bamboo-mcp.js"
    "package.json"
    "manifest.json"
    "README.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "ERROR: Required file missing: $file"
        exit 1
    fi
done

echo "✓ All required files present"

# Create temporary DXT build directory
DXT_BUILD_DIR="dxt-build"
rm -rf "$DXT_BUILD_DIR"
mkdir -p "$DXT_BUILD_DIR"

echo "Preparing DXT package..."

# Copy server files maintaining directory structure
mkdir -p "$DXT_BUILD_DIR/dist"
cp dist/*.js "$DXT_BUILD_DIR/dist/"
cp manifest.json "$DXT_BUILD_DIR/"
cp README.md "$DXT_BUILD_DIR/"

# Create a clean package.json without dev scripts that could cause issues
cat > "$DXT_BUILD_DIR/package.json" << 'EOF'
{
  "name": "bamboo-mcp-server",
  "version": "1.0.0",
  "description": "Unofficial open source Model Context Protocol (MCP) server for BambooHR API integration with Claude Desktop",
  "author": "BambooHR MCP Contributors",
  "license": "MIT",
  "main": "dist/bamboo-mcp.js",
  "types": "dist/bamboo-mcp.d.ts",
  "bin": {
    "bamboo-mcp": "dist/bamboo-mcp.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.16.0",
    "@types/node": "^22.0.0",
    "typescript": "^5.5.0"
  }
}
EOF

# Copy documentation for users
cp docs/how-to-guides/hr-setup-guide.md "$DXT_BUILD_DIR/SETUP_GUIDE.md"

# Install production dependencies only (don't copy from parent)
echo "Installing production dependencies..."
cd "$DXT_BUILD_DIR"
npm install --production --omit=dev

# Verify MCP SDK was installed
if [ ! -d "node_modules/@modelcontextprotocol/sdk" ]; then
    echo "ERROR: MCP SDK not installed"
    exit 1
fi
echo "✓ MCP SDK dependency installed"
cd ..

# Create a simple icon placeholder if none exists
if [ ! -f "icon.png" ]; then
    echo "Creating placeholder icon..."
    # Create a simple 64x64 placeholder icon
    # Note: In a real implementation, you'd want a proper BambooHR/HR-themed icon
    cat > "$DXT_BUILD_DIR/icon.png" << 'EOF'
# This would be a binary PNG file in real implementation
# For now, this is a placeholder
EOF
else
    cp icon.png "$DXT_BUILD_DIR/"
fi

# Build the .dxt package
echo "Packaging Desktop Extension..."

cd "$DXT_BUILD_DIR"

# Use DXT toolchain to create the package
if command -v dxt &> /dev/null; then
    # Try different DXT command syntax
    if dxt pack ../bamboohr-mcp.dxt 2>/dev/null; then
        echo "✓ Created using dxt pack"
    elif dxt build ../bamboohr-mcp.dxt 2>/dev/null; then
        echo "✓ Created using dxt build"
    else
        echo "DXT command failed, using manual zip..."
        zip -r ../bamboohr-mcp.dxt ./*
    fi
else
    # Fallback: create zip file manually (DXT files are zip files)
    echo "Creating .dxt package manually..."
    zip -r ../bamboohr-mcp.dxt ./*
fi

cd ..

# Clean up build directory
rm -rf "$DXT_BUILD_DIR"

if [ -f "bamboohr-mcp.dxt" ]; then
    echo "✓ Desktop Extension built successfully: bamboohr-mcp.dxt"
    echo ""
    echo "Installation for HR users:"
    echo "1. Download bamboohr-mcp.dxt"
    echo "2. Double-click to install in Claude Desktop"
    echo "3. Enter BambooHR API key and subdomain when prompted"
    echo "4. Start using BambooHR tools in Claude Desktop!"
    echo ""
    echo "Package size: $(du -h bamboohr-mcp.dxt | cut -f1)"
else
    echo "ERROR: Failed to create .dxt package"
    exit 1
fi

echo ""
echo "Next steps for distribution:"
echo "• Upload bamboohr-mcp.dxt to your company's internal resources"
echo "• Share installation instructions with HR team"