# GitHub Actions DXT Artifacts Guide

This guide explains how to use the automated GitHub Actions workflows to build and download DXT packages as artifacts.

## Overview

We've implemented comprehensive GitHub Actions workflows that automatically:

1. **Quality Assurance**: Run security audits, linting, formatting, and tests
2. **Build Artifacts**: Create both NPM and DXT packages
3. **Upload Artifacts**: Store packages for easy download
4. **Create Releases**: Automated release management with DXT attachments

## Workflows

### 1. `build-dxt-artifacts.yml` - Automatic Artifact Creation

**Triggers:**

- Push to any branch
- Pull requests to main
- Manual dispatch

**What it does:**

1. **Quality Pipeline**: Comprehensive QA using our enhanced build scripts
2. **NPM Build**: Creates production server files
3. **DXT Build**: Creates installable DXT packages
4. **Artifact Upload**: Stores both for download

**Artifacts Created:**

- `npm-build-{commit-sha}` - Production server files (30 days)
- `bamboohr-mcp-dxt-{commit-sha}` - DXT package (90 days)
- `dxt-build-info-{commit-sha}` - Build metadata (30 days)

### 2. `release-with-dxt.yml` - Release Management

**Triggers:**

- GitHub releases
- Manual dispatch with version tag

**What it does:**

1. **Quality & Build**: Full pipeline with release-grade validation
2. **NPM Publishing**: Publishes to GitHub Packages
3. **GitHub Release**: Creates release with DXT file attachment
4. **Long-term Storage**: 365-day artifact retention

## How to Download DXT Packages

### Option 1: From Workflow Artifacts (Development)

1. **Navigate to Actions**:

   ```
   Your Repository → Actions tab
   ```

2. **Find Your Workflow Run**:
   - Click on "Build DXT Package Artifacts" workflow
   - Select the run from your commit/branch

3. **Download Artifacts**:
   - Scroll to bottom of the run page
   - Look for "Artifacts" section
   - Click on `bamboohr-mcp-dxt-{commit-sha}` to download

4. **Extract and Use**:
   ```bash
   # Download will be a ZIP file
   unzip bamboohr-mcp-dxt-{commit-sha}.zip
   # You'll find the .dxt file inside
   ls *.dxt
   ```

### Option 2: From GitHub Releases (Production)

1. **Go to Releases**:

   ```
   Your Repository → Releases tab
   ```

2. **Download DXT File**:
   - Find your desired release
   - Download the `.dxt` file from "Assets"
   - File will be named: `bamboohr-mcp-{version}.dxt`

## Installation in Claude Desktop

Once you have the `.dxt` file:

1. **Open Claude Desktop**
2. **Go to Settings** → **Extensions**
3. **Install from File**:
   - Click "Install from file" or drag & drop
   - Select your downloaded `.dxt` file
4. **Configure**:
   - Enter your BambooHR API key
   - Enter your company subdomain
5. **Ready to Use!**

## Workflow Features

### Quality Assurance Integration

Every build runs our comprehensive QA pipeline:

```yaml
- Security Audit: npm audit --audit-level=high
- Code Quality: npm run quality (ESLint + Prettier + TypeScript)
- Test Suite: npm test (all test categories)
- DXT Validation: dxt validate (package structure)
```

### Fail-Fast Design

If any stage fails, the build stops immediately with clear error messages:

- **Security vulnerabilities** → Build fails
- **Code quality issues** → Build fails
- **Test failures** → Build fails
- **DXT validation errors** → Build fails

### Automatic Artifact Management

- **Retention Periods**: 30-365 days based on artifact type
- **Versioned Names**: Includes commit SHA or version
- **Size Optimization**: Only essential files included
- **Validation**: DXT packages verified before upload

## Troubleshooting

### Workflow Fails

1. **Check the Logs**:

   ```
   Actions → Failed Run → Click on failed job → Expand failed step
   ```

2. **Common Issues**:
   - **Security vulnerabilities**: Run `npm audit fix`
   - **Code quality**: Run `npm run lint:fix && npm run format`
   - **Test failures**: Fix failing tests locally first
   - **DXT validation**: Check manifest.json syntax

### No Artifacts Created

1. **Verify Workflow Completion**:
   - Ensure all jobs completed successfully
   - Check for any failed steps

2. **Check Artifact Retention**:
   - Artifacts expire after retention period
   - Look for newer runs

### DXT Installation Issues

1. **File Corruption**:
   - Re-download the artifact
   - Verify the .dxt file isn't corrupted

2. **Claude Desktop Issues**:
   - Ensure you have latest Claude Desktop
   - Check file permissions on the .dxt file

## Manual Commands

For local development and testing:

```bash
# Build NPM package locally
npm run build

# Build DXT package locally
npm run build:dxt

# Build with full QA pipeline
scripts/build.sh          # NPM with QA
scripts/build-dxt.sh       # DXT with QA
```

## Benefits

### For Developers

- **Automatic Quality Checks**: Every push validated
- **Immediate Feedback**: Know if your changes work
- **Easy Testing**: Download and test DXT packages
- **No Local Dependencies**: Build happens in clean environment

### For Users

- **Always Available**: DXT packages built on every change
- **Quality Guaranteed**: Comprehensive testing before upload
- **Easy Installation**: One-click DXT installation
- **Version History**: Access any version via artifacts

### For Releases

- **Automated Process**: Push tag → Full release created
- **Quality Assured**: Release-grade validation
- **Multiple Formats**: NPM + DXT packages
- **Professional Presentation**: Rich release notes

## Next Steps

1. **Test the Workflow**: Push a commit and verify artifacts are created
2. **Download & Test**: Try installing the DXT package in Claude Desktop
3. **Create a Release**: Test the full release workflow
4. **Iterate**: Make improvements based on your experience

The automated DXT artifact system makes it incredibly easy to distribute and test your MCP server across different environments!
