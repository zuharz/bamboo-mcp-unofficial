# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Last Updated**: January 2025  
> **Format**: Anthropic Claude.md Best Practices v2025

## Quick Start

- **Primary file**: `server/index.js` (modern MCP server implementation)
- **Build**: `./scripts/build.sh` (production) or `npm run build`
- **Run**: `BAMBOO_API_KEY=xxx BAMBOO_SUBDOMAIN=yyy node server/index.js`
- **NPX**: `BAMBOO_API_KEY=xxx BAMBOO_SUBDOMAIN=yyy npx @zuharz/bamboo-mcp-server`

## Project Overview

This is a **BambooHR Model Context Protocol (MCP) server** - a single-file implementation optimized for LLM agents. It provides read-only access to essential HR data through 8 comprehensive tools.

## Tech Stack

- **Runtime**: Node.js v16+ (ES2022 target)
- **Language**: TypeScript 5.5+ (dual tsconfig setup)
- **Protocol**: Model Context Protocol (MCP) SDK v1.17+
- **Transport**: stdio (standard MCP transport)
- **Testing**: Jest with comprehensive test suite
- **Quality**: ESLint + Prettier + TypeScript strict mode
- **CI/CD**: GitHub Actions with quality assurance pipeline
- **Dependencies**: Minimal core with modern dev tools

## Architecture

**Production-ready, agent-optimized design:**

- **Modern MCP architecture**: Uses latest SDK patterns with proper protocol negotiation
- **Modular structure**: Compiled JavaScript with clear separation of concerns
- **8 comprehensive tools**: Core HR + discovery + analytics + custom reports
- **Enhanced employee search**: Supports full name queries ("Igor Zivanovic")
- **Robust HTTP client**: Retry logic, rate limiting, timeout handling
- **Comprehensive testing**: 44+ tests including integration and security
- **Zero configuration complexity**: Just API key + subdomain
- **Advanced caching**: 5-minute TTL with intelligent invalidation
- **Professional error handling**: Detailed logging and user-friendly messages

## Development Commands

### Essential Commands

```bash
# Production build (for NPM publishing)
./scripts/build.sh              # Production build to server/
npm run build                   # Same as ./scripts/build.sh

# Development workflow
npm run dev                     # Build and run (server/index.js)
node server/index.js            # Run the production build

# Testing commands
npm test                        # Run all tests (excluding integration)
npm run test:quick              # Fast contract + security tests (~0.3s)
npm run test:integration        # Real API tests (requires credentials)
npm run test:full               # Everything including integration tests
npm run test:watch              # Watch mode for development

# Quality assurance
npm run lint                    # Code linting with ESLint
npm run lint:fix                # Auto-fix linting issues
npm run format                  # Format code with Prettier
npm run format:check            # Check formatting without changes
npm run typecheck              # TypeScript type checking
npm run quality                 # Run all quality checks

# Development build (optional - outputs to dist/)
npx tsc                         # Development build to dist/
```

### Environment Setup

```bash
# Option 1: Export in terminal (temporary)
export BAMBOO_API_KEY="your_api_key"
export BAMBOO_SUBDOMAIN="your_company"

# Option 2: Add to ~/.zshrc or ~/.bashrc (permanent)
echo 'export BAMBOO_API_KEY="your_api_key"' >> ~/.zshrc
echo 'export BAMBOO_SUBDOMAIN="your_company"' >> ~/.zshrc
source ~/.zshrc

# Verify environment
echo $BAMBOO_API_KEY && echo $BAMBOO_SUBDOMAIN
```

### Testing API Connection

```bash
# Quick test
curl -s -H "Authorization: Basic $(echo -n "${BAMBOO_API_KEY}:x" | base64)" \
     -H "Accept: application/json" \
     "https://api.bamboohr.com/api/gateway.php/${BAMBOO_SUBDOMAIN}/v1/meta/fields"

```

## Build System

**Dual-configuration TypeScript build system:**

### Production Build (`tsconfig.build.json`)

```bash
# Production build for NPM publishing
./scripts/build.sh
# Outputs to: server/ directory
# Uses: ES2022 modules, optimized for distribution
```

### Development Build (`tsconfig.json`)

