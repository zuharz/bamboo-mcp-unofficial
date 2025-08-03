/**
 * BambooHR tool handlers with 2025-06-18 compliance features
 * Complete implementation of all analytics tools
 */

import type { BambooClient } from '../bamboo-client.js';
import * as formatters from '../formatters.js';

// Import dependencies (will be passed via DI)
let bambooClient: BambooClient;
let logger: any;

export function initializeHandlers(dependencies: {
  bambooClient: BambooClient;
  formatters: any;
  logger: any;
}): boolean {
  bambooClient = dependencies.bambooClient;
  logger = dependencies.logger;
  return true;
}

// Core HR Tools with enhanced structured outputs

export async function handleFindEmployee(args: any, context: any = {}) {
  try {
    const query = args.query;
    // Support both direct progressToken and _meta.progressToken
    const progressToken = context.progressToken || context._meta?.progressToken;

    // Create progress tracker
    const sendProgress = async (
      progress: number,
      total: number,
      message: string
    ) => {
      if (progressToken) {
        logger.debug(`Progress ${progress}/${total}: ${message}`);
      }
      // Also call the mock function if present and enabled (for testing)
      if (context.sendProgress && context.isEnabled) {
        await context.sendProgress(progress, total, message);
      }
    };

    await sendProgress(10, 100, 'Validating search query');

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

    await sendProgress(50, 100, 'Searching employee directory');

    const queryLower = query.toLowerCase();
    const employees = await bambooClient.get(
      '/employees/directory?fields=id,firstName,lastName,workEmail,jobTitle,department'
    );

    await sendProgress(90, 100, 'Processing search results');

    const found = (employees as any).employees?.find((emp: any) => {
      // Direct field matches
      if (
        emp.firstName?.toLowerCase().includes(queryLower) ||
        emp.lastName?.toLowerCase().includes(queryLower) ||
        emp.workEmail?.toLowerCase().includes(queryLower) ||
        emp.id?.toString() === query
      ) {
        return true;
      }

      // Full name search - check if query matches "firstName lastName"
      if (emp.firstName && emp.lastName) {
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        if (fullName.includes(queryLower)) {
          return true;
        }
      }

      return false;
    });

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

    await sendProgress(100, 100, 'Employee search completed');

    logger.info(
      'Employee search completed successfully for:',
      `${found.firstName} ${found.lastName}`
    );

    // Enhanced response with structured output (2025-06-18 compliance)
    const response = {
      content: [
        {
          type: 'text',
          text,
          _meta: {
            confidence: 1.0,
            timestamp: new Date().toISOString(),
            employeeId: found.id,
          },
        },
      ],
    };

    // Add resource links if employee photo is available
    if (found.id) {
      (response as any)._links = {
        related: [
          {
            href: `employee://${found.id}/photo`,
            title: 'Employee Photo',
            rel: 'photo',
          },
        ],
      };
    }

    return response;
  } catch (error) {
    logger.error(
      'Employee search failed with error:',
      error instanceof Error ? error.message : error
    );
    return formatters.formatErrorResponse(error, 'Employee search failed');
  }
}

export async function handleWhosOut(args: any, _context: any = {}) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const start = args.start_date || today;
    const end = args.end_date || start;

    const startDate = start;
    const endDate = end;

    const calendar = await bambooClient.get(
      `/time_off/whos_out?start=${startDate}&end=${endDate}`
    );

    const entries = (calendar as any).calendar || [];
    const text = formatters.formatWhosOutList(entries, startDate, endDate);

    return {
      content: [
        {
          type: 'text',
          text,
          _meta: {
            dateRange: { start: startDate, end: endDate },
            entryCount: entries.length,
            timestamp: new Date().toISOString(),
          },
        },
      ],
    };
  } catch (error) {
    return formatters.formatErrorResponse(error, "Who's out calendar failed");
  }
}

