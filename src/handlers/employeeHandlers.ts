/**
 * Employee-related handlers for BambooHR MCP server
 * Handles employee search, directory operations, and photo access
 */

import type { BambooClient } from '../bamboo-client.js';
import { mcpLogger } from '../utils/mcpLogger.js';
import { handleBambooError } from '../utils/errorHandler.js';
import type {
  HandlerDependencies,
  Logger,
  ToolArgs,
  ToolContext,
  MCPToolResponse,
  BambooEmployeeDirectory,
  BambooEmployee,
} from '../types.js';

// Import dependencies (will be passed via DI)
let bambooClient: BambooClient;
let logger: Logger;

export function initializeEmployeeHandlers(
  dependencies: HandlerDependencies
): boolean {
  bambooClient = dependencies.bambooClient as BambooClient;
  logger = dependencies.logger;
  mcpLogger.employee('info', 'Employee handlers initialized successfully');
  return true;
}

export async function handleFindEmployee(
  args: ToolArgs,
  context: ToolContext = {}
): Promise<MCPToolResponse> {
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
      typeof query === 'string' ? query.length : 0
    );

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      logger.warn('Employee search failed - missing query parameter');
      return {
        content: [
          {
            type: 'text' as const,
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

    const found = (employees as BambooEmployeeDirectory).employees?.find(
      (emp: BambooEmployee) => {
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
      }
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

    await sendProgress(100, 100, 'Employee search completed');

    logger.info(
      'Employee search completed successfully for:',
      `${found.firstName} ${found.lastName}`
    );

    // Enhanced response with structured output (2025-06-18 compliance)
    const response: MCPToolResponse = {
      content: [
        {
          type: 'text' as const,
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
      (response as MCPToolResponse)._links = {
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
    return handleBambooError(
      error instanceof Error ? error : new Error(String(error)),
      'employee search',
      'bamboo_find_employee',
      {
        parameters: { query: args.query },
        endpoint: '/employees/directory',
      }
    );
  }
}

export async function handleGetEmployeePhoto(
  args: ToolArgs,
  _context: ToolContext = {}
): Promise<MCPToolResponse> {
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

      const emp = employee as BambooEmployee;
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
      if (
        (error as Error).message &&
        (error as Error).message.includes('404')
      ) {
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
    return handleBambooError(
      error instanceof Error ? error : new Error(String(error)),
      'employee photo retrieval',
      'bamboo_get_employee_photo',
      {
        parameters: { employee_id: args.employee_id },
        endpoint: `/employees/${args.employee_id}/photo`,
      }
    );
  }
}
