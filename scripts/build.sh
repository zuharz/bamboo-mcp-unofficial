#!/bin/bash

# BambooHR MCP Server - Production Build Script
# Builds for NPM distribution using tsconfig.build.json

set -e

echo "🏗️  Building BambooHR MCP Server for production..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is required"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Clean previous build but preserve modern server/index.js
echo "🧹 Cleaning previous build (preserving modern server/index.js)..."
if [ -f "server/index.js" ]; then
    cp server/index.js /tmp/modern-server-backup.js
fi
rm -rf server/
mkdir -p server
if [ -f "/tmp/modern-server-backup.js" ]; then
    cp /tmp/modern-server-backup.js server/index.js
    rm /tmp/modern-server-backup.js
fi

# ⚡ FAIL FAST QUALITY ASSURANCE PIPELINE ⚡
echo "🔍 Starting comprehensive quality checks (fail fast mode)..."

# Stage 1: Security & Dependency Audit
echo "🛡️  Running security audit..."
if ! npm audit --audit-level=high; then
    echo "❌ Security vulnerabilities found! Fix with 'npm audit fix'"
    exit 1
fi
echo "✅ Security audit passed"

# Stage 2: Code Quality Checks
echo "🧹 Running code quality checks..."
if ! npm run quality --silent; then
    echo "❌ Code quality issues found!"
    echo "   Fix with: npm run lint:fix && npm run format"
    exit 1
fi
echo "✅ Code quality checks passed"

# Stage 3: Test Execution  
echo "🧪 Running test suite..."
if ! npm test --silent; then
    echo "❌ Tests failed! Review and fix failing tests"
    exit 1
fi
echo "✅ All tests passed"

# Stage 4: MCP Protocol Version Validation
echo "🔍 Validating MCP protocol version compatibility..."

# Check if we have the required MCP SDK version that supports latest protocol
REQUIRED_MCP_VERSION="1.17.0"
CURRENT_MCP_VERSION=$(node -p "require('./package.json').dependencies['@modelcontextprotocol/sdk'].replace(/[\^~]/, '')")

echo "   Current MCP SDK: $CURRENT_MCP_VERSION"
echo "   Required MCP SDK: $REQUIRED_MCP_VERSION+"

# Simple version comparison (assuming semantic versioning)
if [ "$(printf '%s\n' "$REQUIRED_MCP_VERSION" "$CURRENT_MCP_VERSION" | sort -V | head -n1)" = "$REQUIRED_MCP_VERSION" ]; then
    echo "✅ MCP SDK version supports latest protocol (2025-06-18)"
else
    echo "❌ MCP SDK version too old for latest protocol"
    echo "   Update with: npm install @modelcontextprotocol/sdk@latest"
    exit 1
fi

# Verify our server code doesn't explicitly set outdated protocol versions
echo "🔍 Checking for hardcoded protocol versions..."
if grep -r "2024-11-05\|2024-10-07\|2024-09-25" src/ --include="*.ts" --include="*.js" 2>/dev/null; then
    echo "❌ Found outdated protocol version references in source code"
    echo "   Remove hardcoded protocol versions - let SDK handle negotiation"
    exit 1
fi
echo "✅ No hardcoded outdated protocol versions found"

# Stage 5: TypeScript Compilation (Final Validation)
echo "🔧 Type checking and compilation..."
npx tsc --noEmit

echo "⚡ Compiling TypeScript for production..."
npx tsc --project tsconfig.build.json

# Preserve existing modern server/index.js (already compiled and modern)
echo "🔧 Preserving modern server implementation..."
if [ -f "server/index.js" ]; then
    echo "✅ Modern server/index.js preserved"
else
    echo "❌ ERROR: server/index.js not found - modern implementation missing"
    exit 1
fi

# Make main entry point executable
chmod +x server/index.js

# Verify build output
if [ ! -f "server/index.js" ]; then
    echo "❌ Build failed: server/index.js not created"
    exit 1
fi

# 🔍 DXT Validation for Quality Assurance
echo "🔍 Running DXT validation for quality assurance..."