export async function handleTeamInfo(args: any, _context: any = {}) {
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

    const employees = await bambooClient.get(
      '/employees/directory?fields=firstName,lastName,workEmail,jobTitle,department'
    );

    const teamMembers =
      (employees as any).employees?.filter((emp: any) =>
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

    const text = formatters.formatEmployeeList(
      teamMembers,
      `${department} Team`
    );

    return {
      content: [
        {
          type: 'text',
          text,
          _meta: {
            department,
            employeeCount: teamMembers.length,
            timestamp: new Date().toISOString(),
          },
        },
      ],
    };
  } catch (error) {
    return formatters.formatErrorResponse(error, 'Team info retrieval failed');
  }
}

export async function handleTimeOffRequests(args: any, _context: any = {}) {
  try {
    const { start_date, end_date, status } = args;

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

    const requests = await bambooClient.get(endpoint);
    const text = formatters.formatTimeOffRequests(
      (requests as any) || [],
      start_date,
      end_date
    );

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    return formatters.formatErrorResponse(
      error,
      'Time-off requests retrieval failed'
    );
  }
}

export async function handleDiscoverDatasets(_args: any, context: any = {}) {
  try {
    // Support both direct progressToken and _meta.progressToken
    const progressToken = context.progressToken || context._meta?.progressToken;

    // Create progress tracker
    const sendProgress = async (
      progress: number,
      total: number,
      message: string
    ) => {
      if (progressToken) {
        logger.debug(`Progress ${progress}/${total}: ${message}`);
      }
      // Also call the mock function if present and enabled (for testing)
      if (context.sendProgress && context.isEnabled) {
        await context.sendProgress(progress, total, message);
      }
    };

    await sendProgress(25, 100, 'Fetching available datasets');

    const datasets = await bambooClient.get('/datasets');

    await sendProgress(75, 100, 'Processing dataset information');

    if (!(datasets as any)?.datasets?.length) {
      return {
        content: [
          {
            type: 'text',
            text: 'No datasets available or API not accessible',
          },
        ],
      };
    }

    await sendProgress(100, 100, 'Datasets discovered successfully');

    const text = formatters.formatDatasetsList(
      (datasets as any).datasets || []
    );
    return { content: [{ type: 'text', text }] };
  } catch (error) {
    return formatters.formatErrorResponse(error, 'Dataset discovery failed');
  }
}

