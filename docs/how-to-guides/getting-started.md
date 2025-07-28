# Getting Started with BambooHR MCP

Welcome! This tutorial will guide you through setting up and using the BambooHR MCP Server with Claude Desktop. By the end, you'll be able to query your HR data using natural language.

## What You'll Learn

- How to get BambooHR credentials
- How to install and configure the MCP server
- How to make your first HR queries
- How to explore available data

## Prerequisites

- Node.js 18 or later installed
- A BambooHR account with API access
- Claude Desktop installed

## Step 1: Get Your BambooHR Credentials

### Getting Your API Key

1. Log into your BambooHR account
2. Click your name in the bottom-left corner
3. Select **"API Keys"** from the menu
4. Click **"Add New Key"**
5. Give it a name like "Claude MCP Integration"
6. **Copy the key immediately** - it won't be shown again!

### Finding Your Subdomain

Your subdomain is in your BambooHR URL:
- If your URL is `https://mycompany.bamboohr.com`
- Your subdomain is `mycompany`

## Step 2: Set Up Environment Variables

Create or edit your shell profile file (usually `~/.zshrc` or `~/.bashrc`):

```bash
# Add these lines to your shell profile
export BAMBOO_API_KEY="your_api_key_here"
export BAMBOO_SUBDOMAIN="your_company_subdomain"
```

Reload your shell:
```bash
source ~/.zshrc
```

## Step 3: Build the MCP Server

Clone and build the project:

```bash
# Navigate to the project directory
cd mcp-server

# Build the server
./scripts/build.sh
```

## Step 4: Test the Connection

Test that everything works:

```bash
# Test the server locally
node dist/bamboo-mcp.js
```

You should see:
```
 BambooHR MCP Server started successfully
```

## Step 5: Configure Claude Desktop

The server should be automatically configured, but you can verify by checking:
`~/Library/Application Support/Claude/claude_desktop_config.json`

## Step 6: Make Your First Queries

Restart Claude Desktop and try these queries:

### 1. Discover Available Data
```
What BambooHR datasets are available?
```

### 2. Explore Fields
```
What fields are available in the employee dataset?
```

### 3. Basic Employee Search
```
Find John Smith's contact information
```

### 4. Check Who's Out
```
Who's out of the office today?
```

## Next Steps

 **Congratulations!** You now have a working BambooHR MCP integration.

**What to try next:**
- [Basic HR Queries Tutorial](basic-queries.md) - Learn more query patterns
- [Workforce Analytics Guide](../how-to-guides/workforce-analytics.md) - Advanced analysis
- [Troubleshooting Guide](../how-to-guides/troubleshooting.md) - If you run into issues

## Common Issues

**"Invalid credentials" error:**
- Double-check your API key and subdomain
- Ensure environment variables are properly set

**"Server not found" in Claude:**
- Restart Claude Desktop completely
- Check the configuration file exists

**Need help?** Check our [Troubleshooting Guide](../how-to-guides/troubleshooting.md) 