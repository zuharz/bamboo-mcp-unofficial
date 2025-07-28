# BambooHR MCP Server

**AI-powered HR analytics for Claude Desktop** - Query your BambooHR data using natural language.

> **IMPORTANT DISCLAIMER**: This is an **unofficial**, community-driven open source project. This project is NOT affiliated with, endorsed by, or connected to BambooHR® or BambooHR LLC in any way. BambooHR® is a registered trademark of BambooHR LLC. This software simply uses the publicly available BambooHR API.

> **Special Acknowledgment**: This project has been made possible to open source and share publicly with the generous permission of the CloudLinux CEO. We are grateful for their support of open source innovation and community contributions.

## Quick Start

```bash
# 1. Set environment variables
export BAMBOO_API_KEY="your_api_key"
export BAMBOO_SUBDOMAIN="your_company"

# 2. Build and test
./scripts/build.sh
node dist/bamboo-mcp.js

# 3. Use in Claude Desktop
"What BambooHR datasets are available?"
```

## What You Get

- **Natural Language Queries**: "Who's out this week?" → Instant HR insights
- **Discovery-Driven**: Adapts to your unique BambooHR setup automatically  
- **Read-Only & Secure**: No data modification, full audit trail
- **7 Essential Tools**: Employee search, time-off tracking, workforce analytics

## Documentation

**New here?** → [Getting Started Guide](docs/tutorials/getting-started.md)

**Complete Documentation** → [docs/index.md](docs/index.md)

**Need help?** → [Troubleshooting Guide](docs/how-to-guides/troubleshooting.md)

## Requirements

- Node.js 18+
- BambooHR API key ([get one here](https://documentation.bamboohr.com/docs))
- Claude Desktop

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

This project was originally created by [@zuharz](https://github.com/zuharz). For a complete list of contributors, see [AUTHORS.md](AUTHORS.md).

## Contributing

We welcome contributions! Please submit bug reports, feature requests, and pull requests via [GitHub](https://github.com/zuharz/bamboo-mcp-unofficial).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built for real-world HR analytics and team management by the open source community.**# Test commit
