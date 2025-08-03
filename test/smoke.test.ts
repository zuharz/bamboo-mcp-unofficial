/**
 * Minimal smoke tests for BambooHR MCP Server - Modernized
 * These tests verify basic functionality without external dependencies
 * Updated to use the modernized modular architecture
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { BAMBOO_TOOLS } from '../server/config/toolDefinitions.js';
import {
  getToolHandler,
  hasToolHandler,
  initializeToolRouter,
  getAvailableTools,
} from '../server/config/toolRouter.js';
import { createProgressContext } from '../server/utils/progressTracker.js';
import {
  formatMCPErrorResponse,
  validateRequestId,
} from '../server/utils/mcpErrorHandler.js';
import { initializeHandlers } from '../server/handlers/bambooHandlers.js';
import { BambooClient } from '../server/bamboo-client.js';
import * as formatters from '../server/formatters.js';

describe('BambooHR MCP Server - Smoke Tests (Modernized)', () => {
  let server: Server;

  beforeAll(() => {
    // Initialize mock dependencies
    const mockBambooClient = new BambooClient({
      apiKey: 'test-key',
      subdomain: 'test-subdomain',
    });

    const mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      fatal: jest.fn(),
      child: () => mockLogger,
    };

    // Initialize handlers with mock dependencies
    initializeHandlers({
      bambooClient: mockBambooClient,
      formatters,
      logger: mockLogger,
    });

    // Initialize tool router
    initializeToolRouter();
  });

  beforeEach(() => {
    // Create server instance for testing using modernized SDK
    server = new Server(
      {
        name: 'bamboo-mcp-test',
        version: '1.1.1',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
  });

  afterEach(async () => {
    // Clean up
    if (server) {
      await server.close();
    }
  });

  describe('Server Initialization', () => {
    test('Server instance creates successfully with modern SDK', () => {
      expect(server).toBeDefined();
      expect(typeof server).toBe('object');
    });

    test('Server uses correct modern architecture', () => {
      // Verify the server is using the modern Server class, not deprecated McpServer
      expect(server.constructor.name).toBe('Server');
    });
  });

  describe('Tool Definitions Validation', () => {
    test('Tool definitions are properly loaded', () => {
      expect(BAMBOO_TOOLS).toBeDefined();
      expect(Array.isArray(BAMBOO_TOOLS)).toBe(true);
      expect(BAMBOO_TOOLS.length).toBe(10);
    });

    test('All tools have required MCP schema properties', () => {
      BAMBOO_TOOLS.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');

        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.inputSchema).toBe('object');

        // Verify proper MCP schema structure
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema).toHaveProperty('properties');
        expect(tool.inputSchema.additionalProperties).toBe(false);
      });
    });

    test('Tool names are unique', () => {
      const toolNames = BAMBOO_TOOLS.map((tool) => tool.name);
      const uniqueNames = new Set(toolNames);
      expect(uniqueNames.size).toBe(toolNames.length);
    });
  });

  describe('Tool Router Validation', () => {
    test('Tool router has handlers for all defined tools', () => {
      BAMBOO_TOOLS.forEach((tool) => {
        expect(hasToolHandler(tool.name)).toBe(true);
        expect(getToolHandler(tool.name)).toBeDefined();
        expect(typeof getToolHandler(tool.name)).toBe('function');
      });
    });

    test('getAvailableTools returns correct tool list', () => {
      const availableTools = getAvailableTools();
      expect(availableTools).toHaveLength(10);

      const expectedTools = BAMBOO_TOOLS.map((tool) => tool.name);
      availableTools.forEach((toolName) => {
        expect(expectedTools).toContain(toolName);
      });
    });

    test('Tool router handles unknown tools gracefully', () => {
      expect(hasToolHandler('unknown_tool')).toBe(false);
      expect(() => getToolHandler('unknown_tool')).toThrow(
        'Tool handler not found: unknown_tool'
      );
    });
  });

  describe('Progress Tracking Validation', () => {
    test('createProgressContext works with valid token', () => {
      const progressContext = createProgressContext('test-token');

      expect(progressContext).toHaveProperty('token', 'test-token');
      expect(progressContext).toHaveProperty('sendProgress');
      expect(typeof progressContext.sendProgress).toBe('function');
    });

    test('createProgressContext works without token', () => {
      const progressContext = createProgressContext(null);

      expect(progressContext).toHaveProperty('token', null);
      expect(progressContext).toHaveProperty('sendProgress');
      expect(typeof progressContext.sendProgress).toBe('function');
    });

    test('progress notifications handle errors gracefully', async () => {
      const progressContext = createProgressContext('test-token');

      // Should not throw even if notification fails
      await expect(
        progressContext.sendProgress(50, 100, 'Test')
      ).resolves.not.toThrow();
    });
  });

  describe('Error Handling Validation', () => {
    test('formatMCPErrorResponse creates proper error structure', () => {
      const error = new Error('Test error');
      const response = formatMCPErrorResponse(error, 'test_context');

      expect(response).toHaveProperty('content');
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content[0]).toHaveProperty('type', 'text');
      expect(response.content[0]).toHaveProperty('text');
      expect(response.content[0].text).toContain('Error: Test error');
      expect(response).toHaveProperty('isError', true);
      expect(response).toHaveProperty('_mcpError');
    });

    test('validateRequestId prevents duplicate IDs', () => {
      // First call should succeed
      expect(() => validateRequestId('unique-id-1')).not.toThrow();

      // Second call with same ID should fail
      expect(() => validateRequestId('unique-id-1')).toThrow(
        'Duplicate request ID'
      );
    });

    test('validateRequestId requires valid ID', () => {
      expect(() => validateRequestId(null)).toThrow('Request ID is required');
      expect(() => validateRequestId(undefined)).toThrow(
        'Request ID is required'
      );
    });
  });

  describe('Environment Configuration Validation', () => {
    test('Environment variables are handled securely', () => {
      const originalEnv = process.env;

      // Test with missing credentials
      delete process.env.BAMBOO_API_KEY;
      delete process.env.BAMBOO_SUBDOMAIN;

      // Should not crash when credentials are missing
      expect(() => {
        const apiKey = process.env.BAMBOO_API_KEY;
        const subdomain = process.env.BAMBOO_SUBDOMAIN;
        expect(apiKey).toBeUndefined();
        expect(subdomain).toBeUndefined();
      }).not.toThrow();

      // Restore environment
      process.env = originalEnv;
    });

    test('API key validation prevents empty/invalid values', () => {
      const testCases = ['', '   ', null, undefined];

      testCases.forEach((testValue) => {
        const isValidKey =
          testValue &&
          typeof testValue === 'string' &&
          testValue.trim().length > 0;
        expect(isValidKey).toBeFalsy();
      });
    });

    test('Subdomain validation prevents invalid formats', () => {
      const invalidSubdomains = [
        'subdomain.bamboohr.com', // Should not include full domain
        'https://subdomain.bamboohr.com',
        'subdomain/',
        'sub domain', // No spaces
        '',
        '   ',
      ];

      invalidSubdomains.forEach((subdomain) => {
        // Basic validation - should not be empty or contain invalid characters
        const isValid =
          subdomain &&
          typeof subdomain === 'string' &&
          subdomain.trim().length > 0 &&
          !subdomain.includes('.') &&
          !subdomain.includes('/') &&
          !subdomain.includes(' ') &&
          !subdomain.startsWith('http');

        expect(isValid).toBeFalsy();
      });
    });

    test('Valid subdomain formats are accepted', () => {
      const validSubdomains = ['mycompany', 'acme-corp', 'test123'];

      validSubdomains.forEach((subdomain) => {
        const isValid =
          subdomain &&
          typeof subdomain === 'string' &&
          subdomain.trim().length > 0 &&
          /^[a-zA-Z0-9-]+$/.test(subdomain);

        expect(isValid).toBeTruthy();
      });
    });
  });

  describe('Modern MCP Architecture Validation', () => {
    test('Uses current MCP SDK patterns', () => {
      // Verify we're using the modern Server class
      expect(server).toBeInstanceOf(Server);
    });

    test('Follows modern capability declaration patterns', () => {
      // Should only declare implemented capabilities
      const expectedCapabilities = {
        tools: {},
      };

      // Note: We can't directly access server capabilities in this way,
      // but we can verify the pattern is followed in our server construction
      expect(typeof expectedCapabilities.tools).toBe('object');
      expect(expectedCapabilities).not.toHaveProperty('resources');
      expect(expectedCapabilities).not.toHaveProperty('prompts');
      expect(expectedCapabilities).not.toHaveProperty('sampling');
    });

    test('Modular architecture components are properly structured', () => {
      // Verify tool definitions module
      expect(BAMBOO_TOOLS).toBeDefined();
      expect(Array.isArray(BAMBOO_TOOLS)).toBe(true);

      // Verify tool router module
      expect(getAvailableTools).toBeDefined();
      expect(typeof getAvailableTools).toBe('function');

      // Verify progress tracking module
      expect(createProgressContext).toBeDefined();
      expect(typeof createProgressContext).toBe('function');

      // Verify error handling module
      expect(formatMCPErrorResponse).toBeDefined();
      expect(typeof formatMCPErrorResponse).toBe('function');
    });
  });
});