```bash
# Development build for local testing
npx tsc
# Outputs to: dist/ directory
# Uses: CommonJS, includes source maps & declarations
```

**Core dependencies**:

- `@modelcontextprotocol/sdk@^1.17.1` - Latest MCP protocol (2025-06-18)
- `zod@^3.25.76` - Runtime type validation

**Development tools**:

- `typescript@^5.5.0` - TypeScript compiler
- `jest@^29.7.0` - Testing framework
- `eslint@^9.32.0` - Code linting
- `prettier@^3.6.2` - Code formatting
- `@types/node@^22.0.0` - Node.js types

## Project Structure

```
mcp-server/
├── src/                       # Source TypeScript files
│   ├── bamboo-mcp.ts         # Main server implementation
│   ├── bamboo-client.ts      # HTTP client with retry/rate limiting
│   ├── formatters.ts         # Response formatters
│   └── types.ts              # Type definitions
├── test/                     # Comprehensive test suite
│   ├── contracts.test.ts     # Tool response format validation
│   ├── integration.test.ts   # Real API integration tests
│   ├── security.test.ts      # Security validation tests
│   ├── smoke.test.ts         # Basic functionality tests
│   ├── tool-execution.test.ts # Tool execution tests
│   └── helpers.ts            # Test utilities
├── docs/                     # Comprehensive documentation
│   ├── how-to-guides/        # Step-by-step guides
│   ├── reference/            # API reference
│   ├── tutorials/            # Getting started
│   └── explanation/          # Concepts and architecture
├── .github/                  # GitHub Actions workflows
│   ├── workflows/            # CI/CD pipelines
│   └── ISSUE_TEMPLATE/       # Issue templates
├── dist/                     # Development builds (created by tsc)
├── server/                   # Production builds (created by build.sh)
├── scripts/
│   ├── build.sh              # Production build script
│   ├── build-dxt.sh          # DXT package builder
│   ├── release.sh            # Release automation
│   └── uninstall-dxt.sh      # DXT cleanup
├── eslint.config.js          # ESLint configuration
├── jest.config.js            # Jest testing configuration
├── tsconfig.json             # Development TypeScript config
├── tsconfig.build.json       # Production TypeScript config
├── package.json              # Dependencies and scripts
├── README.md                 # User documentation
└── CLAUDE.md                 # This file
```

## Build Artifacts Management

Following software development best practices, build artifacts are organized in a dedicated `artifacts/` directory:

### Artifacts Structure

- **`artifacts/dxt/`** - DXT packages (.dxt files) for distribution
- **`artifacts/builds/`** - Build metadata and intermediate artifacts
- **`artifacts/releases/`** - Release packages and archives

### Build Output Locations

- **Development builds**: `dist/` directory (TypeScript compilation output)
- **Production packages**: `artifacts/dxt/` directory (DXT packages for Claude Desktop)
- **Build metadata**: `artifacts/builds/` directory (size reports, logs, etc.)

### Best Practices

- Build artifacts are excluded from version control via `.gitignore`
- DXT packages use semantic versioning: `bamboo-mcp-v1.1.0.dxt`
- Directory structure is preserved with `.gitkeep` files
- Clean separation between source code and generated artifacts

## Environment Setup

Manual credential configuration:

```bash
export BAMBOO_API_KEY=your_actual_api_key
export BAMBOO_SUBDOMAIN=your_company_name
```

## BambooHR API Integration

The server connects to: `https://api.bamboohr.com/api/gateway.php/{SUBDOMAIN}/v1`

**Authentication:** HTTP Basic Auth with `API_KEY:x`

**Key endpoints used:**

- `/employees/directory` - Employee data
- `/time_off/whos_out` - Time-off calendar
- `/time_off/requests` - Time-off requests
- `/meta/fields` - Connection test
- `/datasets` - Dataset discovery
- `/datasets/{id}/fields` - Field discovery
- `/datasets/{id}` - Analytics queries (POST)
- `/custom-reports` - Custom report listing
- `/custom-reports/{id}` - Report execution

## Tools Implementation

### Core HR Tools

