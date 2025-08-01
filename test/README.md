# Test Structure

Simple, practical testing approach that avoids overengineering.

## Test Types

### Quick Tests (`npm run test:quick`)

- **contracts.test.ts** - Validates tool response formats
- **security.test.ts** - Security validations
- **Time**: ~0.3 seconds

### Standard Tests (`npm test`)

- All quick tests + smoke tests
- Excludes integration tests (no API calls)
- **Time**: ~0.3 seconds

### Integration Tests (`npm run test:integration`)

- Tests against real BambooHR API
- Requires environment variables
- Enhanced with LLM response validation
- **Time**: ~10 seconds (with API calls)

### Full Test Suite (`npm run test:full`)

- Everything including integration tests
- **Time**: ~10+ seconds

## Test Scripts

```bash
npm run test:quick      # Fast contract + security tests
npm test               # Standard tests (no API calls)
npm run test:integration # Real API tests
npm run test:full      # Everything
npm run test:watch     # Watch mode (excludes integration)
npm run test:ci        # CI pipeline (quick + lint)
```

## Test Helpers

Simple validation functions in `test/helpers.ts`:

- `validateMcpResponse()` - Checks MCP format
- `validateLLMFriendly()` - Checks LLM-friendly text
- `validateToolResponse()` - Both validations
- `validateErrorResponse()` - Error format validation

## Progressive Testing

1. **Development**: `npm run test:quick` (instant feedback)
2. **Before commit**: `npm test` (comprehensive without API)
3. **CI/CD**: `npm run test:ci` (contracts + lint)
4. **Full validation**: `npm run test:full` (everything)

Keep it simple - avoid overengineering!
