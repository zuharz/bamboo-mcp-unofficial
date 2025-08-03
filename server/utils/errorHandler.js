/**
 * Advanced Error Handling Framework
 * Provides categorized error handling with user-friendly messages and troubleshooting steps
 */
import { mcpLogger } from './mcpLogger.js';
export var BambooErrorType;
(function (BambooErrorType) {
    // API-related errors
    BambooErrorType["API_ERROR"] = "API_ERROR";
    BambooErrorType["RATE_LIMIT"] = "RATE_LIMIT";
    BambooErrorType["AUTHENTICATION"] = "AUTHENTICATION";
    // Data-related errors
    BambooErrorType["NOT_FOUND"] = "NOT_FOUND";
    BambooErrorType["VALIDATION"] = "VALIDATION";
    // Infrastructure errors
    BambooErrorType["NETWORK_ERROR"] = "NETWORK_ERROR";
    BambooErrorType["TIMEOUT_ERROR"] = "TIMEOUT_ERROR";
    // Unknown errors
    BambooErrorType["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(BambooErrorType || (BambooErrorType = {}));
class BambooErrorHandler {
    httpStatusMessages = {
        400: BambooErrorType.VALIDATION,
        401: BambooErrorType.AUTHENTICATION,
        403: BambooErrorType.AUTHENTICATION,
        404: BambooErrorType.NOT_FOUND,
        429: BambooErrorType.RATE_LIMIT,
        500: BambooErrorType.API_ERROR,
        502: BambooErrorType.API_ERROR,
        503: BambooErrorType.API_ERROR,
        504: BambooErrorType.TIMEOUT_ERROR,
    };
    /**
     * Categorize error based on error message and patterns
     */
    categorizeError(error) {
        const message = error.message.toLowerCase();
        // HTTP status code patterns
        for (const [status, errorType] of Object.entries(this.httpStatusMessages)) {
            if (message.includes(status) || message.includes(`${status}`)) {
                return errorType;
            }
        }
        // HTTP status name patterns
        if (message.includes('unauthorized') ||
            message.includes('forbidden') ||
            message.includes('invalid credentials')) {
            return BambooErrorType.AUTHENTICATION;
        }
        if (message.includes('rate limit') ||
            message.includes('too many requests')) {
            return BambooErrorType.RATE_LIMIT;
        }
        if (message.includes('not found') || message.includes('does not exist')) {
            return BambooErrorType.NOT_FOUND;
        }
        if (message.includes('bad request') ||
            message.includes('invalid parameter') ||
            message.includes('validation')) {
            return BambooErrorType.VALIDATION;
        }
        // Network patterns
        if (message.includes('network') ||
            message.includes('enotfound') ||
            message.includes('econnrefused') ||
            message.includes('connection refused')) {
            return BambooErrorType.NETWORK_ERROR;
        }
        if (message.includes('timeout') ||
            message.includes('etimedout') ||
            message.includes('request timeout')) {
            return BambooErrorType.TIMEOUT_ERROR;
        }
        // BambooHR specific patterns
        if (message.includes('api key') ||
            message.includes('subdomain') ||
            message.includes('bamboohr')) {
            return BambooErrorType.AUTHENTICATION;
        }
        // Default to API error for unknown patterns
        return BambooErrorType.API_ERROR;
    }
    /**
     * Generate user-friendly error message
     */
    generateUserMessage(errorType, operation) {
        const messages = {
            [BambooErrorType.AUTHENTICATION]: `Authentication failed for ${operation}. Please verify your BambooHR API key and subdomain.`,
            [BambooErrorType.RATE_LIMIT]: `Rate limit exceeded for ${operation}. The request will be retried automatically.`,
            [BambooErrorType.NOT_FOUND]: `No data found for ${operation}. Please verify your search criteria.`,
            [BambooErrorType.VALIDATION]: `Invalid parameters provided for ${operation}. Please check your input.`,
            [BambooErrorType.NETWORK_ERROR]: `Network error during ${operation}. Please check your internet connection.`,
            [BambooErrorType.TIMEOUT_ERROR]: `Request timeout during ${operation}. The operation took too long to complete.`,
            [BambooErrorType.API_ERROR]: `BambooHR API error during ${operation}. Please try again later.`,
            [BambooErrorType.UNKNOWN_ERROR]: `Unexpected error during ${operation}. Please contact support if this persists.`,
        };
        return messages[errorType] || messages[BambooErrorType.UNKNOWN_ERROR];
    }
    /**
     * Get troubleshooting steps for error type
     */
    getTroubleshootingSteps(errorType) {
        const steps = {
            [BambooErrorType.AUTHENTICATION]: [
                'Verify BAMBOO_API_KEY is correctly set',
                'Verify BAMBOO_SUBDOMAIN matches your BambooHR instance',
                'Check that your API key has not expired',
                'Ensure your API key has the required permissions',
                'Confirm subdomain format (no .bamboohr.com suffix)',
            ],
            [BambooErrorType.RATE_LIMIT]: [
                'Wait a moment and try again',
                'Consider reducing the frequency of requests',
                'Check if other tools are using the same API key',
                'Monitor rate limit headers in responses',
            ],
            [BambooErrorType.NOT_FOUND]: [
                'Verify the employee/data exists in BambooHR',
                'Check spelling and format of search terms',
                'Try broader search criteria',
                'Confirm you have access to the requested data',
            ],
            [BambooErrorType.VALIDATION]: [
                'Check parameter format (dates should be YYYY-MM-DD)',
                'Verify required parameters are provided',
                'Check parameter value ranges and constraints',
                'Ensure parameter types match expected values',
            ],
            [BambooErrorType.NETWORK_ERROR]: [
                'Check your internet connection',
                'Verify you can access https://api.bamboohr.com',
                'Check firewall and proxy settings',
                'Test DNS resolution for api.bamboohr.com',
            ],
            [BambooErrorType.TIMEOUT_ERROR]: [
                'Try again with a smaller date range',
                'Consider breaking large requests into smaller ones',
                'Check your network connection speed',
                'Verify server is not under heavy load',
            ],
            [BambooErrorType.API_ERROR]: [
                'Check BambooHR service status',
                'Try again in a few minutes',
                'Verify your request format is correct',
                'Contact BambooHR support if issue persists',
            ],
            [BambooErrorType.UNKNOWN_ERROR]: [
                'Check the server logs for more details',
                'Try again in a few minutes',
                'Contact support with error details',
                'Provide the exact operation that failed',
            ],
        };
        return steps[errorType] || steps[BambooErrorType.UNKNOWN_ERROR];
    }
    /**
     * Check if error type is retryable
     */
    isRetryable(errorType) {
        return [
            BambooErrorType.RATE_LIMIT,
            BambooErrorType.NETWORK_ERROR,
            BambooErrorType.TIMEOUT_ERROR,
            BambooErrorType.API_ERROR,
        ].includes(errorType);
    }
    /**
     * Get retry delay in milliseconds for retryable errors
     */
    getRetryDelay(errorType, attempt = 1) {
        const baseDelays = {
            [BambooErrorType.RATE_LIMIT]: 5000, // 5 seconds base
            [BambooErrorType.NETWORK_ERROR]: 1000, // 1 second base
            [BambooErrorType.TIMEOUT_ERROR]: 2000, // 2 seconds base
            [BambooErrorType.API_ERROR]: 3000, // 3 seconds base
            [BambooErrorType.AUTHENTICATION]: 0,
            [BambooErrorType.NOT_FOUND]: 0,
            [BambooErrorType.VALIDATION]: 0,
            [BambooErrorType.UNKNOWN_ERROR]: 1000,
        };
        const baseDelay = baseDelays[errorType] || 1000;
        // Exponential backoff with jitter
        return baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
    }
    /**
     * Main error handling method
     */
    handleError(error, context) {
        const errorType = this.categorizeError(error);
        const userMessage = this.generateUserMessage(errorType, context.operation);
        const troubleshooting = this.getTroubleshootingSteps(errorType);
        const isRetryable = this.isRetryable(errorType);
        // Log structured error data
        mcpLogger.error(context.toolName, `${context.operation} failed`, {
            errorType,
            isRetryable,
            operation: context.operation,
            endpoint: context.endpoint,
            originalError: error.message,
            parameters: context.parameters,
            additionalInfo: context.additionalInfo,
            stack: error.stack,
        });
        const troubleshootingText = troubleshooting
            .map((step, index) => `${index + 1}. ${step}`)
            .join('\n');
        const retryNote = isRetryable
            ? '\n**Note:** This error may be temporary and could resolve with a retry.'
            : '\n**Note:** This error requires manual intervention.';
        return {
            content: [
                {
                    type: 'text',
                    text: `**${userMessage}**

**Troubleshooting Steps:**
${troubleshootingText}${retryNote}`,
                    _meta: {
                        error: true,
                        errorType,
                        isRetryable,
                        operation: context.operation,
                        toolName: context.toolName,
                        timestamp: new Date().toISOString(),
                        retryDelay: isRetryable ? this.getRetryDelay(errorType) : undefined,
                    },
                },
            ],
        };
    }
    /**
     * Create error result without MCP response (for internal use)
     */
    analyzeError(error, context) {
        const errorType = this.categorizeError(error);
        const userMessage = this.generateUserMessage(errorType, context.operation);
        const troubleshooting = this.getTroubleshootingSteps(errorType);
        const isRetryable = this.isRetryable(errorType);
        return {
            userMessage,
            errorType,
            isRetryable,
            troubleshooting,
            technicalDetails: error.message,
        };
    }
}
// Global error handler instance
export const bambooErrorHandler = new BambooErrorHandler();
/**
 * Convenience function for easy adoption in handlers
 */
export function handleBambooError(error, operation, toolName, additionalContext) {
    return bambooErrorHandler.handleError(error, {
        operation,
        toolName,
        ...additionalContext,
    });
}
/**
 * Convenience function for error analysis without response generation
 */
export function analyzeBambooError(error, operation, toolName, additionalContext) {
    return bambooErrorHandler.analyzeError(error, {
        operation,
        toolName,
        ...additionalContext,
    });
}