| Tool                       | Purpose                           | Key Parameters                      | Enhanced Features                                     |
| -------------------------- | --------------------------------- | ----------------------------------- | ----------------------------------------------------- |
| `bamboo_find_employee`     | Search employees by name/email/ID | `query` (required)                  | **Full name search support** (e.g., "Igor Zivanovic") |
| `bamboo_whos_out`          | Get time-off calendar             | `start_date`, `end_date` (optional) | Smart date handling                                   |
| `bamboo_team_info`         | Get department roster             | `department` (required)             | Comprehensive team data                               |
| `bamboo_time_off_requests` | Get time-off requests             | `start_date`, `end_date` (required) | Advanced filtering                                    |

### Discovery Tools (Use First!)

| Tool                       | Purpose                 | Returns               |
| -------------------------- | ----------------------- | --------------------- |
| `bamboo_discover_datasets` | List available datasets | Dataset IDs and names |
| `bamboo_discover_fields`   | Get dataset fields      | Field names and types |

### Analytics Tools

| Tool                         | Purpose                | Key Features              |
| ---------------------------- | ---------------------- | ------------------------- |
| `bamboo_workforce_analytics` | Run analytics queries  | Uses discovered datasets  |
| `bamboo_run_custom_report`   | Execute custom reports | List reports or run by ID |

**Technical Note**: All tools use Zod schemas with `.describe()` for parameter validation.

## Key Implementation Details

### Technical Specifications

- **Parameter Validation**: Zod schemas with `.describe()` for rich documentation
- **Error Handling**: Professional error messages with detailed logging
- **Response Format**: Clean text output optimized for LLM reasoning
- **HTTP Client**: Advanced retry logic with exponential backoff
- **Rate Limiting**: Intelligent handling of 429 responses with Retry-After support
- **Request Timeout**: Configurable timeout (default: 30 seconds)
- **Caching**: Map-based cache with 5-minute TTL and intelligent invalidation
- **Transport**: StdioServerTransport for MCP protocol
- **Logging**: Structured logging to stderr (MCP-compatible)
- **Security**: Input sanitization and API key protection

### Employee Search Enhancement (January 2025)

**Major Improvement**: Enhanced `bamboo_find_employee` tool now supports full name searches:

```typescript
// Before: Only worked with individual name parts or email
bamboo_find_employee('Igor'); // Worked
bamboo_find_employee('izivanovic@company.com'); // Worked
bamboo_find_employee('Igor Zivanovic'); // Failed

// After: Full name support added
bamboo_find_employee('Igor Zivanovic'); // Now works!
bamboo_find_employee('igor zivanovic'); // Case insensitive
bamboo_find_employee('IGOR ZIVANOVIC'); // All caps work
```

**Implementation Details**:

- Concatenates `firstName + " " + lastName` for full name matching
- Maintains backward compatibility with existing search patterns
- Case-insensitive search across all fields
- Comprehensive test coverage including edge cases

## Design Philosophy

### Core Principles

This implementation follows **simplicity over completeness**:

1. **No enterprise abstractions** → Direct, simple code paths
2. **Agent-first outputs** → Clean, professional formatted text
3. **Comprehensive coverage** → 8 tools cover all essential HR workflows
4. **Single point of truth** → One file to debug and understand
5. **Minimal dependencies** → Just MCP SDK and TypeScript types

### What This Means in Practice

- **DO**: Write clear, direct code that's easy to trace
- **DO**: Return formatted text suitable for LLM reasoning
- **DO**: Use built-in Node.js features over external libraries
- **DON'T**: Add layers of abstraction or \"enterprise patterns\"
- **DON'T**: Over-engineer error handling or logging
- **DON'T**: Add dependencies unless absolutely necessary

## Code Style & Conventions

### TypeScript Guidelines

- **Indentation**: 2 spaces (NOT tabs)
- **Quotes**: Single quotes for strings
- **Semicolons**: Always use semicolons
- **Imports**: Use ES6 imports, destructure when possible
- **Types**: Explicit types for function parameters and returns
- **Async**: Use async/await over promises
- **Naming**: camelCase for variables/functions, PascalCase for types/interfaces

### Code Patterns

```typescript
// GOOD: Clear, explicit types
const fetchEmployee = async (id: string): Promise<Employee> => { ... }

// BAD: Implicit types
const fetchEmployee = async (id) => { ... }

// GOOD: Destructured imports
import { z } from 'zod';

// BAD: Namespace imports (unless needed)
import * as zod from 'zod';
```

