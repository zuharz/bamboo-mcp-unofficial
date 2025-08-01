# Quick Start Guide

> **DISCLAIMER**: This is an **unofficial**, community-driven open source project. NOT affiliated with BambooHR LLC.

## Prerequisites

- **Claude Desktop** (for DXT packages) OR Node.js 16+
- **BambooHR API access** ([get API key here](https://documentation.bamboohr.com/docs))
- **Company subdomain** (e.g., 'mycompany' from mycompany.bamboohr.com)

## 1. Get BambooHR Credentials

**API Key:**

1. Log into BambooHR → Click your name → "API Keys" → "Add New Key"
2. Copy the key immediately

**Subdomain:**

- From URL `https://mycompany.bamboohr.com` → subdomain is `mycompany`

## 2. Installation Options

### Option A: DXT Package (Easiest)

1. Download [bamboohr-mcp-v1.1.1.dxt](https://github.com/zuharz/bamboo-mcp-unofficial/releases)
2. Double-click to install in Claude Desktop
3. Enter your API key and subdomain when prompted
4. Start using immediately!

### Option B: NPX Installation

No installation or building required:

```bash
# Test the package works
BAMBOO_API_KEY="your_api_key" BAMBOO_SUBDOMAIN="your_subdomain" npx @zuharz/bamboo-mcp-server
```

### Option C: Build from Source

```bash
# Clone and build
git clone https://github.com/zuharz/bamboo-mcp-unofficial.git
cd bamboo-mcp-unofficial
npm run build

# Test connection
BAMBOO_API_KEY="your_key" BAMBOO_SUBDOMAIN="your_company" node server/index.js
```

## 3. Configure Claude Desktop

Add to Claude Desktop config:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/claude/claude_desktop_config.json`

### For NPX Installation (Recommended)

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

### For Source Build

```json
{
  "mcpServers": {
    "bamboohr": {
      "command": "node",
      "args": ["/path/to/bamboo-mcp-unofficial/server/index.js"],
      "env": {
        "BAMBOO_API_KEY": "your_api_key",
        "BAMBOO_SUBDOMAIN": "your_subdomain"
      }
    }
  }
}
```

## 4. Start Using

Restart Claude Desktop and try:

- "What BambooHR tools are available?"
- "Who is out on leave today?"
- "Find employee John Smith" (now supports full names!)
- "Show me headcount by department"

## Need Help?

- Check [Troubleshooting](../how-to-guides/troubleshooting.md)
- Review [API Reference](../reference/api.md)
- Report issues on [GitHub](https://github.com/zuharz/bamboo-mcp-unofficial/issues)