export async function handleDiscoverFields(args: any, _context: any = {}) {
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

    const fields = await bambooClient.get(`/datasets/${dataset_id}/fields`);

    if (!(fields as any)?.fields?.length) {
      return {
        content: [
          {
            type: 'text',
            text: `No fields found for dataset: ${dataset_id}`,
          },
        ],
      };
    }

    const text = formatters.formatDatasetFields(
      (fields as any).fields || [],
      dataset_id
    );
    return { content: [{ type: 'text', text }] };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `ERROR: Error discovering fields: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        },
      ],
    };
  }
}

// Advanced Analytics Tools (Previously Placeholders)

export async function handleWorkforceAnalytics(args: any, context: any = {}) {
  try {
    const { dataset_id, fields, filters, group_by } = args;
    // Support both direct progressToken and _meta.progressToken
    const progressToken = context.progressToken || context._meta?.progressToken;

    // Create progress tracker
    const sendProgress = async (
      progress: number,
      total: number,
      message: string
    ) => {
      if (progressToken) {
        logger.debug(`Progress ${progress}/${total}: ${message}`);
      }
      // Also call the mock function if present and enabled (for testing)
      if (context.sendProgress && context.isEnabled) {
        await context.sendProgress(progress, total, message);
      }
    };

    await sendProgress(10, 100, 'Validating request parameters');

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
            _meta: {
              error: true,
              validationFailed: true,
              requiredSteps: [
                'bamboo_discover_datasets',
                'bamboo_discover_fields',
              ],
              timestamp: new Date().toISOString(),
            },
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
            _meta: {
              error: true,
              validationError: 'invalid_filters_format',
              timestamp: new Date().toISOString(),
            },
          },
        ],
      };
    }

    await sendProgress(25, 100, 'Building analytics request');

    // Prepare API request payload
    const requestPayload: any = {
      fields: fields.filter(
        (f: any) => typeof f === 'string' && f.trim().length > 0
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
            _meta: {
              error: true,
              validationError: 'no_valid_fields',
              timestamp: new Date().toISOString(),
            },
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
        (filter: any) =>
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
              _meta: {
                error: true,
                validationError: 'malformed_filters',
                validFilterCount: validFilters.length,
                totalFilterCount: filters.length,
                timestamp: new Date().toISOString(),
              },
            },
          ],
        };
      }

      requestPayload.filters = validFilters;
    }

    await sendProgress(50, 100, 'Executing analytics query');

    // Make the datasets API call
    let data;
    try {
      data = await bambooClient.post(`/datasets/${dataset_id}`, requestPayload);
    } catch (networkError) {
      return formatters.formatNetworkError(networkError);
    }

    await sendProgress(75, 100, 'Processing analytics results');

    // Enhanced data validation and processing
    if (!data || typeof data !== 'object') {
      return {
        content: [
          {
            type: 'text',
            text: `ERROR: **Invalid Response Format**

Expected an object response but received: ${typeof data}`,
            _meta: {
              error: true,
              responseType: typeof data,
              timestamp: new Date().toISOString(),
            },
          },
        ],
      };
    }

    // Handle various response structures from BambooHR
    let records = [];
    if (Array.isArray(data)) {
      records = data;
    } else if (data && typeof data === 'object' && data !== null) {
      const dataObj = data as any;
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

Could not find data array in response. Available properties: ${Object.keys(
                dataObj
              ).join(', ')}`,
              _meta: {
                error: true,
                availableProperties: Object.keys(dataObj),
                timestamp: new Date().toISOString(),
              },
            },
          ],
        };
      }
    }

    await sendProgress(90, 100, 'Formatting results');

    if (records.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `ANALYTICS: **No Records Found**

Dataset: ${dataset_id}
Fields: ${requestPayload.fields.join(', ')}
Filters: ${
              requestPayload.filters
                ? JSON.stringify(requestPayload.filters, null, 2)
                : 'None'
            }

TIP: **Possible reasons:**
- No data matches your filter criteria
- The dataset is empty  
- Field names might not exist in this dataset
- Date ranges in filters might be outside available data

**Suggestions:**
- Try removing filters to see if data exists
- Use \`bamboo_discover_fields\` to verify field names
- Check if the dataset has any data at all`,
            _meta: {
              dataset: dataset_id,
              fieldCount: requestPayload.fields.length,
              filterCount: requestPayload.filters?.length || 0,
              recordCount: 0,
              suggestions: ['remove_filters', 'verify_fields', 'check_dataset'],
              timestamp: new Date().toISOString(),
            },
          },
        ],
      };
    }

    await sendProgress(100, 100, 'Analytics complete');

    const text = formatters.formatWorkforceAnalytics(
      records,
      dataset_id,
      requestPayload.fields
    );

    // Enhanced response with structured output and analytics metadata
    return {
      content: [
        {
          type: 'text',
          text,
          _meta: {
            dataset: dataset_id,
            fieldCount: requestPayload.fields.length,
            filterCount: requestPayload.filters?.length || 0,
            recordCount: records.length,
            groupBy: requestPayload.groupBy,
            confidence: 1.0,
            timestamp: new Date().toISOString(),
            analyticsType: 'workforce_analytics',
          },
        },
      ],
      _links: {
        related: [
          {
            href: `dataset://${dataset_id}`,
            title: `Dataset: ${dataset_id}`,
            rel: 'dataset',
          },
          {
            href: `dataset://${dataset_id}/fields`,
            title: 'Dataset Fields',
            rel: 'fields',
          },
        ],
      },
    };
  } catch (error) {
    logger.error('Workforce analytics failed:', (error as Error).message);
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
- Ensure your API key has sufficient permissions`,
          _meta: {
            error: true,
            errorType: 'unexpected_error',
            errorMessage:
              error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          },
        },
      ],
    };
  }
}

export async function handleRunCustomReport(args: any, context: any = {}) {
  try {
    const { report_id, list_reports, format } = args;
    // Support both direct progressToken and _meta.progressToken
    const progressToken = context.progressToken || context._meta?.progressToken;

    // Progress tracking
    const sendProgress = async (
      progress: number,
      total: number,
      message: string
    ) => {
      if (progressToken) {
        logger.debug(`Progress ${progress}/${total}: ${message}`);
      }
      // Also call the mock function if present and enabled (for testing)
      if (context.sendProgress && context.isEnabled) {
        await context.sendProgress(progress, total, message);
      }
    };

    if (list_reports) {
      await sendProgress(25, 100, 'Fetching available reports');

      try {
        // List available reports with enhanced error handling
        const reports = await bambooClient.get('/custom-reports');

        // Enhanced response structure handling
        let reportList = [];
        if (Array.isArray(reports)) {
          reportList = reports;
        } else if (reports && typeof reports === 'object') {
          const reportsObj = reports as any;
          reportList =
            reportsObj.reports || reportsObj.data || reportsObj.results || [];
        }

        if (!Array.isArray(reportList)) {
          return {
            content: [
              {
                type: 'text',
                text: `REPORT: **Unexpected Reports Response Structure**

Received: ${typeof reportList}
Available properties: ${
                  reports && typeof reports === 'object'
                    ? Object.keys(reports).join(', ')
                    : 'None'
                }`,
                _meta: {
                  error: true,
                  responseType: typeof reportList,
                  timestamp: new Date().toISOString(),
                },
              },
            ],
          };
        }

        await sendProgress(100, 100, 'Reports list retrieved');

        const text = formatters.formatCustomReportsList(reportList);
        return {
          content: [
            {
              type: 'text',
              text,
              _meta: {
                reportCount: reportList.length,
                operation: 'list_reports',
                timestamp: new Date().toISOString(),
              },
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `ERROR: **Error Listing Reports**

${error instanceof Error ? error.message : 'Unknown error'}

TIP: **Troubleshooting:**
- The custom reports endpoint might not be available
- Your API key may lack report permissions
- Your BambooHR plan might not include custom reports
- There might be a temporary API issue

**Suggestion:** Try again later or contact your BambooHR administrator.`,
              _meta: {
                error: true,
                operation: 'list_reports',
                errorType: 'api_error',
                timestamp: new Date().toISOString(),
              },
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
            text: `ERROR: **Missing Parameter**

Provide either:
- \`{"list_reports": true}\` - to see available reports
- \`{"report_id": "123"}\` - to run report ID 123
- \`{"report_id": "123", "format": "json"}\` - to run report with specific format

TIP: **Workflow:**
1. First use \`{"list_reports": true}\` to see available reports
2. Then use the report ID from the list to run a specific report`,
            _meta: {
              error: true,
              validationError: 'missing_parameters',
              timestamp: new Date().toISOString(),
            },
          },
        ],
      };
    }

    await sendProgress(25, 100, 'Executing custom report');

    try {
      // Run specific report with enhanced error handling
      let reportData;
      try {
        const endpoint = `/custom-reports/${report_id}${
          format ? `?format=${format}` : ''
        }`;
        reportData = await bambooClient.get(endpoint);
      } catch (apiError) {
        return {
          content: [
            {
              type: 'text',
              text: `ERROR: **Report API Error**

${apiError instanceof Error ? apiError.message : 'Unknown API error'}

TIP: **Common Issues:**
- **404**: Report ID "${report_id}" not found
- **403**: No permission to access this report
- **400**: Invalid report ID format
- **500**: Report generation failed

**Suggestions:**
- Use \`{"list_reports": true}\` to verify available reports
- Check that the report ID is correct
- Ensure your API key has report permissions`,
              _meta: {
                error: true,
                reportId: report_id,
                operation: 'run_report',
                errorType: 'api_error',
                timestamp: new Date().toISOString(),
              },
            },
          ],
        };
      }

      if (!reportData) {
        return {
          content: [
            {
              type: 'text',
              text: `ERROR: **Empty Report Response**

Report ID: ${report_id}

The API returned an empty response. This could indicate:
- The report exists but has no data
- The report is still being generated
- There's a temporary API issue

TIP: Try again in a few moments or use \`{"list_reports": true}\` to verify the report exists.`,
              _meta: {
                error: true,
                reportId: report_id,
                operation: 'run_report',
                errorType: 'empty_response',
                timestamp: new Date().toISOString(),
              },
            },
          ],
        };
      }

      await sendProgress(100, 100, 'Report execution complete');

      const text = formatters.formatCustomReportResults(reportData, report_id);

      return {
        content: [
          {
            type: 'text',
            text,
            _meta: {
              reportId: report_id,
              format: format || 'json',
              operation: 'run_report',
              timestamp: new Date().toISOString(),
            },
          },
        ],
        _links: {
          self: {
            href: `report://${report_id}`,
            title: `Custom Report ${report_id}`,
            rel: 'self',
          },
        },
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `ERROR: **Unexpected Error Running Report**

Report ID: ${report_id}
Error: ${error instanceof Error ? error.message : 'Unknown error'}

TIP: **Troubleshooting:**
- Verify the report ID exists using \`{"list_reports": true}\`
- Check your API key permissions
- Try a different output format (json, csv, pdf)
- Contact your BambooHR administrator if the issue persists`,
            _meta: {
              error: true,
              reportId: report_id,
              operation: 'run_report',
              errorType: 'unexpected_error',
              timestamp: new Date().toISOString(),
            },
          },
        ],
      };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `ERROR: General error: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          _meta: {
            error: true,
            errorType: 'general_error',
            timestamp: new Date().toISOString(),
          },
        },
      ],
    };
  }
}

export async function handleGetEmployeePhoto(args: any, _context: any = {}) {
  try {
    const employee_id = args.employee_id;

    if (!employee_id) {
      return {
        content: [
          {
            type: 'text',
            text: 'Missing required parameter: employee_id. Use bamboo_find_employee to get the ID first.',
            _meta: {
              error: true,
              validationError: 'missing_employee_id',
              timestamp: new Date().toISOString(),
            },
          },
        ],
      };
    }

    // Validate employee exists first
    try {
      const employee = await bambooClient.get(
        `/employees/${employee_id}?fields=id,firstName,lastName`
      );

      const emp = employee as any;
      const photoUrl = `${bambooClient.getBaseUrl()}/employees/${employee_id}/photo`;

      // Enhanced response with employee metadata
      return {
        content: [
          {
            type: 'text',
            text: `**Employee Photo Available**

