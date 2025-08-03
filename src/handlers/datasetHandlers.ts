/**
 * Dataset operations handlers for BambooHR MCP server
 * Handles dataset discovery and field exploration operations
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
  BambooDataset,
  BambooDatasetField,
} from '../types.js';

// Import dependencies (will be passed via DI)
let bambooClient: BambooClient;
let logger: Logger;

export function initializeDatasetHandlers(
  dependencies: HandlerDependencies
): boolean {
  bambooClient = dependencies.bambooClient as BambooClient;
  logger = dependencies.logger;
  mcpLogger.dataset('info', 'Dataset handlers initialized successfully');
  return true;
}

export async function handleDiscoverDatasets(
  _args: ToolArgs,
  context: ToolContext = {}
): Promise<MCPToolResponse> {
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

    const datasetsResponse = datasets as { datasets?: unknown[] };
    if (!datasetsResponse?.datasets?.length) {
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
      (datasetsResponse.datasets as BambooDataset[]) || []
    );
    return { content: [{ type: 'text', text }] };
  } catch (error) {
    return handleBambooError(
      error instanceof Error ? error : new Error(String(error)),
      'dataset discovery',
      'bamboo_discover_datasets',
      {
        endpoint: '/datasets',
      }
    );
  }
}

export async function handleDiscoverFields(
  args: ToolArgs,
  _context: ToolContext = {}
): Promise<MCPToolResponse> {
  try {
    const dataset_id = args.dataset_id as string;
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

    const fieldsResponse = fields as { fields?: unknown[] };
    if (!fieldsResponse?.fields?.length) {
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
      (fieldsResponse.fields as BambooDatasetField[]) || [],
      dataset_id
    );
    return { content: [{ type: 'text', text }] };
  } catch (error) {
    return handleBambooError(
      error instanceof Error ? error : new Error(String(error)),
      'field discovery',
      'bamboo_discover_fields',
      {
        parameters: { dataset_id: args.dataset_id },
        endpoint: `/datasets/${args.dataset_id}/fields`,
      }
    );
  }
}
