# Configuration Reference

Complete reference for all BambooHR MCP server configuration options and settings.

## Environment Variables

### Required Variables

| Variable           | Type   | Description       | Example              |
| ------------------ | ------ | ----------------- | -------------------- |
| `BAMBOO_API_KEY`   | string | BambooHR API key  | `42a3aee6fd9bbff...` |
| `BAMBOO_SUBDOMAIN` | string | Company subdomain | `mycompany`          |

### Optional Variables

| Variable                  | Type    | Default      | Description                          |
| ------------------------- | ------- | ------------ | ------------------------------------ |
| `AUDIT_LOGGING`           | boolean | `false`      | Enable detailed audit logging        |
| `SKIP_CONNECTION_TEST`    | boolean | `false`      | Skip API connection test at startup  |
| `NODE_ENV`                | string  | `production` | Environment mode                     |
| `CACHE_TTL_EMPLOYEES`     | number  | `300`        | Employee data cache TTL (seconds)    |
| `CACHE_TTL_TIME_OFF`      | number  | `600`        | Time-off data cache TTL (seconds)    |
| `CACHE_TTL_COMPANY_META`  | number  | `3600`       | Company metadata cache TTL (seconds) |
| `RATE_LIMIT_WINDOW`       | number  | `3600`       | Rate limit window (seconds)          |
| `RATE_LIMIT_MAX_REQUESTS` | number  | `100`        | Max requests per window              |

## Setting Environment Variables

### macOS/Linux (zsh)

```bash
# Edit your shell profile
nano ~/.zshrc

# Add variables
export BAMBOO_API_KEY="your_api_key"
export BAMBOO_SUBDOMAIN="your_subdomain"
export AUDIT_LOGGING="true"

# Apply changes
source ~/.zshrc
```

### macOS/Linux (bash)

```bash
# Edit bash profile
nano ~/.bashrc

# Add variables (same as above)
export BAMBOO_API_KEY="your_api_key"
# ... etc

# Apply changes
source ~/.bashrc
```

### Windows (PowerShell)

```powershell
# Set permanently
[Environment]::SetEnvironmentVariable("BAMBOO_API_KEY", "your_api_key", "User")
[Environment]::SetEnvironmentVariable("BAMBOO_SUBDOMAIN", "your_subdomain", "User")
```

## Claude Desktop Configuration

### Configuration File Location

| OS      | Path                                                              |
| ------- | ----------------------------------------------------------------- |
| macOS   | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json`                     |
| Linux   | `~/.config/Claude/claude_desktop_config.json`                     |

### NPX Configuration (Recommended)

The easiest way to use the BambooHR MCP server is via NPX - no installation or building required:

```json
{
  "mcpServers": {
    "bamboo": {
      "command": "npx",
      "args": ["@zuharz/bamboo-mcp-server"],
      "env": {
        "BAMBOO_API_KEY": "your_api_key",
        "BAMBOO_SUBDOMAIN": "your_subdomain"
      }
    }
  }
}
```

**Benefits of NPX approach:**

- ✅ No manual installation or building
- ✅ Always gets the latest version
- ✅ Works across all platforms
- ✅ No path configuration needed

**Package location:** [GitHub Packages](https://github.com/zuharz/bamboo-mcp-unofficial/packages)

### Source Build Configuration

If you prefer to build from source:

```json
{
  "mcpServers": {
    "bamboo": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/server/index.js"],
      "env": {
        "BAMBOO_API_KEY": "your_api_key",
        "BAMBOO_SUBDOMAIN": "your_subdomain"
      }
    }
  }
}
```

### Advanced NPX Configuration

```json
{
  "mcpServers": {
    "bamboo": {
      "command": "npx",
      "args": ["@zuharz/bamboo-mcp-server"],
      "env": {
        "BAMBOO_API_KEY": "your_api_key",
        "BAMBOO_SUBDOMAIN": "your_subdomain",
        "AUDIT_LOGGING": "true",
        "SKIP_CONNECTION_TEST": "false",
        "NODE_ENV": "development",
        "CACHE_TTL_EMPLOYEES": "300",
        "RATE_LIMIT_MAX_REQUESTS": "150"
      }
    }
  }
}
```

### Advanced Source Build Configuration

```json
{
  "mcpServers": {
    "bamboo": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/server/index.js"],
      "env": {
        "BAMBOO_API_KEY": "your_api_key",
        "BAMBOO_SUBDOMAIN": "your_subdomain",
        "AUDIT_LOGGING": "true",
        "SKIP_CONNECTION_TEST": "false",
        "NODE_ENV": "development",
        "CACHE_TTL_EMPLOYEES": "300",
        "RATE_LIMIT_MAX_REQUESTS": "150"
      }
    }
  }
}
```

## Configuration Validation

### Check Environment Variables

```bash
# Manually check environment variables
echo "API Key: ${BAMBOO_API_KEY:0:8}..."
echo "Subdomain: $BAMBOO_SUBDOMAIN"
echo "Audit Logging: $AUDIT_LOGGING"
```

### Validate Configuration File

```bash
# Check if config file exists and is valid JSON
cat "~/Library/Application Support/Claude/claude_desktop_config.json" | jq .

# Check server path
node -e "console.log(require('path').resolve('/path/to/dist/bamboo-mcp.js'))"
```

## Logging Configuration

### Log Levels

| Level   | Description         | When to Use     |
| ------- | ------------------- | --------------- |
| `error` | Error messages only | Production      |
| `warn`  | Warnings and errors | Production      |
| `info`  | General information | Development     |
| `debug` | Detailed debugging  | Troubleshooting |

### Enabling Audit Logging

```bash
# Enable detailed logging
export AUDIT_LOGGING="true"

