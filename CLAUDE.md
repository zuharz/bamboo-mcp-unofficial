# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Last Updated**: January 2025  
> **Format**: Anthropic Claude.md Best Practices v2025

## Quick Start

- **Primary file**: `src/bamboo-mcp.ts` (single-file MCP server)
- **Build**: `./scripts/build.sh` (production) or `npm run build`
- **Run**: `BAMBOO_API_KEY=xxx BAMBOO_SUBDOMAIN=yyy node server/index.js`
- **NPX**: `BAMBOO_API_KEY=xxx BAMBOO_SUBDOMAIN=yyy npx @zuharz/bamboo-mcp-server`

## Project Overview

This is a **BambooHR Model Context Protocol (MCP) server** - a single-file implementation optimized for LLM agents. It provides read-only access to essential HR data through 8 comprehensive tools.

## Tech Stack

- **Runtime**: Node.js v20+ (ES2022 target)
- **Language**: TypeScript 5.5+ (direct compilation, no config files)
- **Protocol**: Model Context Protocol (MCP) SDK v1.16+
- **Transport**: stdio (standard MCP transport)
- **Dependencies**: Minimal - just MCP SDK and TypeScript types
- **Build Tool**: Custom bash script (no webpack/rollup/etc)

## Architecture

**Agent-optimized design:**

- **Single file**: `src/bamboo-mcp.ts` (~840 lines)
- **8 comprehensive tools**: Core HR + discovery + analytics + custom reports
- **Zero configuration complexity**: Just API key + subdomain
- **Simple caching**: 5-minute in-memory cache
- **Direct API calls**: No abstraction layers
- **Clean error handling**: Simple error strings

## Development Commands

### Essential Commands

```bash
# Production build (for NPM publishing)
./scripts/build.sh              # Production build to server/
npm run build                   # Same as ./scripts/build.sh

# Development workflow
npm run dev                     # Build and run (server/index.js)
node server/index.js            # Run the production build

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

**Minimal dependencies**:

- `@modelcontextprotocol/sdk@^1.16.0`
- `@types/node@^22.0.0`
- `typescript@^5.5.0`
- `zod@^3.25.76`

## Project Structure

```
mcp-server/
├── src/                       # Source TypeScript files
│   ├── bamboo-mcp.ts         # Main server implementation
│   ├── bamboo-client.ts      # API client
│   ├── formatters.ts         # Response formatters
│   └── types.ts              # Type definitions
├── dist/                     # Development builds (created by tsc)
├── server/                   # Production builds (created by build.sh)
├── artifacts/                # Build artifacts (organized structure)
│   ├── dxt/                  # DXT packages (.dxt files)
│   ├── builds/               # Build metadata and intermediate artifacts
│   └── releases/             # Release packages and archives
├── scripts/
│   ├── build.sh              # Streamlined build script
│   └── build-dxt.sh          # DXT package builder
├── docs/                     # Documentation
├── package.json              # Minimal dependencies only
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

| Tool                       | Purpose                           | Key Parameters                      |
| -------------------------- | --------------------------------- | ----------------------------------- |
| `bamboo_find_employee`     | Search employees by name/email/ID | `query` (required)                  |
| `bamboo_whos_out`          | Get time-off calendar             | `start_date`, `end_date` (optional) |
| `bamboo_team_info`         | Get department roster             | `department` (required)             |
| `bamboo_time_off_requests` | Get time-off requests             | `start_date`, `end_date` (required) |

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
- **Error Messages**: Concise format: `"Operation failed: reason"`
- **Response Format**: Clean text output optimized for LLM reasoning
- **Caching**: Simple Map-based cache with 5-minute TTL
- **Transport**: StdioServerTransport for MCP protocol
- **Request Timeout**: 30 seconds for all API calls
- **Rate Limiting**: Handled by BambooHR API (no client-side limiting)

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
   ./scripts/build.sh      # Must pass
   npm run lint            # Zero errors
   npm run typecheck       # Zero errors
   ```

2. **PR title format**: Same as commit messages

3. **Description must include**:
   - What changed and why
   - Testing performed
   - Breaking changes (if any)

## Workflow Guidelines

### Planning Before Implementation

**IMPORTANT**: For any non-trivial changes:

1. Read relevant files first
2. Generate a plan using "think hard" approach
3. Get approval before implementing
4. Implement incrementally with verification

### Common Pitfalls to Avoid

- **DON'T use `cd` unnecessarily** - use absolute paths
- **DON'T run `pytest`** - this project has no Python tests
- **DON'T modify build system** - it's intentionally minimal
- **DON'T add complex abstractions** - keep it simple
- **DON'T create test files** - manual verification only
- **DON'T use .js extensions in import statements** - causes extension runtime issues

### Error Prevention Instructions

```bash
# ALWAYS use these exact commands
./scripts/build.sh    # Production build process
npm run build         # Same as above
npm run dev           # Build and run
npm run lint          # Code linting
npm run typecheck     # Type checking
npm run format        # Code formatting

# NEVER do these
cd src && node bamboo-mcp.ts  # BAD - use compiled JS
pytest                         # BAD - no Python tests
node dist/bamboo-mcp.js        # BAD - use server/index.js
```

## Important Notes

- All operations are **read-only** - no data modification possible
- **No complex error handling** - simple error messages for agents
- **No extensive configuration** - sensible defaults throughout
- **No test files** - implementation is simple enough to verify manually
- Server is designed for **stdio transport** (MCP standard)

### Extension Runtime Fix (January 2025)

**Fixed Issue:** MCP extension failing with "Cannot find module" error

**Root Cause:** Import statements with `.js` extensions incompatible with CommonJS compilation + extension runtime

**Solution Applied:**

- Removed `.js` extensions from all import statements in source files
- Added validation to build scripts to prevent regression
- Enhanced DXT build script with dependency verification

**Critical Rule:** Never use `.js` extensions in TypeScript import statements - TypeScript compiler handles module resolution automatically.

When working with this code, maintain the simplicity principle. Avoid adding abstractions, complex error handling, or extensive configuration options. The goal is agent usability, not enterprise completeness.

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
```

**Note**: Imports work recursively (max 5 levels) and are loaded on startup.
