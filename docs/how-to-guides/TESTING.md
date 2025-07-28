# Testing Strategy

This document outlines the minimal but essential testing approach for the BambooHR MCP Server, balancing DXT's simplicity philosophy with production quality requirements.

## Testing Philosophy

Following DXT's streamlined approach while maintaining critical quality gates:
- **Minimal test suite** focused on essential functionality
- **Security-first** testing for sensitive HR data handling
- **Smoke tests** to catch breaking changes
- **No complex integration tests** - keep it simple

## Test Structure

```
test/
├── smoke.test.ts      # Basic functionality verification
└── security.test.ts   # Security and data protection tests
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm test:watch

# Check test coverage (optional)
npm test -- --coverage
```

## Test Categories

### 1. Smoke Tests (`smoke.test.ts`)
**Purpose:** Verify basic functionality works without external dependencies

**Coverage:**
- Server instance creation
- Environment variable handling
- Basic input validation
- Configuration parsing

**Example:**
```typescript
test('Server instance creates successfully', () => {
  expect(server).toBeDefined();
  expect(server.name).toBe('bamboo-mcp-test');
});
```

### 2. Security Tests (`security.test.ts`)
**Purpose:** Ensure sensitive HR data is handled securely

**Coverage:**
- API key protection (no logging/exposure)
- Input sanitization
- Injection attack prevention
- Error message sanitization
- Environment variable security

**Example:**
```typescript
test('API keys should not be logged in error messages', () => {
  const testApiKey = 'test-secret-api-key-12345';
  const errorMsg = createErrorMessage('Invalid credentials');
  expect(errorMsg).not.toContain(testApiKey);
});
```

## Manual Testing Scenarios

For scenarios not covered by automated tests:

### API Integration Testing
```bash
# Set test credentials
export BAMBOO_API_KEY="your-test-key"
export BAMBOO_SUBDOMAIN="your-test-company"

# Build and run
npm run build
node dist/bamboo-mcp.js

# Test in Claude Desktop or MCP Inspector
```

### Critical Manual Test Cases

1. **Authentication Flow**
   - Valid credentials → successful connection
   - Invalid API key → proper error message
   - Missing subdomain → graceful failure

2. **Tool Functionality**
   - `bamboo_find_employee` with valid employee name
   - `bamboo_whos_out` for current date range
   - Error handling for non-existent data

3. **Security Verification**
   - Check logs don't contain API keys
   - Verify error messages are sanitized
   - Test with malicious input strings

## Build Integration

Tests are **not** integrated into the build process to maintain DXT's streamlined approach. However, you can run them manually:

```bash
# Build with type checking
./scripts/build.sh

# Then run tests separately
npm test
```

## Coverage Goals

- **Security tests:** 100% critical paths covered
- **Smoke tests:** Core functionality verified
- **No coverage requirements** for complex integration scenarios

## Adding New Tests

When adding features, consider:

### ✅ DO add tests for:
- New security-sensitive code
- Input validation logic
- Error handling paths
- Authentication/authorization changes

### ❌ DON'T add tests for:
- External API integration details
- Complex workflow scenarios
- UI/presentation logic
- Third-party library behavior

## Test Environment

Tests run in Node.js environment with:
- Jest test runner
- TypeScript support via ts-jest
- Isolated test environment (no external API calls)
- Mock/stub external dependencies

## Debugging Failed Tests

```bash
# Run specific test file
npm test smoke.test.ts

# Run with verbose output
npm test -- --verbose

# Run single test
npm test -- --testNamePattern="API keys should not be logged"
```

## Quality Gates

While maintaining DXT simplicity:

1. **Type checking:** Added to build process
2. **Security tests:** Must pass for sensitive data handling
3. **Smoke tests:** Catch basic regressions

## Contributing Test Guidelines

- Keep tests **simple and focused**
- No external API calls in tests
- Test **security implications** of any new code
- Follow existing test patterns
- Document any new manual testing procedures

---

This minimal testing strategy ensures production quality while respecting DXT's philosophy of simplicity over complexity.