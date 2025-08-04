/**
 * MCP Tool Execution Integration Tests - Modernized
 * Tests actual MCP tool handlers with real BambooHR API calls
 * Updated to use the modernized modular architecture
 */

import { BambooClient } from '../src/bamboo-client.js';
import { validateToolResponse, validateErrorResponse } from './helpers.js';
// Initialize domain-specific handlers
import { initializeEmployeeHandlers } from '../src/handlers/employeeHandlers.js';
import { initializeTimeOffHandlers } from '../src/handlers/timeOffHandlers.js';
import { initializeDatasetHandlers } from '../src/handlers/datasetHandlers.js';
import { initializeWorkforceAnalyticsHandlers } from '../src/handlers/workforceAnalyticsHandlers.js';
import { initializeReportHandlers } from '../src/handlers/reportHandlers.js';
import { initializeOrganizationHandlers } from '../src/handlers/organizationHandlers.js';
import {
  getToolHandler,
  initializeToolRouter,
} from '../src/config/toolRouter.js';
import { createProgressContext } from '../src/utils/progressTracker.js';
import * as formatters from '../src/formatters.js';

// Test configuration
const TEST_TIMEOUT = parseInt(process.env.TEST_TIMEOUT || '15000', 10);
const skipTests = !process.env.BAMBOO_API_KEY || !process.env.BAMBOO_SUBDOMAIN;

// Mock progress context for testing
const createMockProgressContext = (enabled = false) => ({
  progressToken: enabled ? 'test-token' : null,
  isEnabled: enabled,
  sendProgress: jest.fn().mockResolvedValue(undefined),
});

// Helper to safely get tool handlers with type checking
const getHandlerSafely = (toolName: string) => {
  const handler = getToolHandler(toolName);
  expect(handler).toBeDefined();
  return handler!; // Non-null assertion after check
};

