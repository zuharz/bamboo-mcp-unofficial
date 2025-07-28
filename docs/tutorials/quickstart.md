# Quick Start Guide

> **DISCLAIMER**: This is an **unofficial**, community-driven open source project. NOT affiliated with BambooHR LLC.

## Prerequisites

- Node.js 18+
- BambooHR API access
- Claude Desktop

## 1. Get BambooHR Credentials

**API Key:**
1. Log into BambooHR → Click your name → "API Keys" → "Add New Key"
2. Copy the key immediately

**Subdomain:**
- From URL `https://mycompany.bamboohr.com` → subdomain is `mycompany`

## 2. Build & Configure

```bash
# Clone and build
git clone https://github.com/zuharz/bamboo-mcp-unofficial.git
cd bamboo-mcp-unofficial
./scripts/build.sh

# Set environment variables
export BAMBOO_API_KEY="your_api_key"
export BAMBOO_SUBDOMAIN="your_subdomain"

# Test connection
npm run test:connection
```

## 3. Configure Claude Desktop

Add to Claude Desktop config:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux:** `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bamboohr": {
      "command": "node",
      "args": ["/path/to/bamboo-mcp-unofficial/dist/bamboo-mcp.js"],
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
- "Find employee John Smith"

## Need Help?

- Check [Troubleshooting](../how-to-guides/troubleshooting.md)
- Review [API Reference](../reference/api.md)
- Report issues on [GitHub](https://github.com/zuharz/bamboo-mcp-unofficial/issues)