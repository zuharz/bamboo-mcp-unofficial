#!/bin/bash
# Setup Git hooks for BambooHR MCP Server - Build and Lint Only

set -e

echo "🔧 Setting up Git hooks (build + lint, no tests)..."

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Not in a Git repository. Please run this from the project root."
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook inline - runs build and lint only
echo "📋 Installing pre-commit hook..."
cat << 'EOF' > .git/hooks/pre-commit
#!/bin/bash

echo "🔍 Running pre-commit checks (build + lint)..."

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Run build first to ensure code compiles
echo "🔨 Running build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors before committing."
    exit 1
fi

# Run linting
echo "🧹 Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ ESLint failed. Please fix linting errors before committing."
    exit 1
fi

echo "✅ Pre-commit checks passed (build + lint)!"
EOF

# Create pre-push hook inline - same checks for consistency
echo "🚀 Installing pre-push hook..."
cat << 'EOF' > .git/hooks/pre-push
#!/bin/bash

echo "🔍 Running pre-push checks (build + lint)..."

# Run build
echo "🔨 Running build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors before pushing."
    exit 1
fi

# Run linting
echo "🧹 Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ ESLint failed. Please fix linting errors before pushing."
    exit 1
fi

echo "✅ Pre-push checks passed (build + lint)!"
EOF

# Make hooks executable
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/pre-push

echo "✅ Git hooks installed successfully!"
echo ""
echo "📝 Git hooks configured:"
echo "  • pre-commit: Build + ESLint (no tests)"
echo "  • pre-push: Build + ESLint (no tests)"
echo ""
echo "💡 To skip hooks temporarily, use:"
echo "  git commit --no-verify"
echo "  git push --no-verify"