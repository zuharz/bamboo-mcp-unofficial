#!/bin/bash

# Ultra-Simple BambooHR MCP Build Script
# No dependencies beyond MCP SDK

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

# Install test dependencies if running tests
if [ "$1" = "--with-tests" ]; then
    echo "Installing test dependencies..."
    npm install --save-dev jest@^29.7.0 ts-jest@^29.2.4 @types/jest@^29.5.12
fi

# Run linting
echo "Running ESLint..."
npm run lint

# Type checking
echo "Type checking..."
npm run typecheck

# Create dist directory
mkdir -p dist

echo "Compiling..."

# Use tsconfig.json for compilation
npx tsc --project config/tsconfig.json

# Make executable
chmod +x dist/bamboo-mcp.js

# Validate compiled output doesn't have problematic import paths
echo "Validating build output..."
if grep -q "require.*\.js'" dist/bamboo-mcp.js; then
    echo "WARNING: Found .js extensions in require statements - this may cause issues in extension runtime"
fi

echo "Build complete!"
echo ""
echo "Usage:"
echo "  export BAMBOO_API_KEY=your_api_key"
echo "  export BAMBOO_SUBDOMAIN=your_company"
echo "  node dist/bamboo-mcp.js"