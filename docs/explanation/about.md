# About BambooHR MCP

> **DISCLAIMER**: This is an **unofficial**, community-driven open source project. NOT affiliated with BambooHR LLC.

## What is BambooHR MCP?

An open source integration that connects BambooHR to Claude Desktop through the Model Context Protocol (MCP), enabling natural language HR queries.

## Key Features

- **8 Essential Tools**: Employee search, time-off tracking, team info, analytics
- **Discovery-Driven**: Automatically adapts to your BambooHR configuration
- **Read-Only Access**: Safe, secure, no data modification
- **Natural Language**: Ask questions like "Who's out this week?"

## Why We Built This

**Problem**: HR data is siloed in complex interfaces, making simple queries time-consuming.

**Solution**: Let AI assistants access HR data securely to answer routine questions instantly.

## Design Philosophy

**Discovery over Assumptions**: Instead of hardcoding data structures, our tools discover and adapt to each organization's unique BambooHR setup. This means:

- Works with custom fields
- Adapts to your data structure
- No configuration needed

## Technical Architecture

- **Single-file TypeScript**: Easy to understand and maintain
- **MCP Protocol**: Standard for AI-tool communication
- **Minimal Dependencies**: Just MCP SDK and TypeScript
- **5-minute Cache**: Reduces API calls, improves performance

## Community Project

This is open source software maintained by the community. We welcome contributions - see [CONTRIBUTING.md](../how-to-guides/CONTRIBUTING.md).

## Security & Privacy

- API keys stored locally only
- Read-only access (no data modification)
- All requests use HTTPS
- No data logging or storage

For technical details, see the [API Reference](../reference/api.md).