describe('MCP Tool Execution Integration Tests - Modernized', () => {
  let bambooClient: BambooClient;
  let bambooGet: (endpoint: string) => Promise<any>;
  let bambooPost: (endpoint: string, body: any) => Promise<any>;

  beforeAll(() => {
    if (skipTests) {
      console.log(
        '⚠️  Skipping tool execution tests: BAMBOO_API_KEY or BAMBOO_SUBDOMAIN not set'
      );
      console.log(
        '   To run tool execution tests, create .env file with your credentials'
      );
      return;
    }

    console.log(
      '🛠️  Running MCP tool execution tests with modernized handlers'
    );

    // Initialize BambooHR client
    bambooClient = new BambooClient({
      apiKey: process.env.BAMBOO_API_KEY!,
      subdomain: process.env.BAMBOO_SUBDOMAIN!,
    });

    // Create wrapper functions
    bambooGet = (endpoint: string) => bambooClient.get(endpoint);
    bambooPost = (endpoint: string, body: any) =>
      bambooClient.post(endpoint, body);

    // Initialize domain-specific handlers with dependencies
    const handlerDependencies = {
      bambooClient,
      formatters,
      logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        fatal: jest.fn(),
        child: () => ({
          debug: jest.fn(),
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
        }),
      },
    };

    initializeEmployeeHandlers(handlerDependencies);
    initializeTimeOffHandlers(handlerDependencies);
    initializeDatasetHandlers(handlerDependencies);
    initializeWorkforceAnalyticsHandlers(handlerDependencies);
    initializeReportHandlers(handlerDependencies);
    initializeOrganizationHandlers(handlerDependencies);

    // Initialize tool router with real handlers
    initializeToolRouter();
  });

  describe('Tool Handler Execution', () => {
    test(
      'bamboo_find_employee - should find employee by name',
      async () => {
        if (skipTests) return;

        const handler = getHandlerSafely('bamboo_find_employee');
        const progressContext = createMockProgressContext(true);
        const result = await handler({ query: 'test' }, progressContext);

        validateToolResponse(result);
        expect(result.content).toBeDefined();
        expect(result.content[0]).toHaveProperty('type', 'text');
        expect(result.content[0]).toHaveProperty('text');

        // Verify progress tracking was called
        expect(progressContext.sendProgress).toHaveBeenCalled();
      },
      TEST_TIMEOUT
    );

    test('bamboo_find_employee - should handle missing query', async () => {
      if (skipTests) return;

      const handler = getHandlerSafely('bamboo_find_employee');
      const progressContext = createMockProgressContext();

      const result = await handler({}, progressContext);

      expect(result.content[0].text).toContain(
        'Missing required parameter: query'
      );
    });

    test(
      "bamboo_whos_out - should get who's out today",
      async () => {
        if (skipTests) return;

        const handler = getHandlerSafely('bamboo_whos_out');
        const progressContext = createMockProgressContext();

        const result = await handler({}, progressContext);

        validateToolResponse(result);
        expect(result.content[0].text).toMatch(/Who's Out/);
      },
      TEST_TIMEOUT
    );

    test(
      'bamboo_whos_out - should handle date range',
      async () => {
        if (skipTests) return;

        const handler = getHandlerSafely('bamboo_whos_out');
        const progressContext = createMockProgressContext();

        const result = await handler(
          {
            start_date: '2024-01-01',
            end_date: '2024-01-07',
          },
          progressContext
        );

        validateToolResponse(result);
        expect(result.content[0].text).toMatch(/2024-01-01.*2024-01-07/);
      },
      TEST_TIMEOUT
    );

    test(
      'bamboo_team_info - should get team roster',
      async () => {
        if (skipTests) return;

        const handler = getHandlerSafely('bamboo_team_info');
        const progressContext = createMockProgressContext();

        const result = await handler(
          { department: 'Engineering' },
          progressContext
        );

        validateToolResponse(result);
        expect(result.content[0].text).toMatch(
          /Engineering Team|No employees found/
        );
      },
      TEST_TIMEOUT
    );

    test('bamboo_team_info - should handle missing department', async () => {
      if (skipTests) return;

      const handler = getHandlerSafely('bamboo_team_info');
      const progressContext = createMockProgressContext();

      const result = await handler({}, progressContext);

      expect(result.content[0].text).toContain(
        'Missing required parameter: department'
      );
    });

    test(
      'bamboo_time_off_requests - should get time off requests',
      async () => {
        if (skipTests) return;

        const handler = getHandlerSafely('bamboo_time_off_requests');
        const progressContext = createMockProgressContext();

        const result = await handler(
          {
            start_date: '2024-01-01',
            end_date: '2024-01-31',
          },
          progressContext
        );

        validateToolResponse(result);
        expect(result.content[0].text).toMatch(/Time-Off Requests/);
      },
      TEST_TIMEOUT
    );

    test('bamboo_time_off_requests - should handle missing dates', async () => {
      if (skipTests) return;

      const handler = getHandlerSafely('bamboo_time_off_requests');
      const progressContext = createMockProgressContext();

      const result = await handler({}, progressContext);

      expect(result.content[0].text).toContain(
        'Missing required parameters: start_date and end_date'
      );
    });

    test(
      'bamboo_discover_datasets - should list available datasets',
      async () => {
        if (skipTests) return;

        const handler = getHandlerSafely('bamboo_discover_datasets');
        const progressContext = createMockProgressContext(true);

        const result = await handler({}, progressContext);

        validateToolResponse(result);
        expect(result.content[0].text).toMatch(
          /Available Datasets|No datasets available/
        );

        // Verify progress tracking
        expect(progressContext.sendProgress).toHaveBeenCalled();
      },
      TEST_TIMEOUT
    );

    test(
      'bamboo_discover_fields - should discover dataset fields',
      async () => {
        if (skipTests) return;

        const handler = getHandlerSafely('bamboo_discover_fields');
        const progressContext = createMockProgressContext();

        const result = await handler(
          { dataset_id: 'employee' },
          progressContext
        );

        validateToolResponse(result);
        expect(result.content[0].text).toMatch(
          /Dataset Fields|No fields found|Fields in Dataset/
        );
      },
      TEST_TIMEOUT
    );

    test('bamboo_discover_fields - should handle missing dataset_id', async () => {
      if (skipTests) return;

      const handler = getHandlerSafely('bamboo_discover_fields');
      const progressContext = createMockProgressContext();

      const result = await handler({}, progressContext);

      expect(result.content[0].text).toContain(
        'Missing required parameter: dataset_id'
      );
    });

    test('bamboo_workforce_analytics - should handle missing parameters', async () => {
      if (skipTests) return;

      const handler = getHandlerSafely('bamboo_workforce_analytics');
      const progressContext = createMockProgressContext();

      const result = await handler({}, progressContext);

      expect(result.content[0].text).toContain('Discovery required first');
      expect(result.content[0].text).toContain('bamboo_discover_datasets');
    });

    test(
      'bamboo_workforce_analytics - should process valid request',
      async () => {
        if (skipTests) return;

        const handler = getHandlerSafely('bamboo_workforce_analytics');
        const progressContext = createMockProgressContext(true);

        const result = await handler(
          {
            dataset_id: 'employee',
            fields: ['department', 'status'],
          },
          progressContext
        );

        // Should either return data or a structured error
        validateToolResponse(result);
        expect(result.content[0].text).toMatch(
          /ANALYTICS|ERROR|Invalid parameters|BambooHR/
        );

        // Verify stepped progress was used
        expect(progressContext.sendProgress).toHaveBeenCalled();
      },
      TEST_TIMEOUT
    );

    test(
      'bamboo_run_custom_report - should list reports',
      async () => {
        if (skipTests) return;

        const handler = getHandlerSafely('bamboo_run_custom_report');
        const progressContext = createMockProgressContext();

        const result = await handler({ list_reports: true }, progressContext);

        validateToolResponse(result);
        expect(result.content[0].text).toMatch(
          /Available Custom Reports|ERROR|No Custom Reports/
        );
      },
      TEST_TIMEOUT
    );

    test('bamboo_run_custom_report - should handle missing parameters', async () => {
      if (skipTests) return;

      const handler = getHandlerSafely('bamboo_run_custom_report');
      const progressContext = createMockProgressContext();

      const result = await handler({}, progressContext);

      expect(result.content[0].text).toContain('Missing Parameter');
      expect(result.content[0].text).toContain('list_reports');
    });

    test('bamboo_get_employee_photo - should generate photo URL', async () => {
      if (skipTests) return;

      const handler = getHandlerSafely('bamboo_get_employee_photo');
      const progressContext = createMockProgressContext();

      const result = await handler({ employee_id: '123' }, progressContext);

      validateToolResponse(result);
      expect(result.content[0].text).toContain('Employee Photo URL');
      expect(result.content[0].text).toContain('/employees/123/photo');
    });

    test('bamboo_get_employee_photo - should handle missing employee_id', async () => {
      if (skipTests) return;

      const handler = getHandlerSafely('bamboo_get_employee_photo');
      const progressContext = createMockProgressContext();

      const result = await handler({}, progressContext);

      expect(result.content[0].text).toContain(
        'Missing required parameter: employee_id'
      );
    });

    test('bamboo_get_employee_photo - should handle photo not found when return_base64 is true', async () => {
      if (skipTests) return;

      const handler = getHandlerSafely('bamboo_get_employee_photo');
      const progressContext = createMockProgressContext();

      const result = await handler(
        { employee_id: '123', return_base64: true },
        progressContext
      );

      validateToolResponse(result);
      // Since employee ID "123" likely doesn't have a photo in the test environment,
      // we should expect an error response about photo not found
      expect(result.content[0].text).toContain('Employee Photo Not Found');
      expect(result.content[0].text).toContain(
        'either does not exist or has no photo uploaded'
      );
      expect(result.content[0].text).toContain('Troubleshooting Steps');
    });

    test(
      'bamboo_list_departments - should list departments',
      async () => {
        if (skipTests) return;

        const handler = getHandlerSafely('bamboo_list_departments');
        const progressContext = createMockProgressContext(true);

        const result = await handler({}, progressContext);

        validateToolResponse(result);
        expect(result.content[0].text).toMatch(
          /Available Departments|No departments found|Could not retrieve/
        );

        // Verify progress tracking
        expect(progressContext.sendProgress).toHaveBeenCalled();
      },
      TEST_TIMEOUT
    );
  });

  describe('Progress Tracking Integration', () => {
    test(
      'should handle progress notifications correctly',
      async () => {
        if (skipTests) return;

        const handler = getHandlerSafely('bamboo_find_employee');
        const progressContext = createMockProgressContext(true);

        await handler({ query: 'test' }, progressContext);

        // Verify progress was sent with expected parameters
        expect(progressContext.sendProgress).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Number),
          expect.any(String)
        );
      },
      TEST_TIMEOUT
    );

    test(
      'should work without progress tracking',
      async () => {
        if (skipTests) return;

        const handler = getHandlerSafely('bamboo_find_employee');
        const progressContext = createMockProgressContext(false);

        const result = await handler({ query: 'test' }, progressContext);

        validateToolResponse(result);
        expect(progressContext.sendProgress).not.toHaveBeenCalled();
      },
      TEST_TIMEOUT
    );
  });

  describe('Error Handling', () => {
    test(
      'should handle API errors gracefully',
      async () => {
        if (skipTests) return;

        // Test with invalid dataset to trigger error
        const handler = getHandlerSafely('bamboo_discover_fields');
        const progressContext = createMockProgressContext();

        const result = await handler(
          { dataset_id: 'invalid_dataset_12345' },
          progressContext
        );

        // Should return error response but not crash
        expect(result.content).toBeDefined();
        expect(result.content[0]).toHaveProperty('text');
      },
      TEST_TIMEOUT
    );
  });
});