### Error Handling

- Keep error messages **concise and professional**
- No stack traces in production responses
- Use format: `"Operation failed: specific reason"`
- Log errors to console for debugging

## Repository Etiquette

### Branching Strategy

- **Main branch**: `main` (protected)
- **Feature branches**: `feature/description-of-change`
- **Fix branches**: `fix/issue-description`
- **NO direct commits to main**

### Commit Messages

```bash
# Format: type(scope): description
feat(tools): add employee search by department
fix(cache): resolve TTL calculation error
docs(readme): update installation instructions
refactor(api): simplify request handling

# Multi-line for complex changes
feat(analytics): implement workforce analytics tool

- Add dataset discovery endpoints
- Support filtering by department
- Cache results for 5 minutes
```

### Pull Request Process

1. **Always run before PR**:

   ```bash
   npm run quality         # Lint + format check + typecheck
   npm run build           # Must build successfully
   npm test                # All tests must pass
   ```

2. **PR title format**: Same as commit messages

3. **Description must include**:
   - What changed and why
   - Testing performed (unit/integration/manual)
   - Breaking changes (if any)
   - Security considerations (if applicable)

4. **Automated checks**: GitHub Actions will run:
   - Code quality checks (lint, format, typecheck)
   - Security audit
   - Test suite validation
   - Build verification
   - DXT package creation

## Workflow Guidelines

### Planning Before Implementation

**IMPORTANT**: For any non-trivial changes:

1. Read relevant files first
2. Generate a plan using "think hard" approach
3. Get approval before implementing
4. Implement incrementally with verification

### Common Pitfalls to Avoid

- **DON'T use `cd` unnecessarily** - use absolute paths
- **DON'T run `pytest`** - this project uses Jest, not Python tests
- **DON'T modify core build system** - it's stable and tested
- **DON'T skip quality checks** - always run `npm run quality` before PR
- **DON'T commit without tests** - add test cases for new functionality
- **DON'T use .js extensions in import statements** - causes extension runtime issues
- **DON'T run integration tests without credentials** - they will fail
- **DON'T ignore ESLint/Prettier warnings** - fix them or adjust rules consciously

### Error Prevention Instructions

```bash
# ALWAYS use these exact commands
./scripts/build.sh    # Production build process
npm run build         # Same as above
npm run dev           # Build and run
npm run quality       # All quality checks
npm run lint          # Code linting
npm run typecheck     # Type checking
npm run format        # Code formatting
npm test              # Run test suite
npm run test:quick    # Fast tests only

# NEVER do these
cd src && node bamboo-mcp.ts  # BAD - use compiled JS
pytest                         # BAD - no Python tests
node dist/bamboo-mcp.js        # BAD - use server/index.js
npm run test:integration       # BAD - without API credentials
```

## Testing Strategy

### Progressive Testing Approach

The project uses a **simple, practical testing strategy** that avoids overengineering:

1. **Quick Tests** (`npm run test:quick`) - ~0.3 seconds
   - Contract validation (tool response formats)
   - Security validations (input sanitization, API key handling)
   - No external dependencies

2. **Standard Tests** (`npm test`) - ~0.3 seconds
   - All quick tests + smoke tests
   - Excludes integration tests (no API calls)
   - Perfect for development and CI

3. **Integration Tests** (`npm run test:integration`) - ~10 seconds
   - Tests against real BambooHR API
   - Requires `BAMBOO_API_KEY` and `BAMBOO_SUBDOMAIN`
   - Enhanced with LLM response validation
   - **44+ comprehensive test cases** including employee search fix

4. **Full Test Suite** (`npm run test:full`) - ~10+ seconds
   - Everything including integration tests
   - Use before major releases

### Test Helpers and Validation

```typescript
// Simple validation functions in test/helpers.ts
validateMcpResponse(); // Checks MCP protocol format
validateLLMFriendly(); // Checks agent-friendly text output
validateToolResponse(); // Both validations combined
validateErrorResponse(); // Error format validation
```

### Development Workflow

