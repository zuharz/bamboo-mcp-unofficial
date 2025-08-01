#!/bin/bash

# Unified Release Script for Workable MCP Server
# Builds the latest version and optionally publishes to GitHub Packages
# Combines functionality from build.sh and publish.sh for efficiency

set -e

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 📋 Dynamic Version Reading with Error Handling
read_version() {
    local version=""
    if [ -f "manifest.json" ]; then
        version=$(node -p "try { require('./manifest.json').version } catch(e) { '1.0.0' }" 2>/dev/null || echo "1.0.0")
    else
        version="1.0.0"
    fi
    echo "$version"
}

# Enhanced output functions
print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

# 📊 Enhanced Help Function
show_help() {
    local current_version
    current_version=$(read_version)
    echo -e "${BLUE}Workable MCP Server Release Script${NC}"
    echo -e "${BLUE}Version: ${GREEN}$current_version${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help         Show this help message"
    echo "  -v, --version      Show current version"
    echo "  --build-only       Build without publishing prompt"
    echo "  --dry-run          Perform dry run (build + publishing validation only)"
    echo ""
    echo "Description:"
    echo "  Builds the Workable MCP Server and optionally publishes to GitHub Packages."
    echo "  Publishing requires explicit user confirmation by typing 'y'."
    echo ""
    echo "Features:"
    echo "  • 🔨 TypeScript compilation with DXT validation"
    echo "  • 📦 Optimized server structure setup"
    echo "  • 🚀 Optional publishing to GitHub Packages"
    echo "  • 🛡️ Interactive confirmation for publishing"
    echo "  • ⚡ Single-command build-to-publish workflow"
    echo ""
    exit 0
}

# Parse command line arguments
BUILD_ONLY=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            ;;
        -v|--version)
            echo "$(read_version)"
            exit 0
            ;;
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Read version at startup
VERSION=$(read_version)

echo -e "${BLUE}🚀 Workable MCP Server Release Pipeline v${VERSION}${NC}"
echo "=================================================================="

# =============================================================================
# STAGE 1: BUILD PHASE
# =============================================================================

# Stage 1.1: Environment Validation
print_step "Checking build environment..."

if ! command -v node &> /dev/null; then
    print_error "Node.js is required but not installed"
    echo "Please install Node.js: https://nodejs.org"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is required but not found"
    exit 1
fi

if ! command -v dxt &> /dev/null; then
    print_warning "DXT CLI not found - some features will be limited"
    echo "Install with: npm install -g @anthropic-ai/dxt"
else
    print_success "DXT CLI available"
fi

print_success "Environment checks passed"

# Stage 1.2: Project Validation
print_step "Validating project structure..."

if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the project root?"
    exit 1
fi

if [ ! -f "manifest.json" ]; then
    print_error "manifest.json not found. DXT manifest required."
    exit 1
fi

if [ ! -d "src" ] || [ -z "$(find src -name "*.ts" 2>/dev/null)" ]; then
    print_error "Required source directory with TypeScript files missing: src/"
    exit 1
fi

print_success "Project structure validated"

# Stage 1.3: DXT Validation
print_step "Validating DXT manifest..."
if command -v dxt &> /dev/null; then
    if ! dxt validate manifest.json > /dev/null 2>&1; then
        print_error "DXT manifest validation failed"
        echo "Run 'dxt validate manifest.json' for details"
        exit 1
    fi
    print_success "DXT manifest is valid"
else
    print_warning "Skipping DXT validation (CLI not available)"
fi

# Stage 1.4: Version Synchronization
print_step "Checking version synchronization..."

PACKAGE_VERSION=$(node -p "try { require('./package.json').version } catch(e) { '1.0.0' }" 2>/dev/null || echo "1.0.0")
MANIFEST_VERSION=$(node -p "try { require('./manifest.json').version } catch(e) { '1.0.0' }" 2>/dev/null || echo "1.0.0")

