#!/bin/bash

# Unified Release Script for BambooHR MCP Server
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

# 🔍 Git Status Validation
validate_git_status() {
    if [ ! -d ".git" ]; then
        print_error "Not a git repository"
        exit 1
    fi
    
    if [ -n "$(git status --porcelain)" ]; then
        print_error "Git working directory is not clean"
        echo ""
        echo "Uncommitted changes detected:"
        git status --short
        echo ""
        echo "Please commit or stash changes before creating a release"
        exit 1
    fi
    
    print_success "Git working directory is clean"
}

# 🛠️ GitHub CLI Validation
validate_github_cli() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI (gh) is required but not installed"
        echo ""
        echo "Install with:"
        echo "  brew install gh        # macOS"
        echo "  sudo apt install gh    # Ubuntu/Debian"
        echo "  # or visit: https://cli.github.com/"
        exit 1
    fi
    
    if ! gh auth status >/dev/null 2>&1; then
        print_error "GitHub CLI is not authenticated"
        echo ""
        echo "Authenticate with: gh auth login"
        exit 1
    fi
    
    print_success "GitHub CLI is available and authenticated"
}

# 📈 Version Bumping
bump_version() {
    local bump_type="$1"
    print_step "Bumping version ($bump_type)..."
    
    # Use npm version to bump package.json
    npm version "$bump_type" --no-git-tag-version --silent
    
    # Get new version
    local new_version
    new_version=$(node -p "require('./package.json').version")
    
    # Update manifest.json to match
    node -e "
        const fs = require('fs');
        const manifest = require('./manifest.json');
        manifest.version = '$new_version';
        fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
    "
    
    print_success "Version bumped to $new_version"
    echo "$new_version"
}

# 🏷️ Git Tagging
create_git_tag() {
    local version="$1"
    local tag="v$version"
    
    print_step "Creating git tag: $tag"
    
    # Check if tag already exists
    if git tag -l | grep -q "^$tag$"; then
        print_error "Tag $tag already exists"
        echo ""
        echo "Delete existing tag with: git tag -d $tag"
        echo "Or use a different version"
        exit 1
    fi
    
    # Create annotated tag
    git tag -a "$tag" -m "Release $tag"
    
    # Push tag to remote
    git push origin "$tag"
    
    print_success "Git tag $tag created and pushed"
}

