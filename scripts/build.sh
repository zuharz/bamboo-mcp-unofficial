#!/bin/bash

# Streamlined BambooHR MCP Build Script
# DXT-style minimal approach

set -e

echo "Building BambooHR MCP Server..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is required"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Type checking first
echo "Type checking..."
npx tsc --noEmit \
    --target ES2022 \
    --module CommonJS \
    --moduleResolution node \
    --allowSyntheticDefaultImports \
    --esModuleInterop \
    --skipLibCheck \
    --strict \
    src/*.ts

# Create dist directory
mkdir -p dist

echo "Compiling TypeScript..."

# Direct TypeScript compilation (DXT-style)
npx tsc src/bamboo-mcp.ts \
    --outDir dist \
    --target ES2022 \
    --module CommonJS \
    --moduleResolution node \
    --allowSyntheticDefaultImports \
    --esModuleInterop \
    --skipLibCheck \
    --strict \
    --declaration

# Make executable
chmod +x dist/bamboo-mcp.js

echo "Build complete!"
echo ""
echo "Usage:"
echo "  export BAMBOO_API_KEY=your_api_key"
echo "  export BAMBOO_SUBDOMAIN=your_company"
echo "  node dist/bamboo-mcp.js"