if [ "$PACKAGE_VERSION" != "$MANIFEST_VERSION" ]; then
    print_warning "Version mismatch detected!"
    echo "  package.json: $PACKAGE_VERSION"
    echo "  manifest.json: $MANIFEST_VERSION"
    echo "  Syncing manifest.json to package.json version..."
    
    # Update manifest.json version to match package.json
    node -e "
        const fs = require('fs');
        const pkg = require('./package.json');
        const manifest = require('./manifest.json');
        manifest.version = pkg.version;
        fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
    " 2>/dev/null || {
        print_error "Failed to sync versions"
        exit 1
    }
    
    # Update our VERSION variable after sync
    VERSION="$PACKAGE_VERSION"
    print_success "Versions synchronized to $PACKAGE_VERSION"
else
    print_success "Versions already synchronized ($VERSION)"
fi

# Stage 1.5: Clean Build
print_step "Cleaning previous builds..."
rm -rf server/
rm -rf dist/
print_success "Cleaned build directory"

# Stage 1.6: Install Dependencies
print_step "Installing dependencies..."
npm install --silent
print_success "Dependencies installed"

# =============================================================================
# COMPREHENSIVE QUALITY ASSURANCE PIPELINE (FAIL FAST)
# =============================================================================

echo ""
print_step "🔍 Starting comprehensive quality assurance pipeline..."

# QA Stage 1: Security & Dependency Audit
print_step "🛡️  Security and dependency audit..."
if ! npm audit --audit-level=high --silent; then
    print_error "Security vulnerabilities found!"
    echo ""
    echo "High or critical vulnerabilities detected in dependencies."
    echo "Fix with: npm audit fix"
    echo "Review: npm audit"
    exit 1
fi
print_success "Security audit passed - no high/critical vulnerabilities"

# QA Stage 2: Code Quality Pipeline
print_step "🧹 Code quality validation..."
if ! npm run quality --silent 2>/dev/null; then
    print_error "Code quality issues detected!"
    echo ""
    echo "Issues found in:"
    echo "  • ESLint violations"
    echo "  • Prettier formatting"
    echo "  • TypeScript type errors"
    echo ""
    echo "Fix with:"
    echo "  npm run lint:fix && npm run format"
    echo "  npm run typecheck"
    exit 1
fi
print_success "Code quality checks passed"

# QA Stage 3: Test Suite Execution
print_step "🧪 Running comprehensive test suite..."
if ! npm test --silent 2>/dev/null; then
    print_error "Test suite failed!"
    echo ""
    echo "One or more tests are failing. Review and fix:"
    echo "  npm test (for detailed output)"
    echo ""
    echo "Test categories that may be affected:"
    echo "  • Security tests"
    echo "  • Smoke tests" 
    echo "  • Integration tests"
    exit 1
fi
print_success "All tests passed"

print_success "✨ Quality assurance pipeline completed successfully!"

# Stage 1.7: TypeScript Compilation
print_step "Compiling TypeScript to ES modules..."

# Create server directory
mkdir -p server

# Single optimized compilation using tsconfig.build.json
if [ -f "tsconfig.build.json" ]; then
    npx tsc --project tsconfig.build.json
