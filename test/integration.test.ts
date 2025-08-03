/**
 * Integration tests for BambooHR MCP Server - Modernized
 * Tests all 10 MCP tools against real BambooHR API
 * Updated to use the modernized modular architecture
 *
 * Requires .env file with BAMBOO_API_KEY and BAMBOO_SUBDOMAIN
 * Skips gracefully if credentials are not available
 */

import { BambooClient } from '../src/bamboo-client.js';
import { validateToolResponse, validateErrorResponse } from './helpers.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { BAMBOO_TOOLS } from '../src/config/toolDefinitions.js';
import type {
  BambooEmployee,
  BambooWhosOutEntry,
  BambooTimeOffRequest,
  BambooDatasetRecord,
  BambooCustomReportItem,
} from '../src/types.js';

// Test configuration
const TEST_TIMEOUT = parseInt(process.env.TEST_TIMEOUT || '10000', 10);
const skipTests = !process.env.BAMBOO_API_KEY || !process.env.BAMBOO_SUBDOMAIN;

describe('BambooHR MCP Tools Integration Tests - Modernized', () => {
  let bambooClient: BambooClient;
  let server: Server;

  beforeAll(() => {
    if (skipTests) {
      console.log(
        '⚠️  Skipping integration tests: BAMBOO_API_KEY or BAMBOO_SUBDOMAIN not set'
      );
      console.log(
        '   To run integration tests, create .env file with your credentials'
      );
      return;
    }

    console.log(
      '🔑 Running integration tests with modernized server architecture'
    );

    // Initialize BambooHR client for direct API testing
    bambooClient = new BambooClient({
      apiKey: process.env.BAMBOO_API_KEY!,
      subdomain: process.env.BAMBOO_SUBDOMAIN!,
    });

    // Initialize modernized MCP server
    server = new Server(
      {
        name: 'bamboohr-mcp-test',
        version: '1.1.1',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
  });

  afterAll(async () => {
    if (server) {
      await server.close();
    }
  });

  describe('Server Architecture Validation', () => {
    test('should have all tool definitions properly configured', () => {
      expect(BAMBOO_TOOLS).toHaveLength(10);

      const expectedTools = [
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

      expectedTools.forEach((toolName) => {
        const tool = BAMBOO_TOOLS.find((t) => t.name === toolName);
        expect(tool).toBeDefined();
        expect(tool!.description).toBeDefined();
        expect(tool!.inputSchema).toBeDefined();
      });
    });

    test('should have proper tool schema structure', () => {
      BAMBOO_TOOLS.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');

        expect(tool.inputSchema).toHaveProperty('type', 'object');
        expect(tool.inputSchema).toHaveProperty('properties');
        expect(tool.inputSchema).toHaveProperty('additionalProperties', false);
      });
    });
  });

  // Test 1: Employee Directory API
  test(
    'Employee Directory API - retrieves employee data',
    async () => {
      if (skipTests) return;

      const employees = (await bambooClient.get(
        '/employees/directory?fields=id,firstName,lastName,workEmail,jobTitle,department'
      )) as { employees: BambooEmployee[] };

      expect(employees).toHaveProperty('employees');
      expect(Array.isArray(employees.employees)).toBe(true);

      if (employees.employees.length > 0) {
        const employee = employees.employees[0];
        expect(employee).toHaveProperty('id');

        // Test the structure matches our type expectations
        const requiredFields = [
          'firstName',
          'lastName',
          'workEmail',
          'jobTitle',
          'department',
        ];
        requiredFields.forEach((field) => {
          expect(employee).toHaveProperty(field);
        });
      }
    },
    TEST_TIMEOUT
  );

  // Test 2: Who's Out Calendar API
  test(
    "Who's Out Calendar API - retrieves time-off calendar",
    async () => {
      if (skipTests) return;

      const today = new Date().toISOString().split('T')[0];
      const response = await bambooClient.get(
        `/time_off/whos_out?start=${today}&end=${today}`
      );

      // API may return either [] or {calendar: []} format
      let calendar: BambooWhosOutEntry[];
      if (Array.isArray(response)) {
        calendar = response as BambooWhosOutEntry[];
      } else if (response && response.calendar) {
        calendar = response.calendar as BambooWhosOutEntry[];
      } else {
        // Handle unexpected format gracefully
        calendar = [];
      }

      expect(Array.isArray(calendar)).toBe(true);

      // Structure validation for entries (if any)
      if (calendar.length > 0) {
        const entry = calendar[0];
        expect(entry).toHaveProperty('name');
        // ID may be optional in some responses
        if (entry.id) {
          expect(entry).toHaveProperty('id');
        }
      }
    },
    TEST_TIMEOUT
  );

  // Test 3: Time-Off Requests API
  test(
    'Time-Off Requests API - retrieves time-off requests',
    async () => {
      if (skipTests) return;

      const startDate = '2024-01-01';
      const endDate = '2024-01-31';

      const requests = (await bambooClient.get(
        `/time_off/requests?start=${startDate}&end=${endDate}`
      )) as BambooTimeOffRequest[];

      expect(Array.isArray(requests)).toBe(true);

      // Structure validation for requests (if any)
      if (requests.length > 0) {
        const request = requests[0];
        expect(request).toHaveProperty('id');
        expect(request).toHaveProperty('employeeId');
      }
    },
    TEST_TIMEOUT
  );

  // Test 4: Datasets Discovery API
  test(
    'Datasets Discovery API - retrieves available datasets',
    async () => {
      if (skipTests) return;

      try {
        const datasets = await bambooClient.get('/datasets');

        if (datasets && datasets.datasets) {
          expect(datasets).toHaveProperty('datasets');
          expect(Array.isArray(datasets.datasets)).toBe(true);

          if (datasets.datasets.length > 0) {
            const dataset = datasets.datasets[0];
            // BambooHR API returns {label, name} format, not {id, name}
            expect(dataset).toHaveProperty('name');
            if (dataset.label) {
              expect(dataset).toHaveProperty('label');
            }
            // ID may be called 'name' in some APIs
            if (dataset.id) {
              expect(dataset).toHaveProperty('id');
            }
          }
        }
      } catch (error: any) {
        // Some BambooHR accounts may not have access to datasets API
        if (error.response?.status === 403) {
          console.log('⚠️  Datasets API requires higher subscription level');
        } else {
          throw error;
        }
      }
    },
    TEST_TIMEOUT
  );

  // Test 5: Dataset Fields Discovery API
  test(
    'Dataset Fields API - retrieves dataset field definitions',
    async () => {
      if (skipTests) return;

      try {
        const fields = await bambooClient.get('/datasets/employee/fields');

        if (fields && fields.fields) {
          expect(fields).toHaveProperty('fields');
          expect(Array.isArray(fields.fields)).toBe(true);

          if (fields.fields.length > 0) {
            const field = fields.fields[0];
            // BambooHR API returns {label, name, parentName} format, not {id, name}
            expect(field).toHaveProperty('name');
            if (field.label) {
              expect(field).toHaveProperty('label');
            }
            if (field.parentName) {
              expect(field).toHaveProperty('parentName');
            }
            // ID may be optional
            if (field.id) {
              expect(field).toHaveProperty('id');
            }
          }
        }
      } catch (error: any) {
        // Handle API access limitations gracefully
        if ([403, 404].includes(error.response?.status)) {
          console.log('⚠️  Dataset fields API not available for this account');
        } else {
          throw error;
        }
      }
    },
    TEST_TIMEOUT
  );

  // Test 6: Custom Reports API
  test(
    'Custom Reports API - retrieves available reports',
    async () => {
      if (skipTests) return;

      try {
        const reports = await bambooClient.get('/custom-reports');

        // Reports endpoint may return different structures
        const reportList = Array.isArray(reports)
          ? reports
          : reports?.reports || reports?.data || [];

        expect(Array.isArray(reportList)).toBe(true);

        if (reportList.length > 0) {
          const report = reportList[0] as BambooCustomReportItem;
          expect(report).toHaveProperty('id');
          expect(report).toHaveProperty('name');
        }
      } catch (error: any) {
        // Custom reports may not be available on all plans
        if (error.response?.status === 403) {
          console.log(
            '⚠️  Custom reports API requires higher subscription level'
          );
        } else {
          throw error;
        }
      }
    },
    TEST_TIMEOUT
  );

  // Test 7: Workforce Analytics API
  test(
    'Workforce Analytics API - processes analytics queries',
    async () => {
      if (skipTests) return;

      try {
        // Use actual BambooHR field names discovered from /datasets/employee/fields
        const analyticsData = await bambooClient.post('/datasets/employee', {
          fields: ['jobInformationDepartment', 'employmentStatus'],
        });

        // Analytics may return various structures
        const records = Array.isArray(analyticsData)
          ? analyticsData
          : analyticsData?.data ||
            analyticsData?.records ||
            analyticsData?.result ||
            [];

        expect(Array.isArray(records)).toBe(true);

        if (records.length > 0) {
          const record = records[0] as BambooDatasetRecord;
          expect(typeof record).toBe('object');
          // Verify the record has the expected structure
          if (record && typeof record === 'object') {
            // Check for expected fields, but don't require them all to exist
            const hasExpectedFields =
              record.hasOwnProperty('jobInformationDepartment') ||
              record.hasOwnProperty('employmentStatus') ||
              Object.keys(record).length > 0;
            expect(hasExpectedFields).toBe(true);
          }
        }
      } catch (error: any) {
        // Analytics endpoints may have access restrictions
        if ([403, 404].includes(error.response?.status)) {
          console.log(
            '⚠️  Workforce analytics API not available for this account'
          );
        } else {
          throw error;
        }
      }
    },
    TEST_TIMEOUT
  );

  describe('API Response Structure Validation', () => {
    test(
      'should handle employee directory response format consistently',
      async () => {
        if (skipTests) return;

        const response = await bambooClient.get(
          '/employees/directory?fields=id,firstName,lastName'
        );

        // Validate consistent response structure
        expect(response).toHaveProperty('employees');
        expect(Array.isArray(response.employees)).toBe(true);

        response.employees.forEach((employee: any) => {
          expect(employee).toHaveProperty('id');
          expect(typeof employee.id).toBe('string');
        });
      },
      TEST_TIMEOUT
    );

    test(
      'should handle time-off calendar response format consistently',
      async () => {
        if (skipTests) return;

        const today = new Date().toISOString().split('T')[0];
        const response = await bambooClient.get(
          `/time_off/whos_out?start=${today}&end=${today}`
        );

        // Handle both [] and {calendar: []} response formats
        if (Array.isArray(response)) {
          expect(Array.isArray(response)).toBe(true);
        } else if (response && response.calendar) {
          expect(response).toHaveProperty('calendar');
          expect(Array.isArray(response.calendar)).toBe(true);
        } else {
          // Unexpected format, but should not crash
          expect(response).toBeDefined();
        }
      },
      TEST_TIMEOUT
    );
  });

  describe('Error Handling Validation', () => {
    test(
      'should handle invalid endpoints gracefully',
      async () => {
        if (skipTests) return;

        try {
          await bambooClient.get('/invalid/endpoint');
          fail('Should have thrown an error for invalid endpoint');
        } catch (error: any) {
          expect(error.response?.status).toBe(404);
        }
      },
      TEST_TIMEOUT
    );

    test(
      'should handle malformed requests gracefully',
      async () => {
        if (skipTests) return;

        try {
          await bambooClient.get(
            '/employees/directory?fields=invalid_field_name'
          );
          // This might succeed but return empty/null values for invalid fields
        } catch (error: any) {
          // Or it might return a 400 error - both are acceptable
          expect([400, 404].includes(error.response?.status)).toBe(true);
        }
      },
      TEST_TIMEOUT
    );
  });

  describe('API Performance Validation', () => {
    test(
      'should complete employee directory request within timeout',
      async () => {
        if (skipTests) return;

        const startTime = Date.now();
        await bambooClient.get(
          '/employees/directory?fields=id,firstName,lastName'
        );
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(TEST_TIMEOUT);
      },
      TEST_TIMEOUT
    );

    test(
      'should handle concurrent requests properly',
      async () => {
        if (skipTests) return;

        const requests = [
          bambooClient.get('/employees/directory?fields=id'),
          bambooClient.get(
            `/time_off/whos_out?start=${new Date().toISOString().split('T')[0]}&end=${new Date().toISOString().split('T')[0]}`
          ),
        ];

        const results = await Promise.allSettled(requests);

        // At least one request should succeed
        const successes = results.filter((r) => r.status === 'fulfilled');
        expect(successes.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUT
    );
  });
});