Employee: ${emp.firstName} ${emp.lastName} (ID: ${employee_id})
Photo URL: ${photoUrl}

**Note:** This URL requires authentication with your BambooHR API key to access.`,
            _meta: {
              employeeId: employee_id,
              employeeName: `${emp.firstName} ${emp.lastName}`,
              operation: 'get_photo',
              timestamp: new Date().toISOString(),
            },
          },
        ],
        _links: {
          photo: {
            href: photoUrl,
            title: `Photo of ${emp.firstName} ${emp.lastName}`,
            rel: 'photo',
            type: 'image/*',
          },
          employee: {
            href: `employee://${employee_id}`,
            title: `Employee Profile: ${emp.firstName} ${emp.lastName}`,
            rel: 'employee',
          },
        },
      };
    } catch (error) {
      if ((error as any).message && (error as any).message.includes('404')) {
        return {
          content: [
            {
              type: 'text',
              text: `ERROR: **Employee Not Found**

Employee ID "${employee_id}" does not exist.

**Suggestions:**
- Use \`bamboo_find_employee\` to search for the correct employee
- Verify the employee ID is correct
- Check if the employee is still active in the system`,
              _meta: {
                error: true,
                employeeId: employee_id,
                errorType: 'employee_not_found',
                timestamp: new Date().toISOString(),
              },
            },
          ],
        };
      }
      throw error; // Re-throw other errors
    }
  } catch (error) {
    return formatters.formatErrorResponse(error, 'Get employee photo failed');
  }
}

