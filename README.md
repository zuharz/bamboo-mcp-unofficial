# BambooHR MCP Server

**AI-powered HR analytics for Claude Desktop** - Query your BambooHR data using natural language.

> **IMPORTANT DISCLAIMER**: This is an **unofficial**, community-driven open source project. This project is NOT affiliated with, endorsed by, or connected to BambooHR® or BambooHR LLC in any way. BambooHR® is a registered trademark of BambooHR LLC. This software simply uses the publicly available BambooHR API.

> **Special Acknowledgment**: This project has been made possible to open source and share publicly with the generous permission of the CloudLinux CEO. We are grateful for their support of open source innovation and community contributions.

## Quick Start

### Option 1: DXT Package (Easiest)

**One-click installation for Claude Desktop:**

1. Download the latest [bamboohr-mcp-v1.1.1.dxt](https://github.com/zuharz/bamboo-mcp-unofficial/releases) package
2. Double-click to install in Claude Desktop
3. Enter your BambooHR API key and subdomain when prompted
4. Ask Claude: _"What BambooHR datasets are available?"_

### Option 2: NPX Command

```bash
# Run directly with npx - no installation needed
BAMBOO_API_KEY="your_api_key" BAMBOO_SUBDOMAIN="your_company" npx @zuharz/bamboo-mcp-server
```

### Option 3: Manual Configuration

Add this to your Claude Desktop MCP configuration:

```json
{
  "mcpServers": {
    "bamboo": {
      "command": "npx",
      "args": ["@zuharz/bamboo-mcp-server"],
      "env": {
        "BAMBOO_API_KEY": "your_api_key",
        "BAMBOO_SUBDOMAIN": "your_company"
      }
    }
  }
}
```

### Option 4: Build from Source

```bash
# 1. Clone and build
git clone https://github.com/zuharz/bamboo-mcp-unofficial.git
cd bamboo-mcp-unofficial
./scripts/build.sh

# 2. Run with credentials
BAMBOO_API_KEY="your_key" BAMBOO_SUBDOMAIN="your_company" node server/index.js
```

## What You Get

- **Enhanced Employee Search**: Full name support ("Igor Zivanovic") + email/ID lookup
- **Natural Language Queries**: "Who's out this week?" → Instant HR insights
- **Discovery-Driven**: Adapts to your unique BambooHR setup automatically
- **Read-Only & Secure**: No data modification, comprehensive audit trail
- **8 Comprehensive Tools**: Employee search, time-off tracking, workforce analytics, custom reports
- **Production-Ready**: 44+ tests, security auditing, error handling with retry logic

## Documentation

**New here?** → [Getting Started Guide](docs/tutorials/getting-started.md)

**Complete Documentation** → [docs/index.md](docs/index.md)

**Need help?** → [Troubleshooting Guide](docs/how-to-guides/troubleshooting.md)

## Requirements

- **Claude Desktop** (for DXT packages) OR Node.js 16+
- **BambooHR API key** ([get one here](https://documentation.bamboohr.com/docs))
- **Your company subdomain** (e.g., 'mycompany' from mycompany.bamboohr.com)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Legal Notice

- This is an **independent open source project** created by the community
- **NOT** an official BambooHR product or service
- **NOT** affiliated with, endorsed by, or connected to BambooHR LLC
- BambooHR® is a registered trademark of BambooHR LLC
- All trademarks belong to their respective owners
- This software uses the publicly documented BambooHR API

For official BambooHR products and services, visit [bamboohr.com](https://www.bamboohr.com)

---

## Authors and Credits

This project was originally created by [@zuharz](https://github.com/zuharz). For a complete list of contributors, see [docs/project/AUTHORS.md](docs/project/AUTHORS.md).

## Contributing

We welcome contributions! Please see our [Contributing Guide](docs/how-to-guides/CONTRIBUTING.md) and submit issues or pull requests via [GitHub](https://github.com/zuharz/bamboo-mcp-unofficial).

---

**Built for real-world HR analytics and team management by the open source community.**
