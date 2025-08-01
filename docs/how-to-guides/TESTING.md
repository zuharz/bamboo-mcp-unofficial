# Testing Guide

Comprehensive testing strategy with 44+ test cases across 7 test files.

## Test Files

```
test/
├── contracts.test.ts      # Tool response format validation
├── security.test.ts       # Security validations
├── smoke.test.ts          # Basic functionality checks
├── protocol-version.test.ts # MCP protocol compatibility
├── tool-execution.test.ts # Tool behavior validation
├── integration.test.ts    # Real API testing (requires credentials)
└── helpers.ts             # Test utilities
```

## Running Tests

```bash
# Run all tests
npm test

# Run quality checks (lint + format + typecheck + tests)
npm run quality

# Integration tests require credentials
export BAMBOO_API_KEY="your_key"
export BAMBOO_SUBDOMAIN="your_company"
npm test  # integration tests run automatically
```

## Test Coverage

- **Contracts**: Tool response format validation (MCP compliance)
- **Security**: API key protection, input sanitization, injection prevention
- **Smoke**: Basic functionality without external dependencies
- **Protocol**: MCP SDK version compatibility
- **Tool Execution**: Tool behavior including employee search fix
- **Integration**: Real BambooHR API calls (requires credentials)
- **Helpers**: Validation utilities (`validateMcpResponse`, `validateLLMFriendly`)

## Development Workflow

```bash
# During development
npm test                # Fast feedback

# Before committing
npm run quality         # Full validation (lint + format + typecheck + tests)

# Build and test
npm run build          # Production build
node server/index.js   # Test server
```

## Integration Testing

Integration tests automatically skip without credentials:

```bash
# Without credentials - integration tests skipped
npm test

# With credentials - full test suite
export BAMBOO_API_KEY="your_key"
export BAMBOO_SUBDOMAIN="your_company"
npm test
```

## Contributing Tests

When adding features:

- Add tests for new tools or security-sensitive code
- Use existing test patterns from `test/helpers.ts`
- Include both success and error scenarios
- Follow Jest conventions

## Test Utilities

```typescript
// From test/helpers.ts
validateMcpResponse(response); // MCP protocol compliance
validateLLMFriendly(text); // Agent-friendly output
validateToolResponse(response); // Combined validation
validateErrorResponse(error); // Error format validation
```
