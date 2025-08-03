/**
 * Report operations handlers for BambooHR MCP server
 * Handles custom report listing and execution operations
 */

import type { BambooClient } from '../bamboo-client.js';
import * as formatters from '../formatters.js';
import { mcpLogger } from '../utils/mcpLogger.js';
import { handleBambooError } from '../utils/errorHandler.js';
import type {
  HandlerDependencies,
  Logger,
  ToolArgs,
  ToolContext,
  MCPToolResponse,
} from '../types.js';

// Import dependencies (will be passed via DI)
let bambooClient: BambooClient;
let logger: Logger;

export function initializeReportHandlers(
  dependencies: HandlerDependencies
): boolean {
  bambooClient = dependencies.bambooClient as BambooClient;
  logger = dependencies.logger;
  mcpLogger.report('info', 'Report handlers initialized successfully');
  return true;
}

export async function handleRunCustomReport(
  args: ToolArgs,
  context: ToolContext = {}
): Promise<MCPToolResponse> {
  try {
    const report_id = args.report_id as string;
    const list_reports = args.list_reports as boolean;
    const format = args.format as string;
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
        let reportList: unknown[] = [];
        if (Array.isArray(reports)) {
          reportList = reports;
        } else if (reports && typeof reports === 'object') {
          const reportsObj = reports as Record<string, unknown>;
          reportList =
            (reportsObj.reports as unknown[]) ||
            (reportsObj.data as unknown[]) ||
            (reportsObj.results as unknown[]) ||
            [];
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

        const text = (
          formatters as {
            formatCustomReportsList: (reports: unknown[]) => string;
          }
        ).formatCustomReportsList(reportList);
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
        return handleBambooError(
          error instanceof Error ? error : new Error(String(error)),
          'custom reports listing',
          'bamboo_run_custom_report',
          {
            parameters: { list_reports: true },
            endpoint: '/custom-reports',
          }
        );
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
        return handleBambooError(
          apiError instanceof Error ? apiError : new Error(String(apiError)),
          'custom report execution',
          'bamboo_run_custom_report',
          {
            parameters: { report_id, format },
            endpoint: `/custom-reports/${report_id}${format ? `?format=${format}` : ''}`,
          }
        );
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

      const text = (
        formatters as {
          formatCustomReportResults: (
            data: unknown,
            reportId: string
          ) => string;
        }
      ).formatCustomReportResults(reportData, report_id);

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
      return handleBambooError(
        error instanceof Error ? error : new Error(String(error)),
        'custom report processing',
        'bamboo_run_custom_report',
        {
          parameters: { report_id, format },
          endpoint: `/custom-reports/${report_id}`,
        }
      );
    }
  } catch (error) {
    return handleBambooError(
      error instanceof Error ? error : new Error(String(error)),
      'custom report operation',
      'bamboo_run_custom_report',
      {
        parameters: {
          report_id: args.report_id,
          list_reports: args.list_reports,
          format: args.format,
        },
        endpoint: args.report_id
          ? `/custom-reports/${args.report_id}`
          : '/custom-reports',
      }
    );
  }
}
