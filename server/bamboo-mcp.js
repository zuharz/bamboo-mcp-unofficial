#!/usr/bin/env node
/**
 * Unified BambooHR MCP Server bootstrap
 * - Initializes BambooHR client and all handlers
 * - Registers tools that delegate to the centralized tool router
 * - Starts MCP server over stdio
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import * as formatters from './formatters.js';
import { BambooClient } from './bamboo-client.js';
// Photo resource/proxy removed; base64 HTML response is the single supported method
import { initializeEmployeeHandlers } from './handlers/employeeHandlers.js';
import { initializeTimeOffHandlers } from './handlers/timeOffHandlers.js';
import { initializeDatasetHandlers } from './handlers/datasetHandlers.js';
import { initializeWorkforceAnalyticsHandlers } from './handlers/workforceAnalyticsHandlers.js';
import { initializeReportHandlers } from './handlers/reportHandlers.js';
import { initializeOrganizationHandlers } from './handlers/organizationHandlers.js';
import { initializeToolRouter, getToolHandler } from './config/toolRouter.js';
const logger = {
    debug: (msg, ...args) => {
        if (process.env.NODE_ENV !== 'production') {
            console.error('[DEBUG]', msg, ...args);
        }
    },
    info: (msg, ...args) => console.error('[INFO]', msg, ...args),
    warn: (msg, ...args) => console.error('[WARN]', msg, ...args),
    error: (msg, ...args) => console.error('[ERROR]', msg, ...args),
    fatal: (msg, ...args) => console.error('[FATAL]', msg, ...args),
    child: () => logger,
};
// ----------------------------------------------------------------------------
// Environment and client setup
// ----------------------------------------------------------------------------
const API_KEY = process.env.BAMBOO_API_KEY;
const SUBDOMAIN = process.env.BAMBOO_SUBDOMAIN;
if (!API_KEY || !SUBDOMAIN) {
    logger.fatal('Missing required environment variables - BAMBOO_API_KEY:', !API_KEY, 'BAMBOO_SUBDOMAIN:', !SUBDOMAIN);
    process.exit(1);
}
if (API_KEY.trim() === '' || SUBDOMAIN.trim() === '') {
    logger.fatal('Environment variables cannot be empty - BAMBOO_API_KEY empty:', API_KEY.trim() === '', 'BAMBOO_SUBDOMAIN empty:', SUBDOMAIN.trim() === '');
    process.exit(1);
}
const subdomainPattern = /^[a-zA-Z0-9-]+$/;
if (!subdomainPattern.test(SUBDOMAIN)) {
    logger.fatal('Invalid BAMBOO_SUBDOMAIN format. Must contain only letters, numbers, and hyphens. Got:', SUBDOMAIN);
    process.exit(1);
}
logger.info('Debug - API_KEY length:', API_KEY.length, 'SUBDOMAIN:', SUBDOMAIN);
logger.info('Debug - API_KEY starts with:', API_KEY.substring(0, 10));
logger.info('Debug - Base64 test:', Buffer.from(`${API_KEY}:x`).toString('base64').substring(0, 20));
const bambooClient = new BambooClient({
    apiKey: API_KEY,
    subdomain: SUBDOMAIN,
    ...(process.env.CACHE_TIMEOUT_MS && {
        cacheTimeoutMs: parseInt(process.env.CACHE_TIMEOUT_MS, 10),
    }),
});
// ----------------------------------------------------------------------------
// Initialize domain handlers and router (Dependency Injection)
// ----------------------------------------------------------------------------
const handlerDependencies = {
    bambooClient,
    formatters,
    logger,
};
initializeEmployeeHandlers(handlerDependencies);
initializeTimeOffHandlers(handlerDependencies);
initializeDatasetHandlers(handlerDependencies);
initializeWorkforceAnalyticsHandlers(handlerDependencies);
initializeReportHandlers(handlerDependencies);
initializeOrganizationHandlers(handlerDependencies);
initializeToolRouter();
// ----------------------------------------------------------------------------
// MCP server and tool registration (delegating to router)
// ----------------------------------------------------------------------------
const server = new McpServer({ name: 'bamboohr-mcp', version: '1.0.0' }, {
    capabilities: { tools: {}, resources: {} },
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
});
// Use untyped handle for tool registration to accommodate custom response shapes
const s = server;
// No external resource providers are required for base64 response
// Tool: bamboo_find_employee
s.tool('bamboo_find_employee', 'Find employee by name, email, or ID with support for partial name matches', {
    query: z
        .string()
        .describe('Employee name, email, or ID to search for. Examples: "John Smith", "john.smith@company.com", "123"'),
}, async (args) => {
    try {
        const handler = getToolHandler('bamboo_find_employee');
        return await handler(args);
    }
    catch (error) {
        return formatters.formatErrorResponse(error, 'Employee search failed');
    }
});
// Tool: bamboo_whos_out
s.tool('bamboo_whos_out', 'See who is out on leave today or in date range. Defaults to today if no dates provided.', {
    start_date: z
        .string()
        .optional()
        .describe('Start date in YYYY-MM-DD format (optional, defaults to today). Example: "2024-01-15"'),
    end_date: z
        .string()
        .optional()
        .describe('End date in YYYY-MM-DD format (optional, defaults to start_date). Example: "2024-01-20"'),
}, async (args) => {
    try {
        const handler = getToolHandler('bamboo_whos_out');
        return await handler(args);
    }
    catch (error) {
        return formatters.formatErrorResponse(error, "Who's out calendar failed");
    }
});
// Tool: bamboo_team_info
s.tool('bamboo_team_info', 'Get team/department roster with employee details including job titles and contact info', {
    department: z
        .string()
        .describe('Department name to get roster for. Supports partial matching. Examples: "Engineering", "Product", "QA", "Sales"'),
}, async (args) => {
    try {
        const handler = getToolHandler('bamboo_team_info');
        return await handler(args);
    }
    catch (error) {
        return formatters.formatErrorResponse(error, 'Team info retrieval failed');
    }
});
// Tool: bamboo_time_off_requests
s.tool('bamboo_time_off_requests', 'Get time-off requests for date range', {
    start_date: z
        .string()
        .describe('Start date in YYYY-MM-DD format (required)'),
    end_date: z.string().describe('End date in YYYY-MM-DD format (required)'),
    status: z
        .string()
        .optional()
        .describe('Filter by request status (approved, denied, pending, all). Defaults to all'),
}, async (args) => {
    try {
        const handler = getToolHandler('bamboo_time_off_requests');
        return await handler(args);
    }
    catch (error) {
        return formatters.formatErrorResponse(error, 'Time-off requests retrieval failed');
    }
});
// Tool: bamboo_discover_datasets
s.tool('bamboo_discover_datasets', 'Discover what datasets are available in BambooHR for analytics', async () => {
    try {
        const handler = getToolHandler('bamboo_discover_datasets');
        return await handler({});
    }
    catch (error) {
        return formatters.formatErrorResponse(error, 'Dataset discovery failed');
    }
});
// Tool: bamboo_discover_fields
s.tool('bamboo_discover_fields', 'Discover what fields are available in a specific dataset for use in workforce analytics', {
    dataset_id: z
        .string()
        .describe('Dataset ID to explore (use bamboo_discover_datasets first to get IDs). Examples: "employee", "time_off", "performance"'),
}, async (args) => {
    try {
        const handler = getToolHandler('bamboo_discover_fields');
        return await handler(args);
    }
    catch (error) {
        return formatters.formatErrorResponse(error, 'Field discovery failed');
    }
});
// Tool: bamboo_workforce_analytics
s.tool('bamboo_workforce_analytics', 'Get workforce analytics data from BambooHR datasets - use discovery tools first to find correct dataset and field names', {
    dataset_id: z
        .string()
        .describe('Dataset ID (use bamboo_discover_datasets to find available datasets)'),
    fields: z
        .array(z.string())
        .describe('Array of field names to retrieve (use bamboo_discover_fields to find available fields)'),
    filters: z
        .array(z.object({
        field: z.string(),
        operator: z.string(),
        value: z.any(),
    }))
        .optional()
        .describe('Optional filters to apply to the data'),
    group_by: z
        .string()
        .optional()
        .describe('Optional field name to group results by'),
}, async (args) => {
    try {
        const handler = getToolHandler('bamboo_workforce_analytics');
        return await handler(args);
    }
    catch (error) {
        return formatters.formatErrorResponse(error, 'Workforce analytics failed');
    }
});
// Tool: bamboo_run_custom_report
s.tool('bamboo_run_custom_report', 'List available custom reports or run a specific report by ID with multiple output formats', {
    list_reports: z
        .boolean()
        .optional()
        .describe('Set to true to list all available custom reports. Example: {"list_reports": true}'),
    report_id: z
        .string()
        .optional()
        .describe('ID of specific report to run (get from list_reports first). Example: {"report_id": "123"}'),
    format: z
        .enum(['json', 'csv', 'pdf'])
        .optional()
        .describe('Output format for the report (defaults to json). Example: {"report_id": "123", "format": "json"}'),
}, async (args) => {
    try {
        const handler = getToolHandler('bamboo_run_custom_report');
        return await handler(args);
    }
    catch (error) {
        return formatters.formatErrorResponse(error, 'Custom report failed');
    }
});
// Tool: bamboo_get_employee_photo
s.tool('bamboo_get_employee_photo', 'Get the profile photo for a specific employee by their ID. Returns actual image data as base64 for display or URL for external use.', {
    employee_id: z
        .string()
        .describe('Employee ID to get photo for. Use bamboo_find_employee to get the ID first.'),
    return_base64: z
        .boolean()
        .optional()
        .default(true)
        .describe('Whether to return base64 image data for display (true) or just the authenticated URL (false). Defaults to true.'),
    size: z
        .enum(['large', 'medium', 'small', 'xs', 'tiny'])
        .optional()
        .default('small')
        .describe('Photo size to retrieve. Smaller sizes help avoid message limits.'),
}, async (args) => {
    try {
        const handler = getToolHandler('bamboo_get_employee_photo');
        return await handler(args);
    }
    catch (error) {
        return formatters.formatErrorResponse(error, 'Get employee photo failed');
    }
});
// Removed experimental resource/image tools in favor of a single stable method
// Tool: bamboo_list_departments
s.tool('bamboo_list_departments', 'Get a list of all departments in the company', async () => {
    try {
        const handler = getToolHandler('bamboo_list_departments');
        return await handler({});
    }
    catch (error) {
        return formatters.formatErrorResponse(error, 'List departments failed');
    }
});
// ----------------------------------------------------------------------------
// Startup and shutdown
// ----------------------------------------------------------------------------
async function main() {
    try {
        const transport = new StdioServerTransport();
        logger.debug('Connecting server to transport');
        await server.connect(transport);
        logger.info('MCP server connected successfully and ready for requests');
    }
    catch (error) {
        logger.fatal('Failed to start MCP server:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully');
    bambooClient.clearCache();
    process.exit(0);
});
process.on('uncaughtException', (error) => {
    logger.fatal('Uncaught exception occurred:', error.message);
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    logger.fatal('Unhandled promise rejection:', msg);
    process.exit(1);
});
logger.info('Starting BambooHR MCP server, PID:', process.pid);
void main();