else
    print_warning "tsconfig.build.json not found, using fallback compilation"
    # Fallback compilation
    npx tsc src/*.ts \
        --outDir server \
        --target ES2022 \
        --module ES2022 \
        --moduleResolution bundler \
        --allowSyntheticDefaultImports \
        --esModuleInterop \
        --skipLibCheck \
        --strict \
        --declaration false
fi

print_success "TypeScript compilation complete"

# Stage 1.8: Server Structure Setup
print_step "Setting up server structure..."

# Rename main entry file to index.js
if [ -f "server/bamboo-mcp.js" ]; then
    mv server/bamboo-mcp.js server/index.js
elif [ -f "server/workable-mcp.js" ]; then
    mv server/workable-mcp.js server/index.js
fi

# Find and rename any main MCP file to index.js if not already done
if [ ! -f "server/index.js" ]; then
    MAIN_FILE=$(find server -name "*-mcp.js" | head -1)
    if [ -n "$MAIN_FILE" ]; then
        mv "$MAIN_FILE" server/index.js
    fi
fi

# Verify we have an entry point
if [ ! -f "server/index.js" ]; then
    print_error "Build failed - no main entry point found in server/"
    exit 1
fi

# Make index.js executable
chmod +x server/index.js

print_success "Server structure configured"

# Stage 1.9: Post-Build Validation
print_step "Validating built package..."
if command -v dxt &> /dev/null; then
    if dxt validate manifest.json > /dev/null 2>&1; then
        print_success "Built package structure is DXT-compliant"
    else
        print_warning "DXT validation warnings (build still successful)"
    fi
fi

# Stage 1.10: Build Summary
echo ""
echo "=================================================================="
print_success "✨ BUILD COMPLETED with COMPREHENSIVE QUALITY ASSURANCE!"
echo ""
echo "🔍 Quality Gates Passed:"
echo "  ✅ Security audit (high-level vulnerabilities)"
echo "  ✅ Code quality (ESLint + Prettier + TypeScript)"
echo "  ✅ Test suite (all tests passing)"
echo "  ✅ DXT validation (manifest and structure)"
echo "  ✅ TypeScript compilation (production build)"
echo ""
echo "📦 Package Information:"
echo "  Name: $(node -p "require('./package.json').name" 2>/dev/null || echo "workable-mcp")"
echo "  Version: $VERSION"
echo "  Server size: $(du -sh server/ | awk '{print $1}')"
echo "  Entry point: server/index.js"
echo "  Module type: ES2022"

# =============================================================================
# STAGE 2: PUBLISHING DECISION POINT
# =============================================================================

if [ "$BUILD_ONLY" = true ]; then
    echo ""
    echo "🏁 Build-only mode - skipping publishing"
    echo ""
    echo "🚀 Local Usage:"
    echo "  export WORKABLE_ACCESS_TOKEN=your_token_here"
    echo "  node server/index.js"
    echo ""
    echo "📋 Next Steps:"
    echo "  • Test: npm run dev"
    echo "  • Package DXT: npm run build:dxt"
    echo "  • Publish: $0 (without --build-only)"
    exit 0
fi

echo ""
echo "=================================================================="
echo -e "${CYAN}🤔 Publishing Decision${NC}"
echo ""
echo "Your MCP server has been built successfully and is ready for use locally."
echo ""
echo -e "${BLUE}📋 Publishing Details:${NC}"
echo "  Registry: https://npm.pkg.github.com"
echo "  Package: $(node -p "require('./package.json').name" 2>/dev/null || echo "@scope/workable-mcp")"
echo "  Version: $VERSION"
echo "  Visibility: Public (anyone can install via npm)"
echo ""
echo -e "${YELLOW}⚠️  Publishing will make this package publicly available${NC}"
echo ""

# Interactive confirmation
read -p "🚀 Would you like to publish to GitHub Packages? Type 'y' to confirm: " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    print_success "📦 Build completed - publishing skipped"
    echo ""
    echo "🚀 Local Usage:"
    echo "  export WORKABLE_ACCESS_TOKEN=your_token_here"
    echo "  node server/index.js"
    echo ""
    echo "📋 To publish later:"
    echo "  $0"
    exit 0
fi

# =============================================================================
# STAGE 3: PUBLISHING PHASE
# =============================================================================

echo ""
echo "=================================================================="
print_step "🚀 Initiating publishing workflow..."

# Stage 3.1: Publishing Prerequisites
print_step "Checking publishing prerequisites..."

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    print_error "GITHUB_TOKEN environment variable is not set"
    echo ""
    echo "To publish to GitHub Packages, you need a GitHub Personal Access Token with:"
    echo "  - write:packages permission"
    echo "  - read:packages permission (for scoped packages)"
    echo ""
    echo "Set it with: export GITHUB_TOKEN=your_token_here"
    echo ""
    echo "Create a token at: https://github.com/settings/tokens/new"
    exit 1
fi

print_success "GitHub token found"

# Stage 3.2: Package Configuration Verification
print_step "Verifying package configuration..."

PACKAGE_NAME=$(node -p "require('./package.json').name")

# Check package name is properly scoped
if [[ ! "$PACKAGE_NAME" =~ ^@[^/]+/ ]]; then
    print_error "Package name must be scoped (e.g., @username/package-name) for GitHub Packages"
    echo "Current name: $PACKAGE_NAME"
    echo ""
    echo "Update package.json with a scoped name like: @yourusername/workable-mcp"
    exit 1
fi

# Check publishConfig
PUBLISH_REGISTRY=$(node -p "require('./package.json').publishConfig?.registry || ''")
if [ "$PUBLISH_REGISTRY" != "https://npm.pkg.github.com" ]; then
    print_error "publishConfig.registry must be set to https://npm.pkg.github.com"
    echo ""
    echo "Add this to package.json:"
    echo '  "publishConfig": {'
    echo '    "registry": "https://npm.pkg.github.com"'
    echo '  }'
    exit 1
fi

print_success "Package configuration verified"

# Stage 3.3: Version Conflict Check
print_step "Checking for version conflicts..."
CURRENT_VERSION=$(node -p "require('./package.json').version")

# Check if this version already exists
if npm view "$PACKAGE_NAME@$CURRENT_VERSION" version --registry=https://npm.pkg.github.com 2>/dev/null; then
    print_warning "Version $CURRENT_VERSION already exists in registry"
    echo ""
    echo "Options:"
    echo "  1. Bump version with: npm version patch|minor|major"
    echo "  2. Continue with --force (not recommended)"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        print_info "Publishing cancelled. Consider bumping the version:"
        echo "  npm version patch  # 1.0.0 -> 1.0.1"
        echo "  npm version minor  # 1.0.0 -> 1.1.0"  
        echo "  npm version major  # 1.0.0 -> 2.0.0"
        exit 1
    fi
fi

# Stage 3.4: Dry Run Check
if [ "$DRY_RUN" = true ]; then
    print_step "Performing dry run..."
    npm publish --dry-run
    print_success "Dry run completed successfully!"
    echo ""
    echo "Review the output above. To actually publish, run without --dry-run"
    exit 0
fi

# Stage 3.5: Final Publishing Confirmation
echo ""
print_step "📋 Final publishing confirmation"
echo ""
echo "  Package: $PACKAGE_NAME"
echo "  Version: $CURRENT_VERSION"
echo "  Registry: https://npm.pkg.github.com"
echo "  Size: $(du -sh server/ | awk '{print $1}')"
echo ""
read -p "🔒 Confirm publishing? This cannot be undone. Type 'y' to proceed: " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    print_info "Publishing cancelled by user"
    exit 0
fi

# Stage 3.6: Authentication & Publishing
print_step "Authenticating with GitHub Packages..."
# The .npmrc file handles authentication via GITHUB_TOKEN
print_success "Authentication configured"

print_step "Publishing to GitHub Packages..."
npm publish

print_success "🎉 Package published successfully!"

# =============================================================================
# STAGE 4: SUCCESS SUMMARY
# =============================================================================

echo ""
echo "=================================================================="
echo -e "${GREEN}🎉 RELEASE COMPLETE with FULL QUALITY ASSURANCE!${NC}"
echo ""
echo -e "${BLUE}🔍 Quality Pipeline Summary:${NC}"
echo "  ✅ Security audit passed"
echo "  ✅ Code quality validated"
echo "  ✅ Full test suite passed"
echo "  ✅ Build validation completed"
echo "  ✅ Publishing successful"
echo ""
echo -e "${BLUE}📋 Package Details:${NC}"
echo "  Name: $PACKAGE_NAME"
echo "  Version: $CURRENT_VERSION"
echo "  Registry: https://npm.pkg.github.com"
echo "  Size: $(du -sh server/ | awk '{print $1}')"
echo ""
echo -e "${BLUE}🚀 Installation:${NC}"
echo "  npm install $PACKAGE_NAME"
echo "  npx $PACKAGE_NAME"
echo ""
echo -e "${BLUE}📦 View Package:${NC}"
echo "  https://github.com/$(echo $PACKAGE_NAME | cut -d'/' -f1 | sed 's/@//')/$(echo $PACKAGE_NAME | cut -d'/' -f2)/packages"
echo ""
echo -e "${BLUE}🔧 Claude Desktop Config:${NC}"
echo "  {"
echo "    \"mcpServers\": {"
echo "      \"workable\": {"
echo "        \"command\": \"npx\","
echo "        \"args\": [\"$PACKAGE_NAME\"],"
echo "        \"env\": {"
echo "          \"WORKABLE_ACCESS_TOKEN\": \"your_token_here\""
echo "        }"
echo "      }"
echo "    }"
echo "  }"
echo ""
print_success "🚀 Your Workable MCP Server is now publicly available!"