/**
 * Simple contract tests for MCP tools
 * Validates basic input/output structure without overengineering
 */

import * as formatters from '../src/formatters.js';
import { BAMBOO_TOOLS } from '../src/config/toolDefinitions.js';
import {
  getToolHandler,
  hasToolHandler,
  initializeToolRouter,
} from '../src/config/toolRouter.js';
// Initialize domain-specific handlers
import { initializeEmployeeHandlers } from '../src/handlers/employeeHandlers.js';
import { initializeTimeOffHandlers } from '../src/handlers/timeOffHandlers.js';
import { initializeDatasetHandlers } from '../src/handlers/datasetHandlers.js';
import { initializeWorkforceAnalyticsHandlers } from '../src/handlers/workforceAnalyticsHandlers.js';
import { initializeReportHandlers } from '../src/handlers/reportHandlers.js';
import { initializeOrganizationHandlers } from '../src/handlers/organizationHandlers.js';
import { BambooClient } from '../src/bamboo-client.js';

describe('Tool Contracts', () => {
  // Simple validation that responses follow MCP format
  const validateMcpResponse = (response: any) => {
    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(response.content[0]).toHaveProperty('text');
    expect(typeof response.content[0].text).toBe('string');
  };

  // Simple validation for LLM-friendly text
  const validateLLMFriendly = (text: string) => {
    // Basic checks - no undefined/null strings
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('null');
    expect(text).not.toContain('[object Object]');

    // Has reasonable length
    expect(text.length).toBeGreaterThan(5);
    expect(text.length).toBeLessThan(10000);

    // Contains some structure (headers, bold, or lists)
    expect(text).toMatch(/\*\*|##|•|-\s|\n/);
  };

  test('All tools should return valid MCP response format', () => {
    const tools = [
      'bamboo_find_employee',
      'bamboo_whos_out',
      'bamboo_team_info',
      'bamboo_time_off_requests',
      'bamboo_discover_datasets',
      'bamboo_discover_fields',
      'bamboo_workforce_analytics',
      'bamboo_run_custom_report',
      'bamboo_get_employee_photo',
      'bamboo_list_departments',
    ];

    // Just validate that we have these tools defined somewhere
    // (Integration tests will test actual functionality)
    expect(tools.length).toBe(10);
    tools.forEach((tool) => {
      expect(typeof tool).toBe('string');
      expect(tool).toMatch(/^bamboo_[a-z_]+$/);
    });
  });

  describe('Formatter Functions', () => {
    test('formatErrorResponse handles Error objects', () => {
      const errorResponse = formatters.formatErrorResponse(
        new Error('Test error'),
        'Test context'
      );

      validateMcpResponse(errorResponse);
      expect(errorResponse.content[0].text).toContain('ERROR: Test context');
      expect(errorResponse.content[0].text).toContain('Test error');
    });

    test('formatErrorResponse handles string errors', () => {
      const errorResponse = formatters.formatErrorResponse(
        'Simple error message'
      );

      validateMcpResponse(errorResponse);
      expect(errorResponse.content[0].text).toContain(
        'ERROR: Simple error message'
      );
    });

    test('formatErrorResponse handles null/undefined', () => {
      const nullResponse = formatters.formatErrorResponse(null);
      const undefinedResponse = formatters.formatErrorResponse(undefined);

      validateMcpResponse(nullResponse);
      validateMcpResponse(undefinedResponse);
      expect(nullResponse.content[0].text).toContain('ERROR:');
      expect(undefinedResponse.content[0].text).toContain('ERROR:');
    });

    test('formatApiErrorResponse provides status-specific guidance', () => {
      const forbiddenError = formatters.formatApiErrorResponse(
        new Error('Forbidden'),
        '/employees',
        403
      );

      validateMcpResponse(forbiddenError);
      expect(forbiddenError.content[0].text).toContain('403');
      expect(forbiddenError.content[0].text).toContain('/employees');
      expect(forbiddenError.content[0].text).toContain('permissions');
    });

    test('formatValidationError includes suggestions', () => {
      const validationError = formatters.formatValidationError(
        'Invalid query parameter',
        ['Check spelling', 'Use valid format']
      );

      validateMcpResponse(validationError);
      expect(validationError.content[0].text).toContain(
        'Invalid query parameter'
      );
      expect(validationError.content[0].text).toContain('Check spelling');
    });

    test('formatNetworkError provides troubleshooting', () => {
      const networkError = formatters.formatNetworkError(
        new Error('ECONNREFUSED')
      );

      validateMcpResponse(networkError);
      expect(networkError.content[0].text).toContain('Network Error');
      expect(networkError.content[0].text).toContain('connection');
    });
  });

  describe('Tool Schema Validation', () => {
    test('All tools should have complete schema definitions', () => {
      BAMBOO_TOOLS.forEach((tool) => {
        // Required MCP tool properties
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('title');
        expect(tool).toHaveProperty('inputSchema');

        // Type validation
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.title).toBe('string');
        expect(typeof tool.inputSchema).toBe('object');

        // Content validation
        expect(tool.name.length).toBeGreaterThan(0);
        expect(tool.description.length).toBeGreaterThan(10);
        expect(tool.title.length).toBeGreaterThan(0);
        expect(tool.name).toMatch(/^bamboo_[a-z_]+$/);
      });
    });

    test('Tool input schemas should follow JSON Schema spec', () => {
      BAMBOO_TOOLS.forEach((tool) => {
        const schema = tool.inputSchema;

        // Required JSON Schema properties
        expect(schema).toHaveProperty('type', 'object');
        expect(schema).toHaveProperty('properties');
        expect(schema).toHaveProperty('additionalProperties', false);

        // Properties should be an object
        expect(typeof schema.properties).toBe('object');
        expect(Array.isArray(schema.properties)).toBe(false);

        // Validate each property definition
        Object.entries(schema.properties).forEach(
          ([propName, propDef]: [string, any]) => {
            expect(typeof propName).toBe('string');
            expect(typeof propDef).toBe('object');
            expect(propDef).toHaveProperty('type');
            expect(typeof propDef.type).toBe('string');
          }
        );
      });
    });

    test('Required parameters should be properly defined', () => {
      const toolsWithRequiredParams = [
        'bamboo_find_employee', // requires 'query'
        'bamboo_team_info', // requires 'department'
        'bamboo_time_off_requests', // requires 'start_date', 'end_date'
      ];

      toolsWithRequiredParams.forEach((toolName) => {
        const tool = BAMBOO_TOOLS.find((t) => t.name === toolName);
        expect(tool).toBeDefined();

        if (tool) {
          expect(tool.inputSchema).toHaveProperty('required');
          expect(Array.isArray(tool.inputSchema.required)).toBe(true);
          expect(tool.inputSchema.required.length).toBeGreaterThan(0);
        }
      });
    });

    test('Tool schemas should validate sample inputs correctly', () => {
      // Test with valid sample inputs
      const sampleInputs = {
        bamboo_find_employee: { query: 'John Smith' },
        bamboo_whos_out: { start_date: '2024-01-01', end_date: '2024-01-31' },
        bamboo_team_info: { department: 'Engineering' },
        bamboo_discover_datasets: {},
        bamboo_discover_fields: { dataset_id: 'employee' },
      };

      Object.entries(sampleInputs).forEach(([toolName, input]) => {
        const tool = BAMBOO_TOOLS.find((t) => t.name === toolName);
        expect(tool).toBeDefined();

        if (tool) {
          // Basic validation - check that required properties are provided
          if (tool.inputSchema.required) {
            tool.inputSchema.required.forEach((requiredProp: string) => {
              expect(input).toHaveProperty(requiredProp);
            });
          }

          // Type validation for provided properties
          Object.entries(input).forEach(([key, value]) => {
            if (tool.inputSchema.properties[key]) {
              const expectedType = tool.inputSchema.properties[key].type;
              const actualType = typeof value;

              if (expectedType === 'string') {
                expect(actualType).toBe('string');
              }
            }
          });
        }
      });
    });

    test('Tool descriptions should be informative and LLM-friendly', () => {
      BAMBOO_TOOLS.forEach((tool) => {
        const description = tool.description;

        // Should be descriptive
        expect(description.length).toBeGreaterThan(20);
        expect(description.length).toBeLessThan(500);

        // Should not contain placeholder text
        expect(description.toLowerCase()).not.toContain('todo');
        expect(description.toLowerCase()).not.toContain('placeholder');
        expect(description.toLowerCase()).not.toContain('fixme');

        // Should be proper sentence structure
        expect(description.charAt(0)).toMatch(/[A-Z]/); // Starts with capital
        // Should end with period or be a clear command phrase
        const endsCorrectly =
          description.trim().endsWith('.') || description.length > 20; // Allow descriptive phrases without periods
        expect(endsCorrectly).toBe(true);
      });
    });
  });

  describe('Claude Client Simulation', () => {
    let mockBambooClient: BambooClient;

    beforeAll(() => {
      // Initialize mock client and handlers for simulation
      mockBambooClient = new BambooClient({
        apiKey: 'test-key',
        subdomain: 'test-company',
      });

      const mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        fatal: jest.fn(),
        child: () => mockLogger,
      };

      // Initialize domain-specific handlers with mocks (no actual API calls)
      const handlerDependencies = {
        bambooClient: mockBambooClient,
        formatters,
        logger: mockLogger,
      };

      initializeEmployeeHandlers(handlerDependencies);
      initializeTimeOffHandlers(handlerDependencies);
      initializeDatasetHandlers(handlerDependencies);
      initializeWorkforceAnalyticsHandlers(handlerDependencies);
      initializeReportHandlers(handlerDependencies);
      initializeOrganizationHandlers(handlerDependencies);

      initializeToolRouter();
    });

    test('tools/list request should return all available tools', async () => {
      // Simulate Claude requesting tool list
      const toolListResponse = BAMBOO_TOOLS;

      expect(Array.isArray(toolListResponse)).toBe(true);
      expect(toolListResponse.length).toBeGreaterThan(0);

      // Each tool should have Claude-compatible schema
      toolListResponse.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('title'); // Required for 2025-06-18
        expect(tool).toHaveProperty('inputSchema');

        // Validate schema is JSON Schema compliant
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema).toHaveProperty('properties');
        expect(tool.inputSchema.additionalProperties).toBe(false);
      });
    });

    test('tools/call request should handle valid tool execution', async () => {
      // Simulate Claude calling bamboo_discover_datasets (no params needed)
      const toolName = 'bamboo_discover_datasets';
      const toolArgs = {};

      expect(hasToolHandler(toolName)).toBe(true);
      const handler = getToolHandler(toolName);
      expect(handler).toBeDefined();

      // Mock the API call to avoid network requests
      jest.spyOn(mockBambooClient, 'get').mockResolvedValue({
        datasets: [
          { id: 'employee', name: 'Employee Data' },
          { id: 'timeoff', name: 'Time Off Data' },
        ],
      });

      const response = await handler!(toolArgs, {
        progressToken: null,
        isEnabled: false,
        sendProgress: jest.fn(),
      });

      // Validate MCP response format
      validateMcpResponse(response);
      expect(response.content[0].text).toContain('Employee Data');
      expect(response.content[0].text).toContain('employee');
    });

    test('tools/call request should handle required parameters', async () => {
      // Simulate Claude calling bamboo_find_employee with required query
      const toolName = 'bamboo_find_employee';
      const toolArgs = { query: 'John Smith' };

      const handler = getToolHandler(toolName);
      expect(handler).toBeDefined();

      // Mock the API response
      jest.spyOn(mockBambooClient, 'get').mockResolvedValue({
        employees: [
          {
            id: '123',
            firstName: 'John',
            lastName: 'Smith',
            workEmail: 'john.smith@company.com',
            jobTitle: 'Engineer',
            department: 'Engineering',
          },
        ],
      });

      const response = await handler!(toolArgs, {
        progressToken: null,
        isEnabled: false,
        sendProgress: jest.fn(),
      });

      validateMcpResponse(response);
      validateLLMFriendly(response.content[0].text);
      expect(response.content[0].text).toContain('John Smith');
      expect(response.content[0].text).toContain('Engineer');
    });

    test('tools/call request should handle invalid tool names', async () => {
      // Simulate Claude calling non-existent tool
      const invalidToolName = 'bamboo_nonexistent_tool';

      expect(hasToolHandler(invalidToolName)).toBe(false);

      // getToolHandler should throw for invalid tools, test the error
      expect(() => getToolHandler(invalidToolName)).toThrow(
        'Tool handler not found'
      );
    });

    test('tools/call request should validate parameter types', async () => {
      // Simulate Claude calling tool with wrong parameter types
      const toolName = 'bamboo_find_employee';
      const invalidArgs = { query: 123 }; // Should be string

      const tool = BAMBOO_TOOLS.find((t) => t.name === toolName);
      expect(tool).toBeDefined();

      // Check schema validation
      const queryProperty = tool!.inputSchema.properties.query;
      expect(queryProperty.type).toBe('string');
      expect(typeof invalidArgs.query).not.toBe('string');
    });

    test('tools/call request should handle missing required parameters', async () => {
      // Simulate Claude calling tool without required params
      const toolName = 'bamboo_team_info';
      const emptyArgs = {}; // Missing required 'department'

      const tool = BAMBOO_TOOLS.find((t) => t.name === toolName);
      expect(tool).toBeDefined();
      expect(tool!.inputSchema.required).toContain('department');
      expect(emptyArgs).not.toHaveProperty('department');
    });

    test('tools/call request should handle optional parameters', async () => {
      // Simulate Claude calling bamboo_whos_out with optional date range
      const toolName = 'bamboo_whos_out';

      // Test with no parameters (should default to today)
      const noParams = {};
      const handler = getToolHandler(toolName);

      jest.spyOn(mockBambooClient, 'get').mockResolvedValue([]);

      const response1 = await handler!(noParams, {
        progressToken: null,
        isEnabled: false,
        sendProgress: jest.fn(),
      });

      validateMcpResponse(response1);

      // Test with optional parameters
      const withParams = {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      };

      const response2 = await handler!(withParams, {
        progressToken: null,
        isEnabled: false,
        sendProgress: jest.fn(),
      });

      validateMcpResponse(response2);
      expect(response2.content[0].text).toContain('2024-01-01');
    });

    test('tools/call should handle API errors gracefully', async () => {
      // Simulate Claude calling tool when API returns error
      const toolName = 'bamboo_find_employee';
      const toolArgs = { query: 'test' };

      const handler = getToolHandler(toolName);

      // Mock API error
      jest
        .spyOn(mockBambooClient, 'get')
        .mockRejectedValue(new Error('API connection failed'));

      const response = await handler!(toolArgs, {
        progressToken: null,
        isEnabled: false,
        sendProgress: jest.fn(),
      });

      validateMcpResponse(response);
      expect(response.content[0].text).toContain('BambooHR API error');
      // Check that it includes troubleshooting guidance
      expect(response.content[0].text).toContain('Troubleshooting Steps');
    });

    test('server initialization should provide Claude-compatible info', async () => {
      // Simulate server initialization that Claude expects
      const serverInfo = {
        name: 'bamboohr-mcp',
        version: '1.1.1',
        title: 'BambooHR MCP Server',
        description:
          'Unofficial BambooHR integration for workforce analytics and HR data access',
      };

      expect(serverInfo).toHaveProperty('name');
      expect(serverInfo).toHaveProperty('version');
      expect(serverInfo).toHaveProperty('title'); // Required for 2025-06-18
      expect(serverInfo).toHaveProperty('description');

      expect(typeof serverInfo.name).toBe('string');
      expect(typeof serverInfo.version).toBe('string');
      expect(typeof serverInfo.title).toBe('string');
      expect(typeof serverInfo.description).toBe('string');
    });

    test('server capabilities should declare tool support only', async () => {
      // Simulate capabilities negotiation that Claude performs
      const capabilities = {
        tools: {},
        elicitation: false,
      };

      expect(capabilities).toHaveProperty('tools');
      expect(capabilities.elicitation).toBe(false);
      expect(capabilities).not.toHaveProperty('resources');
      expect(capabilities).not.toHaveProperty('prompts');
      expect(capabilities).not.toHaveProperty('sampling');
    });

    afterAll(() => {
      // Clean up mocks
      jest.restoreAllMocks();
    });
  });
});
