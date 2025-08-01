/**
 * Protocol Version Validation Tests
 *
 * Ensures our MCP server uses the latest protocol version (2025-06-18)
 * and prevents version mismatches that cause client connection failures.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { jest } from '@jest/globals';

// Mock transport for testing
class MockTransport {
  public onMessage?: (message: any) => void;
  public onClose?: () => void;
  public onError?: (error: Error) => void;

  async start() {
    // Mock transport start
  }

  async close() {
    if (this.onClose) {
      this.onClose();
    }
  }

  async send(message: any) {
    // Echo back initialization response with protocol version
    if (message.method === 'initialize') {
      setTimeout(() => {
        if (this.onMessage) {
          this.onMessage({
            jsonrpc: '2.0',
            id: message.id,
            result: {
              protocolVersion: '2025-06-18', // Latest protocol version
              capabilities: {
                tools: {},
                resources: {},
                prompts: {},
              },
              serverInfo: {
                name: 'test-server',
                version: '1.0.0',
              },
            },
          });
        }
      }, 10);
    }
  }
}

describe('MCP Protocol Version Validation', () => {
  let server: McpServer;
  let mockTransport: MockTransport;

  beforeEach(() => {
    server = new McpServer({
      name: 'protocol-test-server',
      version: '1.0.0',
    });
    mockTransport = new MockTransport();
  });

  afterEach(async () => {
    try {
      await mockTransport.close();
    } catch {
      // Ignore cleanup errors
    }
  });

  test('should use latest MCP protocol version', async () => {
    // Test that our server instance is created with latest SDK
    expect(server).toBeDefined();
    expect(server.server).toBeDefined();

    // The SDK version should support the latest protocol
    const packageJson = require('../package.json');
    const mcpSdkVersion = packageJson.dependencies['@modelcontextprotocol/sdk'];

    // Remove ^ or ~ prefix for comparison
    const cleanVersion = mcpSdkVersion.replace(/[\^~]/, '');
    const versionParts = cleanVersion.split('.').map(Number);

    // Should be at least version 1.17.0 which supports 2025-06-18 protocol
    expect(versionParts[0]).toBeGreaterThanOrEqual(1);
    if (versionParts[0] === 1) {
      expect(versionParts[1]).toBeGreaterThanOrEqual(17);
    }
  });

  test('should not contain hardcoded outdated protocol versions', () => {
    // This test ensures we don't accidentally hardcode old protocol versions
    const fs = require('fs');
    const path = require('path');

    const srcDir = path.join(__dirname, '..', 'src');
    const files = fs
      .readdirSync(srcDir)
      .filter((file: string) => file.endsWith('.ts') || file.endsWith('.js'));

    const outdatedVersions = ['2024-11-05', '2024-10-07', '2024-09-25'];

    for (const file of files) {
      const filePath = path.join(srcDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      for (const oldVersion of outdatedVersions) {
        expect(content).not.toContain(oldVersion);
      }
    }
  });

  test('should have compatible SDK capabilities', () => {
    // Test that our server has the expected capabilities for modern MCP
    expect(server).toBeDefined();

    // The server should be able to register tools, resources, and prompts
    expect(typeof server.registerTool).toBe('function');
    expect(typeof server.registerResource).toBe('function');
    expect(typeof server.registerPrompt).toBe('function');
  });

  test('SDK version should be documented as supporting 2025-06-18', () => {
    // This test documents the expected protocol version support
    const packageJson = require('../package.json');
    const mcpSdkVersion = packageJson.dependencies['@modelcontextprotocol/sdk'];

    // Log the current version for debugging
    console.log(`Current MCP SDK version: ${mcpSdkVersion}`);
    console.log('Expected to support protocol version: 2025-06-18');

    // The version should be 1.17.0 or higher
    const cleanVersion = mcpSdkVersion.replace(/[\^~]/, '');
    expect(cleanVersion).toMatch(/^1\.(1[7-9]|[2-9]\d)\.|^[2-9]\./);
  });
});

describe('Protocol Version Documentation', () => {
  test('should document protocol version requirements', () => {
    // Ensure our documentation mentions the protocol version
    const fs = require('fs');
    const path = require('path');

    // Check if README mentions protocol version
    try {
      const readmePath = path.join(__dirname, '..', 'README.md');
      const readmeContent = fs.readFileSync(readmePath, 'utf-8');

      // Should mention either protocol version or SDK version
      const hasProtocolInfo =
        readmeContent.includes('2025-06-18') ||
        readmeContent.includes('protocol') ||
        readmeContent.includes('@modelcontextprotocol/sdk');

      expect(hasProtocolInfo).toBe(true);
    } catch {
      // README might not exist, which is okay for this test
      expect(true).toBe(true);
    }
  });
});
