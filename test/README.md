# Test Suite

Comprehensive testing with 44+ test cases across 7 test files.

## Running Tests

```bash
npm test                # Run all tests (Jest)
npm run quality         # Tests + lint + typecheck
```

## Test Files

- **contracts.test.ts** - Tool response format validation
- **security.test.ts** - Input sanitization, API key protection
- **smoke.test.ts** - Basic functionality checks
- **protocol-version.test.ts** - MCP protocol compatibility
- **tool-execution.test.ts** - Tool behavior validation (includes employee search fix)
- **integration.test.ts** - Real API testing (requires credentials)
- **helpers.ts** - Validation utilities

## Integration Tests

Require BambooHR credentials:

```bash
export BAMBOO_API_KEY="your_key"
export BAMBOO_SUBDOMAIN="your_company"
npm test  # integration.test.ts will run automatically
```

Without credentials, integration tests are skipped.

## Test Helpers

```typescript
// From test/helpers.ts
validateMcpResponse(); // MCP protocol format
validateLLMFriendly(); // Agent-friendly text
validateToolResponse(); // Combined validation
validateErrorResponse(); // Error format
```

## Development Workflow

1. **During development**: `npm test` (fast feedback)
2. **Before commit**: `npm run quality` (full validation)
3. **CI/CD**: Automated testing in GitHub Actions
