/**
 * MCP Error Handling Utilities - 2025-06-18 Compliant
 * Provides error formatting and request validation for MCP protocol compliance
 */
// Request ID tracking for duplicate detection
const processedRequestIds = new Set();
/**
 * Standard MCP/JSON-RPC error codes
 */
export const MCP_ERROR_CODES = {
    // JSON-RPC standard codes
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
    // Custom MCP codes (above -32000)
    AUTHENTICATION_REQUIRED: -32001,
    UNAUTHORIZED: -32002,
    RESOURCE_NOT_FOUND: -32003,
    TOOL_EXECUTION_FAILED: -32004,
    RATE_LIMIT_EXCEEDED: -32005,
    NETWORK_ERROR: -32006,
};
/**
 * MCP Error class for structured error handling
 */
export class MCPError extends Error {
    code;
    data;
    constructor(message, code = MCP_ERROR_CODES.INTERNAL_ERROR, data = null) {
        super(message);
        this.name = 'MCPError';
        this.code = code;
        this.data = data;
    }
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            data: this.data,
        };
    }
}
/**
 * Formats errors into MCP-compliant response structure with enhanced categorization
 */
export function formatMCPErrorResponse(error, context = 'unknown') {
    let message = 'Unknown error';
    let code = MCP_ERROR_CODES.INTERNAL_ERROR;
    let data = {};
    if (error instanceof MCPError) {
        message = error.message;
        code = error.code;
        data = error.data || {};
    }
    else if (error instanceof Error) {
        message = error.message;
        // Categorize error types based on message content
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('api key') || errorMsg.includes('authentication')) {
            code = MCP_ERROR_CODES.AUTHENTICATION_REQUIRED;
        }
        else if (errorMsg.includes('permission') ||
            errorMsg.includes('unauthorized')) {
            code = MCP_ERROR_CODES.UNAUTHORIZED;
        }
        else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
            code = MCP_ERROR_CODES.RESOURCE_NOT_FOUND;
        }
        else if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
            code = MCP_ERROR_CODES.RATE_LIMIT_EXCEEDED;
        }
        else if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
            code = MCP_ERROR_CODES.NETWORK_ERROR;
        }
        else if (errorMsg.includes('tool') || errorMsg.includes('execution')) {
            code = MCP_ERROR_CODES.TOOL_EXECUTION_FAILED;
        }
        data = {
            originalError: error.name,
            context: context,
        };
    }
    else if (typeof error === 'string') {
        message = error;
        data = { context };
    }
    else {
        message = String(error);
        data = { context };
    }
    return {
        content: [
            {
                type: 'text',
                text: `Error: ${message}`,
                _meta: {
                    error: true,
                    errorCode: code,
                    context,
                    timestamp: new Date().toISOString(),
                },
            },
        ],
        isError: true,
        _mcpError: {
            code,
            message,
            data,
        },
    };
}
/**
 * Validates request IDs to prevent duplicate processing (MCP 2025-06-18 compliance)
 */
export function validateRequestId(requestId) {
    if (requestId === null || requestId === undefined) {
        throw new MCPError('Request ID is required', MCP_ERROR_CODES.INVALID_REQUEST);
    }
    if (processedRequestIds.has(requestId)) {
        throw new MCPError(`Duplicate request ID: ${requestId}`, MCP_ERROR_CODES.INVALID_REQUEST);
    }
    processedRequestIds.add(requestId);
    // Clean up old request IDs periodically (keep last 1000)
    if (processedRequestIds.size > 1000) {
        const oldIds = Array.from(processedRequestIds).slice(0, 100);
        oldIds.forEach((id) => processedRequestIds.delete(id));
    }
}
/**
 * Handle operation with centralized error processing
 */
export async function executeWithErrorHandling(operation, context) {
    try {
        return await operation();
    }
    catch (error) {
        console.error(`[MCP] Error in ${context}:`, error);
        if (error instanceof MCPError) {
            throw error;
        }
        else if (error && typeof error === 'object' && 'response' in error) {
            // Axios-style error with response
            return formatAPIErrorResponse(error, context, error.response?.status);
        }
        else {
            return formatMCPErrorResponse(error, context);
        }
    }
}
/**
 * Create standardized API error response
 */
export function formatAPIErrorResponse(error, endpoint, statusCode) {
    const message = error.message || 'API request failed';
    let code = MCP_ERROR_CODES.INTERNAL_ERROR;
    const troubleshooting = [];
    // Determine error type based on status code
    if (statusCode) {
        switch (statusCode) {
            case 400:
                code = MCP_ERROR_CODES.INVALID_PARAMS;
                troubleshooting.push('Check your request parameters for correct format');
                break;
            case 401:
                code = MCP_ERROR_CODES.AUTHENTICATION_REQUIRED;
                troubleshooting.push('Verify BAMBOO_API_KEY is set correctly');
                troubleshooting.push('Check if your API key has been revoked');
                break;
            case 403:
                code = MCP_ERROR_CODES.UNAUTHORIZED;
                troubleshooting.push('Your API key may lack permissions for this resource');
                troubleshooting.push('Some features require specific BambooHR subscription levels');
                break;
            case 404:
                code = MCP_ERROR_CODES.RESOURCE_NOT_FOUND;
                troubleshooting.push('The requested resource was not found');
                troubleshooting.push('Check the ID or endpoint');
                break;
            case 429:
                code = MCP_ERROR_CODES.RATE_LIMIT_EXCEEDED;
                troubleshooting.push('API rate limit exceeded');
                troubleshooting.push('Please wait before retrying');
                break;
            case 500:
            case 502:
            case 503:
                code = MCP_ERROR_CODES.NETWORK_ERROR;
                troubleshooting.push('BambooHR server error');
                troubleshooting.push('Try again later');
                break;
        }
    }
    const errorText = `API Error: ${message}

Endpoint: ${endpoint}
${statusCode ? `Status Code: ${statusCode}` : ''}

${troubleshooting.length > 0
        ? `Troubleshooting:
${troubleshooting.map((tip) => `• ${tip}`).join('\n')}`
        : ''}`;
    return {
        content: [
            {
                type: 'text',
                text: errorText,
                _meta: {
                    error: true,
                    errorCode: code,
                    endpoint,
                    statusCode,
                    troubleshooting,
                    timestamp: new Date().toISOString(),
                },
            },
        ],
        isError: true,
        _mcpError: {
            code,
            message,
            data: {
                endpoint,
                statusCode,
                troubleshooting,
            },
        },
    };
}
/**
 * Clears processed request IDs (for testing)
 */
export function clearProcessedRequestIds() {
    processedRequestIds.clear();
}
