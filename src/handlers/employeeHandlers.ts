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
  const employee_id = args.employee_id as string;
  const return_base64 = args.return_base64 as boolean;

  try {
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

    // Validate the employee exists and get basic info
    // This prevents wasted effort on invalid employee IDs
    const employee = await bambooClient.get(
      `/employees/${employee_id}?fields=id,firstName,lastName`
    );
    const emp = employee as BambooEmployee;

    if (return_base64) {
      // Import simplified image utilities
      const {
        getImageMimeType,
        formatBytes,
        validateImageBuffer,
        createDataUri,
      } = await import('../utils/imageUtils.js');

      // This is where the magic happens - fetch the actual image bytes
      const imageBuffer = await bambooClient.getBinary(
        `/employees/${employee_id}/photo`
      );

      // Validate that we received valid image data
      const validation = validateImageBuffer(imageBuffer);
      if (!validation.valid) {
        return {
          content: [
            {
              type: 'text',
              text: `**Invalid Image Data**

Employee ${emp.firstName} ${emp.lastName} has an invalid or corrupted photo.

**Error:** ${validation.reason}

**Suggestions:**
- Try again in a few moments
- Contact your BambooHR administrator
- Use the URL mode instead: {"employee_id": "${employee_id}", "return_base64": false}`,
              _meta: {
                error: true,
                employeeId: employee_id,
                employeeName: `${emp.firstName} ${emp.lastName}`,
                errorType: 'invalid_image_data',
                timestamp: new Date().toISOString(),
              },
            },
          ],
        };
      }

      // Check for oversized images
      const maxSize = 5 * 1024 * 1024; // 5MB limit
      if (imageBuffer.length > maxSize) {
        return {
          content: [
            {
              type: 'text',
              text: `**Image Too Large**

The photo for ${emp.firstName} ${emp.lastName} is ${formatBytes(imageBuffer.length)}, which exceeds the 5MB display limit.

**Alternatives:**
- Use the URL mode instead: {"employee_id": "${employee_id}", "return_base64": false}
- Contact your BambooHR administrator about image size policies
- Ask the employee to upload a smaller photo`,
              _meta: {
                error: true,
                employeeId: employee_id,
                employeeName: `${emp.firstName} ${emp.lastName}`,
                errorType: 'image_too_large',
                imageSize: imageBuffer.length,
                timestamp: new Date().toISOString(),
              },
            },
          ],
        };
      }

      // Create data URI with simplified image processing
      const dataUri = createDataUri(imageBuffer);
      const imageType = getImageMimeType(imageBuffer);

      // Simplified HTML artifact - clean and functional
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Employee Photo: ${emp.firstName} ${emp.lastName}</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { 
            font-family: system-ui, sans-serif; 
            padding: 20px; 
            text-align: center; 
            background: #f8f9fa;
            margin: 0;
        }
        .photo-container { 
            background: white; 
            border-radius: 12px; 
            padding: 30px; 
            box-shadow: 0 4px 16px rgba(0,0,0,0.1); 
            display: inline-block;
            max-width: 350px;
        }
        img { 
            max-width: 280px; 
            max-height: 280px;
            border-radius: 8px; 
            border: 3px solid #e9ecef;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .employee-name { 
            font-size: 24px; 
            font-weight: 600; 
            margin: 20px 0 8px;
            color: #2c3e50;
        }
        .employee-id { 
            color: #6c757d; 
            margin-bottom: 15px;
        }
        .metadata { 
            margin-top: 20px; 
            padding-top: 15px;
            border-top: 1px solid #e9ecef;
            font-size: 14px; 
            color: #6c757d;
        }
        .status { 
            background: #28a745; 
            color: white; 
            padding: 6px 12px; 
            border-radius: 4px; 
            font-size: 12px;
            display: inline-block;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="photo-container">
        <img src="${dataUri}" alt="Employee Photo: ${emp.firstName} ${emp.lastName}" />
        <div class="employee-name">${emp.firstName} ${emp.lastName}</div>
        <div class="employee-id">Employee ID: ${employee_id}</div>
        <div class="status">Photo Retrieved Successfully</div>
        <div class="metadata">
            <div><strong>Format:</strong> ${imageType} | <strong>Size:</strong> ${formatBytes(imageBuffer.length)}</div>
            <div><strong>Retrieved:</strong> ${new Date().toLocaleString()}</div>
        </div>
    </div>
</body>
</html>`;

      // Return the HTML content that Claude will automatically convert to an artifact
      return {
        content: [
          {
            type: 'text',
            text: htmlContent,
            _meta: {
              employeeId: employee_id,
              employeeName: `${emp.firstName} ${emp.lastName}`,
              imageSize: imageBuffer.length,
              imageType: imageType,
              operation: 'employee_photo_display',
              timestamp: new Date().toISOString(),
            },
          },
        ],
      };
    }

    // Fallback mode: return just the authenticated URL
    // This is useful when users want to use the image elsewhere
    const photoUrl = `${bambooClient.getBaseUrl()}/employees/${employee_id}/photo`;

    return {
      content: [
        {
          type: 'text',
          text: `**Employee Photo URL**

Employee: ${emp.firstName} ${emp.lastName} (ID: ${employee_id})
Authenticated Photo URL: ${photoUrl}

**Note:** This URL requires your BambooHR API key for access. For direct display in Claude, use the base64 option.`,
          _meta: {
            employeeId: employee_id,
            employeeName: `${emp.firstName} ${emp.lastName}`,
            photoUrl: photoUrl,
            operation: 'employee_photo_url',
            timestamp: new Date().toISOString(),
          },
        },
      ],
    };
  } catch (error) {
    // Handle various error scenarios gracefully
    if (error instanceof Error && error.message.includes('404')) {
      return {
        content: [
          {
            type: 'text',
            text: `**Employee Photo Not Found**

Employee ID "${employee_id}" either does not exist or has no photo uploaded.

**Troubleshooting Steps:**
1. Verify the employee ID using the employee search tool
2. Check if the employee has uploaded a photo in BambooHR
3. Ensure your API key has photo access permissions`,
            _meta: {
              error: true,
              employeeId: employee_id,
              errorType: 'not_found',
              timestamp: new Date().toISOString(),
            },
          },
        ],
      };
    }

    // Handle timeout errors specifically
    if (error instanceof Error && error.message.includes('timeout')) {
      return {
        content: [
          {
            type: 'text',
            text: `**Request Timeout**

The photo request for employee ${employee_id} took too long to complete.

**Try Again:**
- The image might be very large
- Network connectivity might be slow
- BambooHR servers might be experiencing high load

Wait a moment and retry the request.`,
            _meta: {
              error: true,
              employeeId: employee_id,
              errorType: 'timeout',
              timestamp: new Date().toISOString(),
            },
          },
        ],
      };
    }

    // Generic error handling for other issues
    return handleBambooError(
      error instanceof Error ? error : new Error(String(error)),
      'employee photo retrieval',
      'bamboo_get_employee_photo',
      {
        parameters: { employee_id: employee_id, return_base64: return_base64 },
        endpoint: `/employees/${employee_id}/photo`,
      }
    );
  }
}
