#!/bin/bash

# BambooHR MCP Server Setup Validation Script
# Validates all components for foolproof setup

set -e

echo "Validating BambooHR MCP Server setup..."

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is required but not found"
    exit 1
fi
echo "✓ Node.js found: $(node --version)"

# 2. Check required files
if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found"
    exit 1
fi
echo "✓ package.json found"

if [ ! -f "src/bamboo-mcp.ts" ]; then
    echo "ERROR: src/bamboo-mcp.ts not found"
    exit 1
fi
echo "✓ Source file found"

# 3. Check package.json structure
if ! grep -q "@modelcontextprotocol/sdk" package.json; then
    echo "ERROR: MCP SDK not in package.json dependencies"
    exit 1
fi
echo "✓ MCP SDK dependency present"

# 4. Install and verify dependencies
echo "Installing dependencies..."
npm install --silent

if [ ! -d "node_modules/@modelcontextprotocol" ]; then
    echo "ERROR: MCP SDK not properly installed"
    exit 1
fi
echo "✓ Dependencies installed"

# 5. Test compilation
echo "Testing compilation..."
if ! npx tsc src/bamboo-mcp.ts --outDir dist --target ES2022 --module ESNext --moduleResolution node --allowSyntheticDefaultImports --esModuleInterop --skipLibCheck --noEmit; then
    echo "ERROR: TypeScript compilation failed"
    exit 1
fi
echo "✓ TypeScript compilation successful"

# 6. Build the project
echo "Building project..."
if ! ./scripts/build.sh > /dev/null 2>&1; then
    echo "ERROR: Build failed"
    exit 1
fi
echo "✓ Build successful"

# 7. Check built file
if [ ! -f "dist/bamboo-mcp.js" ]; then
    echo "ERROR: Built file not found"
    exit 1
fi
echo "✓ Built file exists"

# 8. Check environment variables
if [ -z "$BAMBOO_API_KEY" ] || [ -z "$BAMBOO_SUBDOMAIN" ]; then
    echo "WARNING: Environment variables not set:"
    echo "  export BAMBOO_API_KEY=your_api_key"
    echo "  export BAMBOO_SUBDOMAIN=your_company"
else
    echo "✓ Environment variables configured"
fi

echo ""
echo "Setup validation completed successfully!"
echo ""
echo "To use the server:"
echo "1. Set environment variables if not already set:"
echo "   export BAMBOO_API_KEY=your_api_key"
echo "   export BAMBOO_SUBDOMAIN=your_company"
echo ""
echo "2. Run the server:"
echo "   node dist/bamboo-mcp.js"
echo ""
echo "3. Or add to Claude Desktop config:"
echo '   "bamboohr": {'
echo '     "command": "node",'
echo '     "args": ["'$(pwd)'/dist/bamboo-mcp.js"],'
echo '     "env": {'
echo '       "BAMBOO_API_KEY": "your_api_key",'
echo '       "BAMBOO_SUBDOMAIN": "your_company"'
echo '     }'
echo '   }'