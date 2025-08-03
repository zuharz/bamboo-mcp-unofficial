/**
 * Workforce analytics handlers for BambooHR MCP server
 * Handles complex analytics queries and data analysis operations
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

export function initializeWorkforceAnalyticsHandlers(
  dependencies: HandlerDependencies
): boolean {
  bambooClient = dependencies.bambooClient as BambooClient;
  logger = dependencies.logger;
  mcpLogger.analytics(
    'info',
    'Workforce analytics handlers initialized successfully'
  );
  return true;
}

export async function handleWorkforceAnalytics(
  args: ToolArgs,
  context: ToolContext = {}
): Promise<MCPToolResponse> {
  try {
    const dataset_id = args.dataset_id as string;
    const fields = args.fields;
    const filters = args.filters;
    const group_by = args.group_by as string;
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
    const fieldsArray = Array.isArray(fields) ? fields : [];
    if (!dataset_id || !fields || fieldsArray.length === 0) {
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
    const filtersArray = Array.isArray(filters) ? filters : [];
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
    const requestPayload: {
      fields: string[];
      groupBy?: string[];
      filters?: unknown[];
    } = {
      fields: fieldsArray.filter(
        (f: unknown) => typeof f === 'string' && f.trim().length > 0
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

    if (filters && filtersArray.length > 0) {
      // Validate filter structure
      const validFilters = filtersArray.filter(
        (filter: unknown): filter is Record<string, unknown> => {
          if (!filter || typeof filter !== 'object' || filter === null) {
            return false;
          }
          const f = filter as Record<string, unknown>;
          return (
            typeof f.field === 'string' &&
            typeof f.operator === 'string' &&
            f.value !== undefined
          );
        }
      );

      if (validFilters.length !== filtersArray.length) {
        return {
          content: [
            {
              type: 'text',
              text: `ERROR: **Invalid Filter Structure**

Some filters are malformed. Each filter must have:
- \`field\`: string (field name)
- \`operator\`: string (e.g., "equal", "not_equal", "greater_than")
- \`value\`: any (value to filter by)

**Valid filters**: ${validFilters.length}/${filtersArray.length}`,
              _meta: {
                error: true,
                validationError: 'malformed_filters',
                validFilterCount: validFilters.length,
                totalFilterCount: filtersArray.length,
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
      return handleBambooError(
        networkError instanceof Error
          ? networkError
          : new Error(String(networkError)),
        'workforce analytics query',
        'bamboo_workforce_analytics',
        {
          parameters: { dataset_id, fields, filters, group_by },
          endpoint: `/datasets/${dataset_id}`,
        }
      );
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

    const text = (
      formatters as {
        formatWorkforceAnalytics: (
          records: unknown[],
          dataset: string,
          fields: string[]
        ) => string;
      }
    ).formatWorkforceAnalytics(records, dataset_id, requestPayload.fields);

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
    return handleBambooError(
      error instanceof Error ? error : new Error(String(error)),
      'workforce analytics execution',
      'bamboo_workforce_analytics',
      {
        parameters: {
          dataset_id: args.dataset_id,
          fields: args.fields,
          filters: args.filters,
          group_by: args.group_by,
        },
        endpoint: `/datasets/${args.dataset_id}`,
      }
    );
  }
}
