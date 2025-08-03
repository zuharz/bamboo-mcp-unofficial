#!/usr/bin/env node
/**
 * BambooHR MCP Server (Unofficial Open Source) - 2025-06-18 Compliant
 *
 * Modern implementation using latest MCP SDK patterns with structured outputs,
 * progress tracking, and enhanced authorization support.
 *
 * This is an UNOFFICIAL, community-driven open source project.
 * NOT affiliated with, endorsed by, or connected to BambooHR LLC.
 * BambooHR® is a registered trademark of BambooHR LLC.
 *
 * Copyright (c) 2025 BambooHR MCP Contributors
 * Licensed under the MIT License - see LICENSE file for details
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { BambooClient } from './bamboo-client.js';
import { BAMBOO_TOOLS } from './config/toolDefinitions.js';
import { initializeToolRouter, getToolHandler, hasToolHandler, } from './config/toolRouter.js';
// Initialize domain-specific handlers
import { initializeEmployeeHandlers } from './handlers/employeeHandlers.js';
import { initializeTimeOffHandlers } from './handlers/timeOffHandlers.js';
import { initializeDatasetHandlers } from './handlers/datasetHandlers.js';
import { initializeWorkforceAnalyticsHandlers } from './handlers/workforceAnalyticsHandlers.js';
import { initializeReportHandlers } from './handlers/reportHandlers.js';
import { initializeOrganizationHandlers } from './handlers/organizationHandlers.js';
import * as formatters from './formatters.js';
import { extractProgressToken } from './utils/progressTracker.js';
import { mcpLogger } from './utils/mcpLogger.js';
// Enhanced logger with structured output for 2025-06-18 compliance
// Maintain compatibility with existing handler interface while adding structured logging
const logger = {
    debug: (msg, ...args) => {
        mcpLogger.debug('server', msg, args.length > 0 ? { additionalData: args } : undefined);
    },
    info: (msg, ...args) => mcpLogger.info('server', msg, args.length > 0 ? { additionalData: args } : undefined),
    warn: (msg, ...args) => mcpLogger.warn('server', msg, args.length > 0 ? { additionalData: args } : undefined),
    error: (msg, ...args) => mcpLogger.error('server', msg, args.length > 0 ? { additionalData: args } : undefined),
    fatal: (msg, ...args) => mcpLogger.error('server', `FATAL: ${msg}`, args.length > 0 ? { additionalData: args } : undefined),
    child: () => logger,
};
// Environment validation with enhanced security
const API_KEY = process.env.BAMBOO_API_KEY;
const SUBDOMAIN = process.env.BAMBOO_SUBDOMAIN;
if (!API_KEY || !SUBDOMAIN) {
    logger.fatal('Missing required environment variables:', `BAMBOO_API_KEY: ${!API_KEY ? 'missing' : 'present'}`, `BAMBOO_SUBDOMAIN: ${!SUBDOMAIN ? 'missing' : 'present'}`);
    process.exit(1);
}
if (API_KEY.trim() === '' || SUBDOMAIN.trim() === '') {
    logger.fatal('Environment variables cannot be empty:', `BAMBOO_API_KEY empty: ${API_KEY.trim() === ''}`, `BAMBOO_SUBDOMAIN empty: ${SUBDOMAIN.trim() === ''}`);
    process.exit(1);
}
// Validate subdomain format (security enhancement)
const subdomainPattern = /^[a-zA-Z0-9-]+$/;
if (!subdomainPattern.test(SUBDOMAIN)) {
    logger.fatal('Invalid BAMBOO_SUBDOMAIN format. Must contain only letters, numbers, and hyphens. Got:', SUBDOMAIN);
    process.exit(1);
}
// Initialize BambooHR client with environment configuration
const bambooClient = new BambooClient({
    apiKey: API_KEY,
    subdomain: SUBDOMAIN,
    ...(process.env.CACHE_TIMEOUT_MS && {
        cacheTimeoutMs: parseInt(process.env.CACHE_TIMEOUT_MS, 10),
    }),
});
// Initialize dependencies for domain-specific handlers
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
// Initialize tool router with real handlers
initializeToolRouter();
// Create modern MCP server with 2025-06-18 compliance
const server = new Server({
    name: 'bamboohr-mcp',
    version: '1.1.1',
    title: 'BambooHR MCP Server',
    description: 'Unofficial BambooHR integration for workforce analytics and HR data access',
}, {
    capabilities: {
        tools: {},
        elicitation: false, // Explicitly declare elicitation capability per 2025-06-18
    },
    instructions: `BambooHR MCP Server - Discovery-driven workforce analytics with 2025-06-18 compliance

Core Tools:
• bamboo_find_employee - Find employees by name/email/ID (enhanced with structured outputs)
• bamboo_whos_out - See who's on leave (with metadata)
• bamboo_team_info - Get department roster (with analytics metadata)
• bamboo_time_off_requests - View time-off requests

Discovery Tools (Use These First):
• bamboo_discover_datasets - See what datasets are available
• bamboo_discover_fields - See what fields are in each dataset

Analytics Tools:
• bamboo_workforce_analytics - Requires discovery first to get correct field names
• bamboo_run_custom_report - List and run pre-built custom reports

Additional Tools:
• bamboo_get_employee_photo - Get employee profile photos
• bamboo_list_departments - List all company departments

Features:
- Structured tool outputs with _meta fields and resource links
- Progress tracking support for long-running operations
- Enhanced error handling with MCP compliance
- Read-only access with comprehensive security validation

All tools are read-only. For analytics, always use discovery tools first to understand API structure.`,
});
// Set up MCP logger with server instance
mcpLogger.setServer(server);
mcpLogger.startup('info', 'BambooHR MCP Server initialized', {
    serverName: 'bamboohr-mcp',
    version: '1.1.1',
    toolCount: BAMBOO_TOOLS.length,
    handlerModules: [
        'employeeHandlers',
        'timeOffHandlers',
        'datasetHandlers',
        'workforceAnalyticsHandlers',
        'reportHandlers',
        'organizationHandlers',
    ],
});
// Modern MCP tool registration with enhanced structured outputs
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: BAMBOO_TOOLS,
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    // Extract context for 2025-06-18 compliance features
    const context = {
        _meta: {
            ...(request.params._meta || {}),
        },
    };
    // Extract progress token if present
    const progressToken = extractProgressToken(request);
    if (progressToken) {
        context._meta.progressToken = progressToken;
    }
    // Validate tool exists
    if (!hasToolHandler(name)) {
        throw new Error(`Unknown tool: ${name}. Available tools: ${BAMBOO_TOOLS.map((t) => t.name).join(', ')}`);
    }
    // Get and execute tool handler
    const handler = getToolHandler(name);
    try {
        mcpLogger.info('tool-execution', `Executing tool: ${name}`, {
            toolName: name,
            hasProgressToken: !!progressToken,
            argumentCount: Object.keys(args || {}).length,
            contextKeys: Object.keys(context._meta || {}),
        });
        const startTime = Date.now();
        const result = await handler(args || {}, context);
        const executionTime = Date.now() - startTime;
        mcpLogger.info('tool-execution', `Tool execution completed: ${name}`, {
            toolName: name,
            executionTimeMs: executionTime,
            hasResult: !!result,
            contentLength: result?.content?.length || 0,
        });
        // Enhance response with 2025-06-18 compliance metadata if not already present
        if (result && !result._meta && !result.content?.[0]?._meta) {
            if (result.content &&
                Array.isArray(result.content) &&
                result.content[0]) {
                result.content[0]._meta = {
                    ...result.content[0]._meta,
                    toolName: name,
                    executionTime: new Date().toISOString(),
                    protocolVersion: '2025-06-18',
                };
            }
        }
        return result;
    }
    catch (error) {
        mcpLogger.error('tool-execution', `Tool execution failed for ${name}`, {
            toolName: name,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            errorStack: error instanceof Error ? error.stack : undefined,
            arguments: args,
            context: context._meta,
        });
        // Enhanced error response with 2025-06-18 compliance
        return {
            content: [
                {
                    type: 'text',
                    text: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    _meta: {
                        toolName: name,
                        error: true,
                        timestamp: new Date().toISOString(),
                    },
                },
            ],
            isError: true,
            _mcpError: {
                code: -32603,
                message: error instanceof Error ? error.message : 'Unknown error',
                data: { toolName: name, context },
            },
        };
    }
});
// Start server with enhanced error handling
async function main() {
    try {
        logger.info('Starting BambooHR MCP Server with 2025-06-18 compliance...');
        logger.debug('Server configuration:', {
            apiKeyLength: API_KEY?.length || 0,
            subdomain: SUBDOMAIN,
            toolCount: BAMBOO_TOOLS.length,
            protocolVersion: '2025-06-18',
        });
        const transport = new StdioServerTransport();
        await server.connect(transport);
        logger.info('MCP server connected successfully and ready for requests');
        logger.info(`Registered ${BAMBOO_TOOLS.length} tools with enhanced 2025-06-18 features`);
    }
    catch (error) {
        logger.fatal('Failed to start MCP server:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
// Graceful shutdown with cleanup
process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully');
    bambooClient.clearCache();
    process.exit(0);
});
// Enhanced error handling
process.on('uncaughtException', (error) => {
    logger.fatal('Uncaught exception occurred:', error.message);
    if (error.stack) {
        logger.debug('Stack trace:', error.stack);
    }
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    logger.fatal('Unhandled promise rejection:', reason instanceof Error ? reason.message : reason);
    process.exit(1);
});
// Launch server
logger.info('Initializing BambooHR MCP server, PID:', process.pid);
main().catch((error) => {
    logger.fatal('Main function failed to start:', error instanceof Error ? error.message : error);
    process.exit(1);
});