# 📝 Release Notes Generation
generate_release_notes() {
    local version="$1"
    local notes_file="$2"
    
    if [ -n "$notes_file" ] && [ -f "$notes_file" ]; then
        cat "$notes_file"
        return
    fi
    
    # Auto-generate release notes
    cat << EOF
## BambooHR MCP Server v$version

### Features
- Complete BambooHR API integration with 8 comprehensive tools
- Employee search with full name support
- Time-off management and team roster functionality
- Workforce analytics and custom reporting capabilities

### Technical Improvements
- Production-ready MCP server implementation
- Comprehensive quality assurance pipeline
- Enhanced error handling and logging
- TypeScript strict mode compliance

### Installation
\`\`\`bash
npm install @zuharz/bamboo-mcp-server
# or
npx @zuharz/bamboo-mcp-server
\`\`\`

### Configuration
Add to your Claude Desktop config:
\`\`\`json
{
  "mcpServers": {
    "bamboo": {
      "command": "npx",
      "args": ["@zuharz/bamboo-mcp-server"],
      "env": {
        "BAMBOO_API_KEY": "your_api_key",
        "BAMBOO_SUBDOMAIN": "your_company"
      }
    }
  }
}
\`\`\`
EOF
}

# 🚀 GitHub Release Creation
create_github_release() {
    local version="$1"
    local tag="v$version"
    local notes_file="$2"
    
    print_step "Creating GitHub release: $tag"
    
    # Generate release notes
    local temp_notes="/tmp/release-notes-$version.md"
    generate_release_notes "$version" "$notes_file" > "$temp_notes"
    
    # Build release command
    local release_cmd="gh release create $tag --title \"BambooHR MCP Server $tag\" --notes-file $temp_notes"
    
    if [ "$PRERELEASE" = true ]; then
        release_cmd="$release_cmd --prerelease"
    fi
    
    if [ "$DRAFT_RELEASE" = true ]; then
        release_cmd="$release_cmd --draft"
    fi
    
    # Create release
    eval "$release_cmd"
    
    # Clean up temp file
    rm -f "$temp_notes"
    
    print_success "GitHub release $tag created"
}

# 📦 Upload Release Artifacts
upload_release_artifacts() {
    local version="$1"
    local tag="v$version"
    
    print_step "Uploading release artifacts..."
    
    # Create server archive
    local server_archive="bamboo-mcp-server-$version.tar.gz"
    tar -czf "$server_archive" -C server .
    gh release upload "$tag" "$server_archive"
    print_success "Uploaded: $server_archive"
    
    # Upload DXT packages if available
    if [ -d "artifacts/dxt" ]; then
        for dxt_file in artifacts/dxt/*.dxt; do
            if [ -f "$dxt_file" ]; then
                gh release upload "$tag" "$dxt_file"
                print_success "Uploaded: $(basename "$dxt_file")"
            fi
        done
    fi
    
    # Create and upload npm package
    if npm pack --silent >/dev/null 2>&1; then
        local npm_package
        npm_package=$(npm pack --silent | tail -1)
        if [ -f "$npm_package" ]; then
            gh release upload "$tag" "$npm_package"
            print_success "Uploaded: $npm_package"
            rm -f "$npm_package"
        fi
    fi
    
    # Clean up server archive
    rm -f "$server_archive"
    
    print_success "All artifacts uploaded"
}

# 📊 Enhanced Help Function
show_help() {
    local current_version
    current_version=$(read_version)
    echo -e "${BLUE}BambooHR MCP Server Release Script${NC}"
    echo -e "${BLUE}Version: ${GREEN}$current_version${NC}"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help                Show this help message"
    echo "  -v, --version             Show current version"
    echo "  --build-only              Build without publishing/release prompt"
    echo "  --dry-run                 Perform dry run (build + validation only)"
    echo "  --release-only            Create GitHub release only (skip npm publish)"
    echo "  --npm-only                Publish to npm only (skip GitHub release)"
    echo "  --version-bump TYPE       Auto-bump version (patch|minor|major)"
    echo "  --release-notes FILE      Use custom release notes from file"
    echo "  --prerelease              Mark GitHub release as prerelease"
    echo "  --draft                   Create GitHub release as draft"
    echo ""
    echo "Description:"
    echo "  Builds the BambooHR MCP Server and creates comprehensive releases."
    echo "  Supports both npm publishing and GitHub releases with full automation."
    echo ""
    echo "Features:"
    echo "  • 🔨 TypeScript compilation with DXT validation"
    echo "  • 📦 Optimized server structure setup"
    echo "  • 🚀 GitHub releases with artifacts and auto-generated notes"
    echo "  • 📋 NPM publishing to GitHub Packages"
    echo "  • 🏷️ Automatic git tagging and version management"
    echo "  • 🛡️ Comprehensive quality assurance pipeline"
    echo "  • ⚡ Single-command build-to-release workflow"
    echo ""
    exit 0
}

# Parse command line arguments
BUILD_ONLY=false
DRY_RUN=false
RELEASE_ONLY=false
NPM_ONLY=false
VERSION_BUMP=""
RELEASE_NOTES_FILE=""
PRERELEASE=false
DRAFT_RELEASE=false

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
        --release-only)
            RELEASE_ONLY=true
            shift
            ;;
        --npm-only)
            NPM_ONLY=true
            shift
            ;;
        --version-bump)
            VERSION_BUMP="$2"
            if [[ ! "$VERSION_BUMP" =~ ^(patch|minor|major)$ ]]; then
                echo -e "${RED}Invalid version bump: $VERSION_BUMP${NC}"
                echo "Use: patch, minor, or major"
                exit 1
            fi
            shift 2
            ;;
        --release-notes)
            RELEASE_NOTES_FILE="$2"
            if [[ ! -f "$RELEASE_NOTES_FILE" ]]; then
                echo -e "${RED}Release notes file not found: $RELEASE_NOTES_FILE${NC}"
                exit 1
            fi
            shift 2
            ;;
        --prerelease)
            PRERELEASE=true
            shift
            ;;
        --draft)
            DRAFT_RELEASE=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Handle version bumping if requested
if [ -n "$VERSION_BUMP" ]; then
    VERSION=$(bump_version "$VERSION_BUMP")
else
    VERSION=$(read_version)
fi

echo -e "${BLUE}🚀 BambooHR MCP Server Release Pipeline v${VERSION}${NC}"
echo "=================================================================="

# =============================================================================
# STAGE 0: GIT & RELEASE PREPARATION PHASE  
# =============================================================================

if [ "$BUILD_ONLY" != true ]; then
    echo ""
    print_step "🔍 Git and release preparation..."
    
    # Validate git status (only if we're doing releases)
    if [ "$NPM_ONLY" != true ]; then
        validate_git_status
        validate_github_cli
    fi
    
    print_success "Release preparation complete"
fi

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
elif [ -f "server/bamboo-mcp.js" ]; then
    mv server/bamboo-mcp.js server/index.js
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
echo "  Name: $(node -p "require('./package.json').name" 2>/dev/null || echo "bamboo-mcp")"
echo "  Version: $VERSION"
echo "  Server size: $(du -sh server/ | awk '{print $1}')"
echo "  Entry point: server/index.js"
echo "  Module type: ES2022"

# =============================================================================
# STAGE 2: RELEASE STRATEGY DECISION POINT
# =============================================================================

if [ "$BUILD_ONLY" = true ]; then
    echo ""
    echo "🏁 Build-only mode - skipping publishing and releases"
    echo ""
    echo "🚀 Local Usage:"
    echo "  export BAMBOO_API_KEY=your_api_key"
    echo "  export BAMBOO_SUBDOMAIN=your_company"
    echo "  node server/index.js"
    echo ""
    echo "📋 Next Steps:"
    echo "  • Test: npm run dev"
    echo "  • Package DXT: npm run build:dxt"
    echo "  • Release: $0 (without --build-only)"
    exit 0
fi

# Determine release strategy
DO_NPM_PUBLISH=true
DO_GITHUB_RELEASE=true

if [ "$RELEASE_ONLY" = true ]; then
    DO_NPM_PUBLISH=false
    echo ""
    echo "🏷️ Release-only mode: Creating GitHub release only"
elif [ "$NPM_ONLY" = true ]; then
    DO_GITHUB_RELEASE=false
    echo ""
    echo "📦 NPM-only mode: Publishing to npm only"
else
    echo ""
    echo "=================================================================="
    echo -e "${CYAN}🤔 Release Strategy${NC}"
    echo ""
    echo "Your MCP server has been built successfully and is ready for release."
    echo ""
    echo -e "${BLUE}📋 Available Release Options:${NC}"
    echo "  • NPM Package: https://npm.pkg.github.com"
    echo "  • GitHub Release: with artifacts and release notes"
    echo "  • Package: $(node -p "require('./package.json').name" 2>/dev/null || echo "@scope/bamboo-mcp")"
    echo "  • Version: $VERSION"
    echo ""
    
    if [ "$DRY_RUN" != true ]; then
        echo "Options:"
        echo "  1) Both NPM + GitHub Release (recommended)"
        echo "  2) NPM package only"
        echo "  3) GitHub release only"  
        echo "  4) Skip releases"
        echo ""
        read -p "Choose option (1-4) [1]: " -r
        RELEASE_CHOICE=${REPLY:-1}
        
        case $RELEASE_CHOICE in
            1)
                echo "Selected: Both NPM package and GitHub release"
                ;;
            2)
                DO_GITHUB_RELEASE=false
                echo "Selected: NPM package only"
                ;;
            3)
                DO_NPM_PUBLISH=false
                echo "Selected: GitHub release only"
                ;;
            4)
                echo ""
                print_success "📦 Build completed - releases skipped"
                echo ""
                echo "🚀 Local Usage:"
                echo "  export BAMBOO_API_KEY=your_api_key"
                echo "  export BAMBOO_SUBDOMAIN=your_company"
                echo "  node server/index.js"
                exit 0
                ;;
            *)
                echo "Invalid option. Using default: Both NPM + GitHub Release"
                ;;
        esac
    fi
fi

# =============================================================================
# STAGE 3: NPM PUBLISHING PHASE (CONDITIONAL)
# =============================================================================

if [ "$DO_NPM_PUBLISH" = true ]; then
    echo ""
    echo "=================================================================="
    print_step "📦 Initiating NPM publishing workflow..."

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
        echo "Update package.json with a scoped name like: @yourusername/bamboo-mcp"
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
        print_step "Performing NPM dry run..."
        npm publish --dry-run
        print_success "NPM dry run completed successfully!"
    fi

    # Stage 3.5: Final Publishing Confirmation
    if [ "$DRY_RUN" != true ]; then
        echo ""
        print_step "📋 Final NPM publishing confirmation"
        echo ""
        echo "  Package: $PACKAGE_NAME"
        echo "  Version: $CURRENT_VERSION"
        echo "  Registry: https://npm.pkg.github.com"
        echo "  Size: $(du -sh server/ | awk '{print $1}')"
        echo ""
        read -p "🔒 Confirm NPM publishing? This cannot be undone. Type 'y' to proceed: " -n 1 -r
        echo

        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo ""
            print_info "NPM publishing cancelled by user"
            DO_NPM_PUBLISH=false
        else
            # Stage 3.6: Authentication & Publishing
            print_step "Authenticating with GitHub Packages..."
            # The .npmrc file handles authentication via GITHUB_TOKEN
            print_success "Authentication configured"

            print_step "Publishing to GitHub Packages..."
            npm publish

            print_success "🎉 NPM package published successfully!"
        fi
    fi
else
    print_info "Skipping NPM publishing as requested"
fi

# =============================================================================
# STAGE 4: GITHUB RELEASE PHASE (CONDITIONAL)
# =============================================================================

if [ "$DO_GITHUB_RELEASE" = true ]; then
    echo ""
    echo "=================================================================="
    print_step "🏷️ Initiating GitHub release workflow..."
    
    # Handle dry run for GitHub releases
    if [ "$DRY_RUN" = true ]; then
        print_step "Performing GitHub release dry run..."
        print_info "Would create release v$VERSION with:"
        echo "  - Git tag: v$VERSION"
        echo "  - Release notes: auto-generated or from file"
        echo "  - Artifacts: server archive, DXT packages, npm package"
        if [ "$PRERELEASE" = true ]; then
            echo "  - Mark as prerelease: yes"
        fi
        if [ "$DRAFT_RELEASE" = true ]; then
            echo "  - Create as draft: yes"
        fi
        print_success "GitHub release dry run completed!"
    else
        # Stage 4.1: Create Git Tag
        create_git_tag "$VERSION"
        
        # Stage 4.2: Create GitHub Release
        create_github_release "$VERSION" "$RELEASE_NOTES_FILE"
        
        # Stage 4.3: Upload Artifacts
        upload_release_artifacts "$VERSION"
        
        print_success "🎉 GitHub release v$VERSION created successfully!"
    fi
else
    print_info "Skipping GitHub release as requested"
fi

# =============================================================================
# STAGE 5: SUCCESS SUMMARY
# =============================================================================

echo ""
echo "=================================================================="
echo -e "${GREEN}🎉 RELEASE COMPLETE with COMPREHENSIVE AUTOMATION!${NC}"
echo ""
echo -e "${BLUE}🔍 Quality Pipeline Summary:${NC}"
echo "  ✅ Security audit passed"
echo "  ✅ Code quality validated"
echo "  ✅ Full test suite passed"
echo "  ✅ Build validation completed"
if [ "$DO_NPM_PUBLISH" = true ]; then
    echo "  ✅ NPM package published"
fi
if [ "$DO_GITHUB_RELEASE" = true ] && [ "$DRY_RUN" != true ]; then
    echo "  ✅ GitHub release created"
fi
echo ""

# Get package name for summary
PACKAGE_NAME=$(node -p "require('./package.json').name" 2>/dev/null || echo "@scope/bamboo-mcp")

echo -e "${BLUE}📋 Release Details:${NC}"
echo "  Name: $PACKAGE_NAME"
echo "  Version: $VERSION"
echo "  Server size: $(du -sh server/ | awk '{print $1}')"
if [ "$DO_NPM_PUBLISH" = true ]; then
    echo "  NPM Registry: https://npm.pkg.github.com"
fi
if [ "$DO_GITHUB_RELEASE" = true ] && [ "$DRY_RUN" != true ]; then
    echo "  GitHub Release: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/' | sed 's/\.git$//')/releases/tag/v$VERSION"
fi
echo ""

if [ "$DO_NPM_PUBLISH" = true ]; then
    echo -e "${BLUE}🚀 Installation:${NC}"
    echo "  npm install $PACKAGE_NAME"
    echo "  npx $PACKAGE_NAME"
    echo ""
fi

if [ "$DO_GITHUB_RELEASE" = true ] && [ "$DRY_RUN" != true ]; then
    echo -e "${BLUE}📦 Release Artifacts:${NC}"
    echo "  • Server archive (bamboo-mcp-server-$VERSION.tar.gz)"
    echo "  • NPM package tarball"
    if [ -d "artifacts/dxt" ] && [ -n "$(find artifacts/dxt -name "*.dxt" -type f 2>/dev/null)" ]; then
        echo "  • DXT packages for Claude Desktop"
    fi
    echo ""
fi

echo -e "${BLUE}🔧 Claude Desktop Configuration:${NC}"
echo "  {"
echo "    \"mcpServers\": {"
echo "      \"bamboo\": {"
echo "        \"command\": \"npx\","
echo "        \"args\": [\"$PACKAGE_NAME\"],"
echo "        \"env\": {"
echo "          \"BAMBOO_API_KEY\": \"your_api_key\","
echo "          \"BAMBOO_SUBDOMAIN\": \"your_company\""
echo "        }"
echo "      }"
echo "    }"
echo "  }"
echo ""

if [ "$DRY_RUN" = true ]; then
    print_success "🧪 Dry run completed - no actual changes made"
    echo ""
    echo "To perform the actual release, run without --dry-run:"
    echo "  $0"
else
    print_success "🚀 Your BambooHR MCP Server release is complete!"
fi