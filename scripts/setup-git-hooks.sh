#!/bin/bash
# Setup Git hooks for BambooHR MCP Server

set -e

echo "🔧 Setting up Git hooks..."

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "❌ Not in a Git repository. Please run this from the project root."
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p .git/hooks

# Copy hooks
echo "📋 Installing pre-commit hook..."
cp .githooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "🚀 Installing pre-push hook..."
cp .githooks/pre-push .git/hooks/pre-push
chmod +x .git/hooks/pre-push

# Set up git config to use our hooks directory
git config core.hooksPath .githooks

echo "✅ Git hooks installed successfully!"
echo ""
echo "📝 Git hooks configured:"
echo "  • pre-commit: Runs ESLint and TypeScript checks"
echo "  • pre-push: Runs tests and build verification"
echo ""
echo "💡 To skip hooks temporarily, use:"
echo "  git commit --no-verify"
echo "  git push --no-verify"