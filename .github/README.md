# GitHub Actions Workflows

This directory contains automated workflows for the BambooHR MCP Server project.

## Workflows

### [Lint Code](.github/workflows/lint.yml)
**Triggers:** Push/PR to `main` or `develop` branches
**Purpose:** Code quality enforcement
- Runs ESLint on TypeScript files
- Performs TypeScript type checking
- Annotates PR with lint errors

### [Test Suite](.github/workflows/test.yml)
**Triggers:** Push/PR to `main` or `develop` branches
**Purpose:** Automated testing
- Tests against Node.js versions 18, 20, 22
- Runs Jest test suite
- Uploads coverage reports to Codecov

### [Build and Release](.github/workflows/build-and-release.yml)
**Triggers:** 
- Push to `main` branch (build only)
- Git tags starting with `v*` (build + release)
**Purpose:** Build artifacts and releases
- Builds MCP server
- Creates DXT package for Claude Desktop
- Creates GitHub releases for tagged versions

## Local Development

To ensure your changes pass CI checks locally:

```bash
# Install Git hooks (runs lint on commit, tests on push)
npm run setup-hooks

# Run checks manually
npm run lint        # ESLint
npm run typecheck   # TypeScript check
npm test           # Test suite
npm run build      # Full build
```

## Coverage Requirements

- Minimum 60% coverage for branches, functions, lines, and statements
- Coverage reports are generated in the `coverage/` directory
- LCOV reports are uploaded to Codecov for tracking