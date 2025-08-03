/**
 * Time-off and leave management handlers for BambooHR MCP server
 * Handles who's out calendar and time-off request operations
 */

import type { BambooClient } from '../bamboo-client.js';
import * as formatters from '../formatters.js';
import { mcpLogger } from '../utils/mcpLogger.js';
import { handleBambooError } from '../utils/errorHandler.js';
import type {
  HandlerDependencies,
  ToolArgs,
  ToolContext,
  MCPToolResponse,
  BambooWhosOutEntry,
  BambooTimeOffRequest,
} from '../types.js';

// Import dependencies (will be passed via DI)
let bambooClient: BambooClient;

export function initializeTimeOffHandlers(
  dependencies: HandlerDependencies
): boolean {
  bambooClient = dependencies.bambooClient as BambooClient;
  mcpLogger.timeOff('info', 'Time-off handlers initialized successfully');
  return true;
}

export async function handleWhosOut(
  args: ToolArgs,
  _context: ToolContext = {}
): Promise<MCPToolResponse> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const start = (args.start_date as string) || today;
    const end = (args.end_date as string) || start;

    const startDate = start;
    const endDate = end;

    const calendar = await bambooClient.get(
      `/time_off/whos_out?start=${startDate}&end=${endDate}`
    );

    const calendarResponse = calendar as { calendar?: BambooWhosOutEntry[] };
    const entries = calendarResponse.calendar || [];
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
    return handleBambooError(
      error instanceof Error ? error : new Error(String(error)),
      "who's out calendar",
      'bamboo_whos_out',
      {
        parameters: { start_date: args.start_date, end_date: args.end_date },
        endpoint: `/time_off/whos_out?start=${args.start_date || 'today'}&end=${args.end_date || args.start_date || 'today'}`,
      }
    );
  }
}

export async function handleTimeOffRequests(
  args: ToolArgs,
  _context: ToolContext = {}
): Promise<MCPToolResponse> {
  try {
    const start_date = args.start_date as string;
    const end_date = args.end_date as string;
    const status = args.status as string;

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
    const requestsArray = (requests as BambooTimeOffRequest[]) || [];
    const text = formatters.formatTimeOffRequests(
      requestsArray,
      start_date,
      end_date
    );

    return { content: [{ type: 'text', text }] };
  } catch (error) {
    return handleBambooError(
      error instanceof Error ? error : new Error(String(error)),
      'time-off requests retrieval',
      'bamboo_time_off_requests',
      {
        parameters: {
          start_date: args.start_date,
          end_date: args.end_date,
          status: args.status,
        },
        endpoint: `/time_off/requests?start=${args.start_date}&end=${args.end_date}${args.status ? `&status=${args.status}` : ''}`,
      }
    );
  }
}