1. **During development**: `npm run test:quick` (instant feedback)
2. **Before commit**: `npm test` (comprehensive without API calls)
3. **CI/CD pipeline**: Automated quality assurance
4. **Full validation**: `npm run test:full` (when credentials available)

## Quality Assurance & CI/CD

### GitHub Actions Pipeline

Automated quality assurance runs on every pull request:

1. **Security Audit**: Dependency vulnerability scanning
2. **Code Quality**: ESLint + Prettier + TypeScript strict checks
3. **Test Suite**: Contract + security + smoke tests
4. **Build Verification**: Production build + DXT package creation
5. **Protocol Validation**: MCP SDK version compatibility

### Code Quality Tools

```bash
# ESLint configuration with security rules
eslint.config.js           # Modern flat config
eslint.config.layer2.js    # Additional rules
eslint.config.layer3.js    # Security-focused rules

# Prettier for consistent formatting
.prettierrc               # Code formatting rules

# TypeScript strict mode
tsconfig.json            # Development config
tsconfig.build.json      # Production config
```

### Pre-commit Hooks

Optional `lint-staged` configuration for automatic code formatting:

```json
"lint-staged": {
  "*.{ts,js}": ["eslint --fix", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"]
}
```

## Important Notes

- All operations are **read-only** - no data modification possible
- **Production-ready error handling** - detailed logging with user-friendly messages
- **Comprehensive test coverage** - 44+ tests including real API integration
- **Modern tooling** - ESLint, Prettier, Jest, TypeScript strict mode
- **CI/CD pipeline** - Automated quality assurance and security auditing
- Server is designed for **stdio transport** (MCP standard)

### Extension Runtime Fix (January 2025)

**Fixed Issue:** MCP extension failing with "Cannot find module" error

**Root Cause:** Import statements with `.js` extensions incompatible with CommonJS compilation + extension runtime

**Solution Applied:**

- Removed `.js` extensions from all import statements in source files
- Added validation to build scripts to prevent regression
- Enhanced DXT build script with dependency verification

**Critical Rule:** Never use `.js` extensions in TypeScript import statements - TypeScript compiler handles module resolution automatically.

## Modern Development Practices (Post-Modernization)

### Code Quality Standards

After the January 2025 modernization, the project follows these practices:

1. **Comprehensive Testing**: 44+ test cases covering all scenarios
2. **Security First**: Input validation, API key protection, dependency auditing
3. **Type Safety**: TypeScript strict mode with explicit types
4. **Code Consistency**: ESLint + Prettier with security rules
5. **CI/CD Integration**: Automated quality assurance pipeline
6. **Documentation**: Comprehensive docs with tutorials and references

### Development Workflow

```bash
# 1. Start development
git checkout -b feature/your-feature

# 2. Make changes with quality checks
npm run test:quick          # Fast feedback during development
npm run quality             # Before committing

# 3. Run comprehensive tests
npm test                    # All tests (no API calls)
npm run test:integration    # With API credentials (optional)

# 4. Create pull request
# GitHub Actions will automatically run full quality assurance
```

### Legacy Practice Deprecation

**DEPRECATED (Do not use after modernization):**

- Manual testing only → Use comprehensive test suite
- "No test files" approach → Write tests for new features
- Simple error strings → Use structured error handling
- Manual quality checks → Use automated `npm run quality`

**MODERN PRACTICES (Use these instead):**

- Test-driven development with Jest
- Automated quality assurance pipeline
- Comprehensive error handling with logging
- Security-first input validation
- Type-safe development with strict TypeScript

When working with this code, maintain both simplicity AND quality. The goal is professional, production-ready code that's still agent-friendly and easy to understand.

## Memory Management

### Quick Updates

Press `#` key to add instructions that get incorporated into CLAUDE.md:

```bash
# Example: After discovering a new command
# "Always use npm run build instead of direct tsc compilation"

# Example: After fixing an issue
# "Check BAMBOO_SUBDOMAIN doesn't include .bamboohr.com suffix"
```

### Import Other Files

```markdown
# Import API documentation

@docs/references/public-openapi.yaml

# Import implementation notes

@FIXES.md
@test/README.md
```

**Note**: Imports work recursively (max 5 levels) and are loaded on startup.