# Check if DXT CLI is available, install if needed
if ! command -v dxt &> /dev/null; then
    echo "📦 Installing DXT CLI for validation..."
    npm install -g @anthropic-ai/dxt
    if ! command -v dxt &> /dev/null; then
        echo "⚠️  Warning: Could not install DXT CLI - skipping validation"
        echo "   This is non-critical for NPM builds but recommended for quality assurance"
    else
        echo "✅ DXT CLI installed successfully"
    fi
fi

# Strict DXT validation (required for quality assurance)
if command -v dxt &> /dev/null; then
    echo "🔍 Running strict DXT validation..."
    
    # First validate manifest
    DXT_VALIDATE_OUTPUT=$(dxt validate manifest.json 2>&1)
    DXT_VALIDATE_EXIT_CODE=$?
    
    echo "📋 DXT Manifest Validation:"
    echo "$DXT_VALIDATE_OUTPUT"
    
    if [ $DXT_VALIDATE_EXIT_CODE -ne 0 ]; then
        echo "❌ DXT manifest validation failed"
        echo "🚫 BUILD FAILED - Fix manifest errors"
        exit 1
    fi
    
    # Check for actual DXT warnings/errors (be more specific)
    if echo "$DXT_VALIDATE_OUTPUT" | grep -E "(ERROR|WARNING|WARN|Failed|Invalid|Error):"; then
        echo "❌ DXT manifest validation contains warnings/errors"
        echo "🚫 BUILD FAILED - All DXT warnings must be resolved"
        exit 1
    fi
    
    # Then test actual package creation
    echo "🔍 Testing DXT package creation..."
    TEMP_DIR=$(mktemp -d)
    cp -r . "$TEMP_DIR/"
    cd "$TEMP_DIR"
    rm -f *.dxt
    
    DXT_PACK_OUTPUT=$(dxt pack 2>&1)
    DXT_PACK_EXIT_CODE=$?
    
    echo "📋 DXT Pack Output:"
    echo "$DXT_PACK_OUTPUT"
    
    if [ $DXT_PACK_EXIT_CODE -ne 0 ]; then
        echo "❌ DXT package creation failed"
        echo "🚫 BUILD FAILED - Cannot create valid DXT package"
        cd - > /dev/null
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    
    # Check for actual DXT packaging warnings/errors
    if echo "$DXT_PACK_OUTPUT" | grep -E "(ERROR|WARNING|WARN|Failed|Invalid|Error):"; then
        echo "❌ DXT package creation contains warnings"
        echo "🚫 BUILD FAILED - Resolve all DXT packaging warnings"
        cd - > /dev/null
        rm -rf "$TEMP_DIR"
        exit 1
    fi
    
    echo "✅ DXT validation passed (strict mode)"
    cd - > /dev/null
    rm -rf "$TEMP_DIR"
else
    echo "❌ DXT CLI not available - cannot validate DXT package"
    echo "   Install with: npm install -g @anthropic-ai/dxt"
    echo "🚫 BUILD FAILED - DXT validation is required"
    exit 1
fi

# Final Quality Gate Summary
echo ""
echo "=================================================================="
echo "✅ PRODUCTION BUILD COMPLETE with COMPREHENSIVE QUALITY ASSURANCE!"
echo ""
echo "🔍 Quality Gates Passed:"
echo "  ✅ Security audit (high-level vulnerabilities)"
echo "  ✅ Code quality (ESLint + Prettier + TypeScript)"
echo "  ✅ Test suite (all tests passing)"
echo "  ✅ MCP protocol validation (latest version 2025-06-18)"
echo "  ✅ DXT validation (manifest and structure)"
echo "  ✅ TypeScript compilation (production build)"
echo ""
echo "📋 Output:"
echo "  📄 server/index.js (main entry point)"
echo "  📄 server/*.js (compiled modules)"
echo ""
echo "🚀 Usage:"
echo "  export BAMBOO_API_KEY=your_api_key"
echo "  export BAMBOO_SUBDOMAIN=your_company" 
echo "  node server/index.js"
echo ""
echo "📦 NPX Usage:"
echo "  BAMBOO_API_KEY=xxx BAMBOO_SUBDOMAIN=yyy npx @zuharz/bamboo-mcp-server"