#!/usr/bin/env node

/**
 * BambooHR MCP Server (Unofficial Open Source)
 * Single file, agent-optimized, essential tools only
 *
 * This is an UNOFFICIAL, community-driven open source project.
 * NOT affiliated with, endorsed by, or connected to BambooHR LLC.
 * BambooHR® is a registered trademark of BambooHR LLC.
 *
 * Copyright (c) 2025 BambooHR MCP Contributors
 * Licensed under the MIT License - see LICENSE file for details
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { BambooClient } from './bamboo-client';
import {
  formatCustomReportResults,
  formatCustomReportsList,
  formatDatasetFields,
  formatDatasetsList,
  formatEmployeeList,
  formatErrorResponse,
  formatNetworkError,
  formatTimeOffRequests,
  formatWhosOutList,
  formatWorkforceAnalytics,
} from './formatters';
// Simple console logger for MCP compatibility
import type {
  BambooAnalyticsRequestPayload,
  BambooCustomReportItem,
  BambooDatasetRecord,
  BambooDatasetsResponse,
  BambooEmployee,
  BambooEmployeeDirectory,
  BambooFieldsResponse,
  BambooTimeOffRequest,
  BambooWhosOutEntry,
  CustomReportArgs,
  WorkforceAnalyticsArgs,
} from './types';

// All TypeScript interfaces moved to ./types.ts for better organization

// Simple console logger for MCP compatibility - logs to stderr to avoid interfering with stdio protocol
interface SimpleLogger {
  debug: (msg: string, ...args: unknown[]) => void;
  info: (msg: string, ...args: unknown[]) => void;
  warn: (msg: string, ...args: unknown[]) => void;
  error: (msg: string, ...args: unknown[]) => void;
  fatal: (msg: string, ...args: unknown[]) => void;
  child: (options?: Record<string, unknown>) => SimpleLogger;
}

const logger: SimpleLogger = {
  debug: (msg: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[DEBUG]', msg, ...args);
    }
  },
  info: (msg: string, ...args: unknown[]) =>
    console.error('[INFO]', msg, ...args),
  warn: (msg: string, ...args: unknown[]) =>
    console.error('[WARN]', msg, ...args),
  error: (msg: string, ...args: unknown[]) =>
    console.error('[ERROR]', msg, ...args),
  fatal: (msg: string, ...args: unknown[]) =>
    console.error('[FATAL]', msg, ...args),
  child: () => logger,
};

// Initialize BambooHR client configuration
const API_KEY = process.env.BAMBOO_API_KEY;
const SUBDOMAIN = process.env.BAMBOO_SUBDOMAIN;

if (!API_KEY || !SUBDOMAIN) {
  logger.fatal(
    'Missing required environment variables - BAMBOO_API_KEY:',
    !API_KEY,
    'BAMBOO_SUBDOMAIN:',
    !SUBDOMAIN
  );
  process.exit(1);
}

if (API_KEY.trim() === '' || SUBDOMAIN.trim() === '') {
  logger.fatal(
    'Environment variables cannot be empty - BAMBOO_API_KEY empty:',
    API_KEY.trim() === '',
    'BAMBOO_SUBDOMAIN empty:',
    SUBDOMAIN.trim() === ''
  );
  process.exit(1);
}

// Debug logging for authentication troubleshooting
logger.info('Debug - API_KEY length:', API_KEY.length, 'SUBDOMAIN:', SUBDOMAIN);
logger.info('Debug - API_KEY starts with:', API_KEY.substring(0, 10));
logger.info(
  'Debug - Base64 test:',
  Buffer.from(`${API_KEY}:x`).toString('base64').substring(0, 20)
);

// Create BambooHR HTTP client with environment configuration
const bambooClient = new BambooClient({
  apiKey: API_KEY,
  subdomain: SUBDOMAIN,
  // Optional: Use custom cache timeout from environment
  ...(process.env.CACHE_TIMEOUT_MS && {
    cacheTimeoutMs: parseInt(process.env.CACHE_TIMEOUT_MS, 10),
  }),
});

// Simple wrapper functions for backward compatibility
async function bambooGet(endpoint: string): Promise<unknown> {
  return bambooClient.get(endpoint);
}

async function bambooPost(endpoint: string, body: unknown): Promise<unknown> {
  return bambooClient.post(endpoint, body);
}

// Create MCP server
const server = new McpServer(
  { name: 'bamboohr-mcp', version: '1.0.0' },
  {
    capabilities: { tools: {} },
    instructions: `BambooHR MCP Server - Discovery-driven workforce analytics

Core Tools:
• bamboo_find_employee - Find employees by name/email/ID
• bamboo_whos_out - See who's on leave
• bamboo_team_info - Get department roster  
• bamboo_time_off_requests - View time-off requests

Discovery Tools (Use These First):
• bamboo_discover_datasets - See what datasets are available
• bamboo_discover_fields - See what fields are in each dataset

Analytics Tools:
• bamboo_workforce_analytics - Requires discovery first to get correct field names
• bamboo_run_custom_report - List and run pre-built custom reports

All tools are read-only. For analytics, always use discovery tools first to understand API structure.`,
  }
);

// Add missing MCP protocol methods - handled by the framework automatically

// Tool 1: Find Employee
server.tool(
  'bamboo_find_employee',
  'Find employee by name, email, or ID with support for partial name matches',
  {
    query: z
      .string()
      .describe(
        'Employee name, email, or ID to search for. Examples: "John Smith", "john.smith@company.com", "123"'
      ),
  },
  async (args: { query: string }) => {
    try {
      const query = args.query;

      logger.debug(
        'Employee search initiated, query length:',
        query?.length || 0
      );

      if (!query || typeof query !== 'string' || query.trim() === '') {
        logger.warn('Employee search failed - missing query parameter');
        return {
          content: [
            {
              type: 'text',
              text: 'Missing required parameter: query. Provide employee name, email, or ID to search for.',
            },
          ],
        };
      }

      const queryLower = query.toLowerCase();

      const employees = (await bambooGet(
        '/employees/directory?fields=id,firstName,lastName,workEmail,jobTitle,department'
      )) as BambooEmployeeDirectory;

      const found = employees.employees?.find(
        (emp: BambooEmployee) =>
          emp.firstName?.toLowerCase().includes(queryLower) ||
          emp.lastName?.toLowerCase().includes(queryLower) ||
          emp.workEmail?.toLowerCase().includes(queryLower) ||
          emp.id?.toString() === query
      );

      if (!found) {
        logger.info(
          'Employee search completed - no matches found for query:',
          query
        );
        return {
          content: [
            { type: 'text', text: `No employee found matching "${query}"` },
          ],
        };
      }

      const text = `**${found.firstName} ${found.lastName}**
Email: ${found.workEmail || 'Not available'}
Job Title: ${found.jobTitle || 'Not available'}
Department: ${found.department || 'Not available'}
Employee ID: ${found.id}`;

      logger.info(
        'Employee search completed successfully for:',
        `${found.firstName} ${found.lastName}`
      );

      return { content: [{ type: 'text', text }] };
    } catch (error) {
      logger.error(
        'Employee search failed with error:',
        error instanceof Error ? error.message : error
      );
      return formatErrorResponse(error, 'Employee search failed');
    }
  }
);

// Tool 2: Who's Out
server.tool(
  'bamboo_whos_out',
  'See who is out on leave today or in date range. Defaults to today if no dates provided.',
  {
    start_date: z
      .string()
      .optional()
      .describe(
        'Start date in YYYY-MM-DD format (optional, defaults to today). Example: "2024-01-15"'
      ),
    end_date: z
      .string()
      .optional()
      .describe(
        'End date in YYYY-MM-DD format (optional, defaults to start_date). Example: "2024-01-20"'
      ),
  },
  async (args: {
    start_date?: string | undefined;
    end_date?: string | undefined;
  }) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const start = args.start_date || today;
      const end = args.end_date || start;

      // TypeScript assertion - we know these are always strings due to fallback logic
      const startDate = start as string;
      const endDate = end as string;

      const calendar = (await bambooGet(
        `/time_off/whos_out?start=${startDate}&end=${endDate}`
      )) as { calendar?: BambooWhosOutEntry[] };

      const entries = calendar.calendar || [];
      const text = formatWhosOutList(entries, startDate, endDate);

      return { content: [{ type: 'text', text }] };
    } catch (error) {
      return formatErrorResponse(error, "Who's out calendar failed");
    }
  }
);

// Tool 3: Team Info
server.tool(
  'bamboo_team_info',
  'Get team/department roster with employee details including job titles and contact info',
  {
    department: z
      .string()
      .describe(
        'Department name to get roster for. Supports partial matching. Examples: "Engineering", "Product", "QA", "Sales"'
      ),
  },
  async (args: { department: string }) => {
    try {
      const department = args.department;
      if (
        !department ||
        typeof department !== 'string' ||
        department.trim() === ''
      ) {
        return {
          content: [
            {
              type: 'text',
              text: 'Missing required parameter: department. Provide department name to get team roster for.',
            },
          ],
        };
      }

      const employees = (await bambooGet(
        '/employees/directory?fields=firstName,lastName,workEmail,jobTitle,department'
      )) as BambooEmployeeDirectory;

      const teamMembers =
        employees.employees?.filter((emp: BambooEmployee) =>
          emp.department?.toLowerCase().includes(department.toLowerCase())
        ) || [];

      if (!teamMembers.length) {
        return {
          content: [
            {
              type: 'text',
              text: `No employees found in department "${department}"`,
            },
          ],
        };
      }

      const text = formatEmployeeList(teamMembers, `${department} Team`);

      return { content: [{ type: 'text', text }] };
    } catch (error) {
      return formatErrorResponse(error, 'Team info retrieval failed');
    }
  }
);

// Tool 4: Time Off Requests
server.tool(
  'bamboo_time_off_requests',
  'Get time-off requests for date range',
  {
    start_date: z
      .string()
      .describe('Start date in YYYY-MM-DD format (required)'),
    end_date: z.string().describe('End date in YYYY-MM-DD format (required)'),
    status: z
      .string()
      .optional()
      .describe(
        'Filter by request status (approved, denied, pending, all). Defaults to all'
      ),
  },
  async (args: {
    start_date: string;
    end_date: string;
    status?: string | undefined;
  }) => {
    try {
      const start_date = args.start_date;
      const end_date = args.end_date;
      const status = args.status;

      if (
        !start_date ||
        !end_date ||
        typeof start_date !== 'string' ||
        typeof end_date !== 'string'
      ) {
        return {
          content: [
            {
              type: 'text',
              text: 'Missing required parameters: start_date and end_date (YYYY-MM-DD format). Optional status filter: approved, denied, pending, all.',
            },
          ],
        };
      }

      let endpoint = `/time_off/requests?start=${start_date}&end=${end_date}`;
      if (status) {
        endpoint += `&status=${status}`;
      }

      const requests = (await bambooGet(endpoint)) as BambooTimeOffRequest[];

      const text = formatTimeOffRequests(requests || [], start_date, end_date);

      return { content: [{ type: 'text', text }] };
    } catch (error) {
      return formatErrorResponse(error, 'Time-off requests retrieval failed');
    }
  }
);

// Tool 5: Discover Available Datasets (Step 1)
server.tool(
  'bamboo_discover_datasets',
  'Discover what datasets are available in BambooHR for analytics',
  async () => {
    try {
      const datasets = (await bambooGet('/datasets')) as BambooDatasetsResponse;

      if (!datasets?.datasets?.length) {
        return {
          content: [
            {
              type: 'text',
              text: 'No datasets available or API not accessible',
            },
          ],
        };
      }

      const text = formatDatasetsList(datasets.datasets || []);

      return { content: [{ type: 'text', text }] };
    } catch (error) {
      return formatErrorResponse(error, 'Dataset discovery failed');
    }
  }
);

// Tool 6: Discover Dataset Fields (Step 2)
server.tool(
  'bamboo_discover_fields',
  'Discover what fields are available in a specific dataset for use in workforce analytics',
  {
    dataset_id: z
      .string()
      .describe(
        'Dataset ID to explore (use bamboo_discover_datasets first to get IDs). Examples: "employee", "time_off", "performance"'
      ),
  },
  async (args: { dataset_id: string }) => {
    try {
      const dataset_id = args.dataset_id;
      if (
        !dataset_id ||
        typeof dataset_id !== 'string' ||
        dataset_id.trim() === ''
      ) {
        return {
          content: [
            {
              type: 'text',
              text: 'Missing required parameter: dataset_id. Use bamboo_discover_datasets first to get available dataset IDs.',
            },
          ],
        };
      }

      const fields = (await bambooGet(
        `/datasets/${dataset_id}/fields`
      )) as BambooFieldsResponse;

      if (!fields?.fields?.length) {
        return {
          content: [
            {
              type: 'text',
              text: `No fields found for dataset: ${dataset_id}`,
            },
          ],
        };
      }

      const text = formatDatasetFields(fields.fields || [], dataset_id);

      return { content: [{ type: 'text', text }] };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `ERROR: Error discovering fields: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// Tool 7: Workforce Analytics (Step 3 - Enhanced with robust edge case handling)
server.tool(
  'bamboo_workforce_analytics',
  'Get workforce analytics data from BambooHR datasets - use discovery tools first to find correct dataset and field names',
  {
    dataset_id: z
      .string()
      .describe(
        'Dataset ID (use bamboo_discover_datasets to find available datasets)'
      ),
    fields: z
      .array(z.string())
      .describe(
        'Array of field names to retrieve (use bamboo_discover_fields to find available fields)'
      ),
    filters: z
      .array(
        z.object({
          field: z.string(),
          operator: z.string(),
          value: z.any(),
        })
      )
      .optional()
      .describe('Optional filters to apply to the data'),
    group_by: z
      .string()
      .optional()
      .describe('Optional field name to group results by'),
  },
  async (args: WorkforceAnalyticsArgs) => {
    try {
      const { dataset_id, fields, filters, group_by } = args;

      // Enhanced input validation
      if (
        !dataset_id ||
        !fields ||
        !Array.isArray(fields) ||
        fields.length === 0
      ) {
        return {
          content: [
            {
              type: 'text',
              text: `Discovery required first. To use workforce analytics:

1. Run \`bamboo_discover_datasets\` to see available datasets
2. Run \`bamboo_discover_fields\` with dataset ID to see available fields
3. Use this tool with dataset_id and fields from discovery

Example: {"dataset_id": "employee", "fields": ["department", "status"]}`,
            },
          ],
        };
      }

      // Validate filters if provided
      if (filters && !Array.isArray(filters)) {
        return {
          content: [
            {
              type: 'text',
              text: `ERROR: **Invalid Filters Format**

Filters must be an array of objects with 'field', 'operator', and 'value' properties.

**Example:**
\`{"filters": [{"field": "status", "operator": "equal", "value": "Active"}]}\``,
            },
          ],
        };
      }

      // Prepare API request payload with enhanced validation
      const requestPayload: BambooAnalyticsRequestPayload = {
        fields: fields.filter(
          (f) => typeof f === 'string' && f.trim().length > 0
        ),
      };

      if (requestPayload.fields.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `ERROR: **Invalid Fields**

At least one valid field name is required.

TIP: Use \`bamboo_discover_fields\` to see available field names for the dataset.`,
            },
          ],
        };
      }

      if (
        group_by &&
        typeof group_by === 'string' &&
        group_by.trim().length > 0
      ) {
        requestPayload.groupBy = [group_by.trim()];
      }

      if (filters && filters.length > 0) {
        // Validate filter structure
        const validFilters = filters.filter(
          (filter) =>
            filter &&
            typeof filter === 'object' &&
            typeof filter.field === 'string' &&
            typeof filter.operator === 'string' &&
            filter.value !== undefined
        );

        if (validFilters.length !== filters.length) {
          return {
            content: [
              {
                type: 'text',
                text: `ERROR: **Invalid Filter Structure**

Some filters are malformed. Each filter must have:
- \`field\`: string (field name)
- \`operator\`: string (e.g., "equal", "not_equal", "greater_than")
- \`value\`: any (value to filter by)

**Valid filters**: ${validFilters.length}/${filters.length}`,
              },
            ],
          };
        }

        requestPayload.filters = validFilters;
      }

      // Make the datasets API call using the client
      let data: unknown;
      try {
        data = await bambooPost(`/datasets/${dataset_id}`, requestPayload);
      } catch (networkError) {
        return formatNetworkError(networkError);
      }

      // Enhanced data validation and processing
      if (!data || typeof data !== 'object') {
        return {
          content: [
            {
              type: 'text',
              text: `ERROR: **Invalid Response Format**

Expected an object response but received: ${typeof data}

Raw response: ${JSON.stringify(data)}`,
            },
          ],
        };
      }

      // Handle various response structures from BambooHR
      let records: BambooDatasetRecord[] = [];
      if (Array.isArray(data)) {
        records = data;
      } else if (data && typeof data === 'object' && data !== null) {
        const dataObj = data as Record<string, unknown>;
        if (dataObj.data && Array.isArray(dataObj.data)) {
          records = dataObj.data;
        } else if (dataObj.records && Array.isArray(dataObj.records)) {
          records = dataObj.records;
        } else if (dataObj.result && Array.isArray(dataObj.result)) {
          records = dataObj.result;
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `ERROR: **Unexpected Response Structure**

Could not find data array in response. Available properties: ${Object.keys(dataObj).join(', ')}

Raw response: ${JSON.stringify(data, null, 2)}`,
              },
            ],
          };
        }
      }

      if (records.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `ANALYTICS: **No Records Found**

Dataset: ${dataset_id}
Fields: ${requestPayload.fields.join(', ')}
Filters: ${requestPayload.filters ? JSON.stringify(requestPayload.filters, null, 2) : 'None'}

TIP: **Possible reasons:**
- No data matches your filter criteria
- The dataset is empty
- Field names might not exist in this dataset
- Date ranges in filters might be outside available data

**Suggestions:**
- Try removing filters to see if data exists
- Use \`bamboo_discover_fields\` to verify field names
- Check if the dataset has any data at all`,
            },
          ],
        };
      }

      const text = formatWorkforceAnalytics(
        records,
        dataset_id,
        requestPayload.fields
      );
      return { content: [{ type: 'text', text }] };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `ERROR: **Unexpected Error**

${error instanceof Error ? error.message : 'Unknown error occurred'}

TIP: **Troubleshooting:**
- Use \`bamboo_discover_datasets\` to verify available datasets
- Use \`bamboo_discover_fields\` to verify field names
- Check that all parameters are correctly formatted
- Ensure your API key has sufficient permissions

**Stack trace** (if available): ${error instanceof Error && error.stack ? error.stack : 'Not available'}`,
          },
        ],
      };
    }
  }
);

// Tool 8: Custom Reports (Step 4 - Robust implementation)
server.tool(
  'bamboo_run_custom_report',
  'List available custom reports or run a specific report by ID with multiple output formats',
  {
    list_reports: z
      .boolean()
      .optional()
      .describe(
        'Set to true to list all available custom reports. Example: {"list_reports": true}'
      ),
    report_id: z
      .string()
      .optional()
      .describe(
        'ID of specific report to run (get from list_reports first). Example: {"report_id": "123"}'
      ),
    format: z
      .enum(['json', 'csv', 'pdf'])
      .optional()
      .describe(
        'Output format for the report (defaults to json). Example: {"report_id": "123", "format": "json"}'
      ),
  },
  async (args: CustomReportArgs) => {
    try {
      const report_id = args?.report_id;
      const list_reports = args?.list_reports;
      const format = args?.format;

      if (list_reports) {
        try {
          // List available reports with enhanced error handling
          const reports = await bambooGet('/custom-reports');

          // Enhanced response structure handling
          let reportList: BambooCustomReportItem[] = [];
          if (Array.isArray(reports)) {
            reportList = reports;
          } else if (reports && typeof reports === 'object') {
            const reportsObj = reports as Record<string, unknown>;
            reportList = (reportsObj.reports ||
              reportsObj.data ||
              reportsObj.results ||
              []) as BambooCustomReportItem[];
          }

          if (!Array.isArray(reportList)) {
            return {
              content: [
                {
                  type: 'text',
                  text: `REPORT: **Unexpected Reports Response Structure**\n\nReceived: ${typeof reportList}\nAvailable properties: ${reports && typeof reports === 'object' ? Object.keys(reports).join(', ') : 'None'}\n\nRaw response: ${JSON.stringify(reports, null, 2)}`,
                },
              ],
            };
          }

          const text = formatCustomReportsList(reportList);
          return { content: [{ type: 'text', text }] };
        } catch (error) {
          return {
            content: [
              {
                type: 'text',
                text: `ERROR: **Error Listing Reports**\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nTIP: **Troubleshooting:**\n- The custom reports endpoint might not be available\n- Your API key may lack report permissions\n- Your BambooHR plan might not include custom reports\n- There might be a temporary API issue\n\n**Suggestion:** Try again later or contact your BambooHR administrator.`,
              },
            ],
          };
        }
      }

      if (!report_id) {
        return {
          content: [
            {
              type: 'text',
              text: 'ERROR: **Missing Parameter**\n\nProvide either:\n- `{"list_reports": true}` - to see available reports\n- `{"report_id": "123"}` - to run report ID 123\n- `{"report_id": "123", "format": "json"}` - to run report with specific format\n\nTIP: **Workflow:**\n1. First use `{"list_reports": true}` to see available reports\n2. Then use the report ID from the list to run a specific report',
            },
          ],
        };
      }

      try {
        // Run specific report with enhanced error handling
        let reportData: unknown;
        try {
          reportData = await bambooGet(
            `/custom-reports/${report_id}${format ? `?format=${format}` : ''}`
          );
        } catch (apiError) {
          return {
            content: [
              {
                type: 'text',
                text: `ERROR: **Report API Error**\n\n${apiError instanceof Error ? apiError.message : 'Unknown API error'}\n\nTIP: **Common Issues:**\n- **404**: Report ID "${report_id}" not found\n- **403**: No permission to access this report\n- **400**: Invalid report ID format\n- **500**: Report generation failed\n\n**Suggestions:**\n- Use \`{"list_reports": true}\` to verify available reports\n- Check that the report ID is correct\n- Ensure your API key has report permissions`,
              },
            ],
          };
        }

        if (!reportData) {
          return {
            content: [
              {
                type: 'text',
                text: `ERROR: **Empty Report Response**\n\nReport ID: ${report_id}\n\nThe API returned an empty response. This could indicate:\n- The report exists but has no data\n- The report is still being generated\n- There's a temporary API issue\n\nTIP: Try again in a few moments or use \`{"list_reports": true}\` to verify the report exists.`,
              },
            ],
          };
        }

        const text = formatCustomReportResults(reportData, report_id);

        return { content: [{ type: 'text', text }] };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `ERROR: **Unexpected Error Running Report**\n\nReport ID: ${report_id}\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nTIP: **Troubleshooting:**\n- Verify the report ID exists using \`{"list_reports": true}\`\n- Check your API key permissions\n- Try a different output format (json, csv, pdf)\n- Contact your BambooHR administrator if the issue persists\n\n**Stack trace** (if available): ${error instanceof Error && error.stack ? error.stack : 'Not available'}`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `ERROR: General error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
      };
    }
  }
);

// Note: Department Insights removed - use bamboo_workforce_analytics with proper discovery instead

// Start server
async function main() {
  try {
    // Starting BambooHR MCP Server
    // Connected to BambooHR API

    // Don't test connection on startup - let it fail gracefully when tools are used
    // This allows the server to start even with invalid credentials

    const transport = new StdioServerTransport();
    logger.debug('Connecting server to transport');
    await server.connect(transport);
    logger.info('MCP server connected successfully and ready for requests');

    // Server ready for MCP connections
  } catch (error) {
    logger.fatal(
      'Failed to start MCP server:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  bambooClient.clearCache();
  process.exit(0);
});

// Log any unhandled errors
process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught exception occurred:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal(
    'Unhandled promise rejection:',
    reason instanceof Error ? reason.message : reason
  );
  process.exit(1);
});

// Run
logger.info('Starting BambooHR MCP server, PID:', process.pid);

main().catch((error) => {
  logger.fatal(
    'Main function failed to start:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