export async function handleListDepartments(_args: any, context: any = {}) {
  try {
    // Support both direct progressToken and _meta.progressToken
    const progressToken = context.progressToken || context._meta?.progressToken;

    // Progress tracking
    const sendProgress = async (
      progress: number,
      total: number,
      message: string
    ) => {
      if (progressToken) {
        logger.debug(`Progress ${progress}/${total}: ${message}`);
      }
      // Also call the mock function if present and enabled (for testing)
      if (context.sendProgress && context.isEnabled) {
        await context.sendProgress(progress, total, message);
      }
    };

    await sendProgress(25, 100, 'Fetching employee directory');

    // Use employee directory endpoint to get department data
    const employees = await bambooClient.get(
      '/employees/directory?fields=department'
    );

    if (
      !(employees as any)?.employees ||
      !Array.isArray((employees as any).employees)
    ) {
      return {
        content: [
          {
            type: 'text',
            text: 'Could not retrieve employee data for departments.',
            _meta: {
              error: true,
              errorType: 'invalid_response',
              timestamp: new Date().toISOString(),
            },
          },
        ],
      };
    }

    await sendProgress(75, 100, 'Processing department data');

    // Extract unique departments from employee data with analytics
    const departmentMap = new Map<string, number>();
    let totalEmployees = 0;

    (employees as any).employees.forEach((emp: any) => {
      if (emp.department && emp.department.trim()) {
        const dept = emp.department.trim();
        departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1);
        totalEmployees++;
      }
    });

    const departments = Array.from(departmentMap.keys()).sort();

    if (departments.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'No departments found in employee data.',
            _meta: {
              departmentCount: 0,
              employeeCount: (employees as any).employees.length,
              timestamp: new Date().toISOString(),
            },
          },
        ],
      };
    }

    await sendProgress(100, 100, 'Department analysis complete');

    // Generate analytics-rich department list
    const departmentAnalytics = departments
      .map((dept) => {
        const count = departmentMap.get(dept)!;
        const percentage = ((count / totalEmployees) * 100).toFixed(1);
        return `• **${dept}** - ${count} employees (${percentage}%)`;
      })
      .join('\n');

    const text = `**Available Departments (${departments.length}):**

${departmentAnalytics}

**Summary:**
- Total Departments: ${departments.length}
- Total Employees: ${totalEmployees}
- Average Department Size: ${Math.round(totalEmployees / departments.length)}`;

    return {
      content: [
        {
          type: 'text',
          text,
          _meta: {
            departmentCount: departments.length,
            employeeCount: totalEmployees,
            averageDepartmentSize: Math.round(
              totalEmployees / departments.length
            ),
            operation: 'list_departments',
            timestamp: new Date().toISOString(),
            analytics: {
              departments: Array.from(departmentMap.entries()).map(
                ([name, count]) => ({
                  name,
                  employeeCount: count,
                  percentage: ((count / totalEmployees) * 100).toFixed(1),
                })
              ),
            },
          },
        },
      ],
      _links: {
        related: departments.map((dept) => ({
          href: `department://${encodeURIComponent(dept)}`,
          title: `${dept} Department`,
          rel: 'department',
        })),
      },
    };
  } catch (error) {
    return formatters.formatApiErrorResponse(
      error,
      '/employees/directory',
      undefined
    );
  }
}
