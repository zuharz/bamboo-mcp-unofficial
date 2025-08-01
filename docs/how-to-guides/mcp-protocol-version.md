# MCP Protocol Version Management

## Overview

This guide explains how we ensure the BambooHR MCP Server uses the latest Model Context Protocol version and prevents version mismatches that can cause client connection failures.

## Current Protocol Version

- **Latest MCP Protocol**: `2025-06-18`
- **Required SDK Version**: `@modelcontextprotocol/sdk@^1.17.1` or higher
- **Protocol Negotiation**: Automatic during client-server handshake

## The Problem We Solve

**Issue**: Version mismatches between MCP clients and servers can cause silent failures:

- Client expects: `2025-06-18`
- Server responds with: `2024-11-05` (if using old SDK)
- Result: Connection failure with minimal diagnostic information

## Our Solution: Automated Validation

### 1. **MCP SDK Version Validation**

All build scripts automatically verify we're using a compatible MCP SDK version:

```bash
# Required SDK version check
REQUIRED_MCP_VERSION="1.17.0"
CURRENT_MCP_VERSION=$(node -p "require('./package.json').dependencies['@modelcontextprotocol/sdk'].replace(/[\^~]/, '')")

if [ "$(printf '%s\n' "$REQUIRED_MCP_VERSION" "$CURRENT_MCP_VERSION" | sort -V | head -n1)" = "$REQUIRED_MCP_VERSION" ]; then
    echo "✅ MCP SDK supports latest protocol (2025-06-18)"
else
    echo "❌ MCP SDK version too old for latest protocol"
    exit 1
fi
```

### 2. **Hardcoded Version Detection**

We scan source code for any hardcoded outdated protocol versions:

```bash
# Detect hardcoded old protocol versions
if grep -r "2024-11-05\|2024-10-07\|2024-09-25" src/ --include="*.ts" --include="*.js" 2>/dev/null; then
    echo "❌ Found outdated protocol version references"
    exit 1
fi
```

### 3. **Quality Gate Integration**

MCP protocol validation is integrated into all build processes:

- **`scripts/build.sh`** - Production NPM builds
- **`scripts/build-dxt.sh`** - DXT package builds
- **`.githooks/pre-push`** - Git pre-push validation
- **GitHub Actions** - CI/CD pipeline validation

## Quick Commands

### Check Current Protocol Support

```bash
npm run validate:protocol
```

### Update to Latest MCP SDK

```bash
npm install @modelcontextprotocol/sdk@latest
```

### Run Full Quality Check

```bash
npm run quality
```

## Validation Points

Our quality assurance pipeline validates MCP protocol compatibility at multiple stages:

1. **🛡️ Security Audit** - Check for vulnerabilities
2. **🧹 Code Quality** - ESLint + Prettier + TypeScript
3. **🔍 MCP Protocol** - **Version compatibility validation**
4. **🧪 Test Suite** - All tests including protocol tests
5. **📦 DXT Validation** - Package structure and manifest
6. **⚡ TypeScript** - Production compilation

## Testing Protocol Version

We include automated tests to ensure protocol version compliance:

```typescript
// test/protocol-version.test.ts
test('should use latest MCP protocol version', async () => {
  const packageJson = require('../package.json');
  const mcpSdkVersion = packageJson.dependencies['@modelcontextprotocol/sdk'];

  // Should be at least version 1.17.0
  const cleanVersion = mcpSdkVersion.replace(/[\^~]/, '');
  const versionParts = cleanVersion.split('.').map(Number);

  expect(versionParts[0]).toBeGreaterThanOrEqual(1);
  if (versionParts[0] === 1) {
    expect(versionParts[1]).toBeGreaterThanOrEqual(17);
  }
});
```

## Best Practices

### ✅ Do

- Let the MCP SDK handle protocol version negotiation automatically
- Keep `@modelcontextprotocol/sdk` updated to the latest version
- Run `npm run validate:protocol` before releases
- Use our enhanced build scripts that include validation

### ❌ Don't

- Hardcode protocol versions in your source code
- Skip protocol validation during builds
- Use outdated MCP SDK versions in production
- Override automatic protocol negotiation

## Troubleshooting

### Version Mismatch Errors

If you encounter protocol version mismatches:

1. **Update MCP SDK**:

   ```bash
   npm install @modelcontextprotocol/sdk@latest
   ```

2. **Check for hardcoded versions**:

   ```bash
   grep -r "2024-" src/ --include="*.ts"
   ```

3. **Run full validation**:
   ```bash
   scripts/build.sh
   ```

### Build Failures

If MCP protocol validation fails during builds:

1. **Review error messages** - they provide specific fix instructions
2. **Update dependencies** - ensure latest MCP SDK
3. **Remove hardcoded versions** - let SDK handle negotiation
4. **Run tests** - `npm test test/protocol-version.test.ts`

## Related Documentation

- [MCP Specification](https://modelcontextprotocol.io/specification/2025-06-18/)
- [Build Scripts Documentation](../reference/build-scripts.md)
- [Testing Guide](./TESTING.md)
- [Quality Assurance](./quality-assurance.md)

## Maintenance

This protocol validation system requires minimal maintenance:

- **Automatic updates** when bumping MCP SDK versions
- **CI/CD integration** prevents protocol regressions
- **Test coverage** ensures validation logic works correctly
- **Documentation** keeps team informed of requirements

The validation automatically adapts to new protocol versions as long as we keep the MCP SDK updated.