# Or in Claude Desktop config
{
  "env": {
    "AUDIT_LOGGING": "true"
  }
}
```

### Log Output Examples

**Normal operation:**

```
 Starting BambooHR MCP Server...
 Read-only access to BambooHR data
 BambooHR MCP Server started successfully
```

**With audit logging:**

```
 Starting BambooHR MCP Server...
 Read-only access to BambooHR data
[BambooHR] Environment variables loaded
[BambooHR] API client initialized
[BambooHR] Connection test successful
[BambooHR] Registered tool: bamboo_discover_datasets
[BambooHR] Registered tool: bamboo_discover_fields
...
 BambooHR MCP Server started successfully
```

## Cache Configuration

### Cache Settings

| Setting        | Environment Variable     | Default | Description                     |
| -------------- | ------------------------ | ------- | ------------------------------- |
| Employee Cache | `CACHE_TTL_EMPLOYEES`    | 300     | Employee data cache duration    |
| Time-off Cache | `CACHE_TTL_TIME_OFF`     | 600     | Time-off data cache duration    |
| Metadata Cache | `CACHE_TTL_COMPANY_META` | 3600    | Company metadata cache duration |

### Cache Behavior

- **Cache Hit**: Data returned immediately from cache
- **Cache Miss**: Data fetched from BambooHR API
- **Cache Expiry**: Data refetched when TTL expires

### Disabling Cache

```bash
# Disable all caching
export CACHE_TTL_EMPLOYEES="0"
export CACHE_TTL_TIME_OFF="0"
export CACHE_TTL_COMPANY_META="0"
```

## Rate Limiting Configuration

### Rate Limit Settings

| Setting      | Environment Variable      | Default | Description             |
| ------------ | ------------------------- | ------- | ----------------------- |
| Window       | `RATE_LIMIT_WINDOW`       | 3600    | Time window in seconds  |
| Max Requests | `RATE_LIMIT_MAX_REQUESTS` | 100     | Max requests per window |

### Rate Limit Behavior

- Tracks requests per time window
- Returns error when limit exceeded
- Resets counter when window expires

### Adjusting Rate Limits

```bash
# More permissive (for heavy usage)
export RATE_LIMIT_MAX_REQUESTS="200"
export RATE_LIMIT_WINDOW="3600"

# More restrictive (for API limits)
export RATE_LIMIT_MAX_REQUESTS="50"
export RATE_LIMIT_WINDOW="3600"
```

## Security Configuration

### API Key Security

**Best Practices:**

- Use environment variables, not hardcoded values
- Restrict file permissions on configuration files
- Regenerate keys periodically
- Use read-only API keys when possible

**File Permissions:**

```bash
# Secure your shell profile
chmod 600 ~/.zshrc

# Secure Claude config
chmod 600 "~/Library/Application Support/Claude/claude_desktop_config.json"
```

### Network Security

**HTTPS Only:**

- All API calls use HTTPS
- Certificate validation enabled
- No HTTP fallback

**Firewall Requirements:**

- Outbound HTTPS (port 443) to `api.bamboohr.com`
- No inbound connections required

## Development vs Production

### Development Configuration

```bash
export NODE_ENV="development"
export AUDIT_LOGGING="true"
export SKIP_CONNECTION_TEST="false"
export CACHE_TTL_EMPLOYEES="60"  # Shorter cache for testing
```

### Production Configuration

```bash
export NODE_ENV="production"
export AUDIT_LOGGING="false"     # Reduce log noise
export SKIP_CONNECTION_TEST="false"
export CACHE_TTL_EMPLOYEES="300" # Standard cache
```

## Troubleshooting Configuration

### Common Configuration Errors

**1. Path Issues:**

```json
//  Relative path (won't work)
"args": ["./dist/bamboo-mcp.js"]

//  Absolute path
"args": ["/full/path/to/dist/bamboo-mcp.js"]
```

**2. Environment Variable Types:**

```json
//  Boolean as boolean (MCP expects strings)
"AUDIT_LOGGING": true

//  Boolean as string
"AUDIT_LOGGING": "true"
```

**3. Missing Variables:**

```json
//  Missing required variables
{
  "env": {
    "AUDIT_LOGGING": "true"
  }
}

//  All required variables
{
  "env": {
    "BAMBOO_API_KEY": "your_key",
    "BAMBOO_SUBDOMAIN": "your_subdomain"
  }
}
```

### Configuration Validation Script

```bash
#!/bin/bash
# validate-config.sh

echo " Validating BambooHR MCP Configuration..."

# Check required environment variables
if [ -z "$BAMBOO_API_KEY" ]; then
  echo " BAMBOO_API_KEY is not set"
  exit 1
fi

if [ -z "$BAMBOO_SUBDOMAIN" ]; then
  echo " BAMBOO_SUBDOMAIN is not set"
  exit 1
fi

# Check optional variables
echo " Required variables set"
echo " Optional variables:"
echo "  AUDIT_LOGGING: ${AUDIT_LOGGING:-false}"
echo "  NODE_ENV: ${NODE_ENV:-production}"

# Test API connection
echo "🔌 Testing API connection..."
curl -s -u "$BAMBOO_API_KEY:x" \
  "https://api.bamboohr.com/api/gateway.php/$BAMBOO_SUBDOMAIN/v1/meta/fields/" \
  > /dev/null

if [ $? -eq 0 ]; then
  echo " API connection successful"
else
  echo " API connection failed"
  exit 1
fi

echo " Configuration validation complete!"
```

## See Also

- [Environment Setup Guide](../how-to-guides/environment-setup.md)
- [Troubleshooting Guide](../how-to-guides/troubleshooting.md)
- [API Reference](api.md)
- [Getting Started Tutorial](../tutorials/getting-started.md)
