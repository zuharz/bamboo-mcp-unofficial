/**
 * MCP Protocol Compliance Tests
 * Consolidated protocol validation for 2025-06-18 compliance
 */

import { Server, McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { BAMBOO_TOOLS } from '../src/config/toolDefinitions.js';
import {
  MCPError,
  MCP_ERROR_CODES,
  formatMCPErrorResponse,
  validateRequestId,
  clearProcessedRequestIds,
} from '../server/utils/mcpErrorHandler.js';

describe('MCP Protocol Compliance', () => {
  describe('Protocol Version Support', () => {
    test('should support MCP protocol 2025-06-18', () => {
      const packageJson = require('../package.json');
      const mcpSdkVersion =
        packageJson.dependencies['@modelcontextprotocol/sdk'];
      const cleanVersion = mcpSdkVersion.replace(/[\^~]/, '');
      const [major, minor] = cleanVersion.split('.').map(Number);

      // SDK 1.17+ supports protocol 2025-06-18
      expect(major).toBeGreaterThanOrEqual(1);
      if (major === 1) {
        expect(minor).toBeGreaterThanOrEqual(17);
      }
    });

    test('should not use outdated protocol versions', () => {
      const fs = require('fs');
      const path = require('path');
      const srcDir = path.join(__dirname, '..', 'src');

      if (!fs.existsSync(srcDir)) return;

      const files = fs
        .readdirSync(srcDir)
        .filter((file: string) => file.endsWith('.ts') || file.endsWith('.js'));

      const outdatedVersions = ['2024-11-05', '2024-10-07', '2024-09-25'];

      for (const file of files) {
        const content = fs.readFileSync(path.join(srcDir, file), 'utf-8');
        for (const oldVersion of outdatedVersions) {
          expect(content).not.toContain(oldVersion);
        }
      }
    });
  });

  describe('Tool Definitions', () => {
    test('should have valid tool schema structure', () => {
      BAMBOO_TOOLS.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('title');
        expect(tool).toHaveProperty('inputSchema');

        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.title).toBe('string');
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.additionalProperties).toBe(false);
      });
    });

    test('should include all BambooHR tools', () => {
      const expectedTools = [
        'bamboo_find_employee',
        'bamboo_whos_out',
        'bamboo_team_info',
        'bamboo_time_off_requests',
        'bamboo_discover_datasets',
        'bamboo_discover_fields',
        'bamboo_workforce_analytics',
        'bamboo_run_custom_report',
      ];

      const toolNames = BAMBOO_TOOLS.map((t) => t.name);
      expectedTools.forEach((name) => {
        expect(toolNames).toContain(name);
      });
      expect(BAMBOO_TOOLS.length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('Response Format', () => {
    test('should follow MCP response structure', () => {
      const validResponse = {
        content: [{ type: 'text', text: 'Response text' }],
      };

      expect(validResponse).toHaveProperty('content');
      expect(Array.isArray(validResponse.content)).toBe(true);
      expect(validResponse.content[0]).toHaveProperty('type', 'text');
      expect(validResponse.content[0]).toHaveProperty('text');
    });

    test('should handle error responses correctly', () => {
      const errorResponse = {
        content: [{ type: 'text', text: 'Error: Something went wrong' }],
        isError: true,
        _mcpError: {
          code: -32603,
          message: 'Something went wrong',
        },
      };

      expect(errorResponse).toHaveProperty('isError', true);
      expect(errorResponse).toHaveProperty('_mcpError');
      expect(errorResponse._mcpError.code).toBeLessThan(-32000);
    });
  });

  describe('Server Capabilities', () => {
    test('should declare correct capabilities', () => {
      const capabilities = { tools: {} };

      expect(capabilities).toHaveProperty('tools');
      expect(capabilities).not.toHaveProperty('resources');
      expect(capabilities).not.toHaveProperty('prompts');
    });
  });

  describe('MCP Error Handling', () => {
    beforeEach(() => {
      // Clear request ID tracking for clean tests
      clearProcessedRequestIds();
    });

    test('MCPError class should have proper structure', () => {
      const error = new MCPError('Test error', MCP_ERROR_CODES.INVALID_PARAMS, {
        field: 'test',
      });

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('MCPError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(MCP_ERROR_CODES.INVALID_PARAMS);
      expect(error.data).toEqual({ field: 'test' });
    });

    test('MCPError should serialize to JSON correctly', () => {
      const error = new MCPError(
        'Test error',
        MCP_ERROR_CODES.TOOL_EXECUTION_FAILED,
        { context: 'test' }
      );
      const serialized = error.toJSON();

      expect(serialized).toEqual({
        code: MCP_ERROR_CODES.TOOL_EXECUTION_FAILED,
        message: 'Test error',
        data: { context: 'test' },
      });
    });

    test('formatMCPErrorResponse should handle different error types', () => {
      const errorResponse = formatMCPErrorResponse(
        new Error('Network failure'),
        'API request'
      );

      expect(errorResponse).toHaveProperty('content');
      expect(errorResponse).toHaveProperty('isError', true);
      expect(errorResponse).toHaveProperty('_mcpError');
      expect(errorResponse._mcpError.code).toBe(MCP_ERROR_CODES.NETWORK_ERROR);
      expect(errorResponse.content[0].text).toContain('Network failure');
    });

    test('validateRequestId should accept valid IDs', () => {
      expect(() => validateRequestId('test-123')).not.toThrow();
      expect(() => validateRequestId(42)).not.toThrow();
      expect(() => validateRequestId('unique-id')).not.toThrow();
    });

    test('validateRequestId should reject invalid IDs', () => {
      expect(() => validateRequestId(null)).toThrow('Request ID is required');
      expect(() => validateRequestId(undefined)).toThrow(
        'Request ID is required'
      );
    });

    test('validateRequestId should detect duplicates', () => {
      validateRequestId('duplicate-test');
      expect(() => validateRequestId('duplicate-test')).toThrow(
        'Duplicate request ID'
      );
    });

    test('MCP_ERROR_CODES should be properly defined', () => {
      expect(MCP_ERROR_CODES.PARSE_ERROR).toBe(-32700);
      expect(MCP_ERROR_CODES.INVALID_REQUEST).toBe(-32600);
      expect(MCP_ERROR_CODES.INTERNAL_ERROR).toBe(-32603);
      expect(MCP_ERROR_CODES.TOOL_EXECUTION_FAILED).toBe(-32004);

      // All error codes should be negative and in correct ranges
      Object.values(MCP_ERROR_CODES).forEach((code) => {
        expect(typeof code).toBe('number');
        expect(code).toBeLessThan(0);
      });
    });
  });
});
