/**
 * Tool router for dispatching tool calls to handlers
 * MCP 2025-06-18 compliant routing system
 */
import { handleFindEmployee, handleWhosOut, handleTeamInfo, handleTimeOffRequests, handleDiscoverDatasets, handleDiscoverFields, handleWorkforceAnalytics, handleRunCustomReport, handleGetEmployeePhoto, handleListDepartments, } from '../handlers/bambooHandlers.js';
// Tool handler registry
const toolHandlers = new Map();
/**
 * Initialize the tool router with all available handlers
 */
export function initializeToolRouter() {
    // Core HR tools
    toolHandlers.set('bamboo_find_employee', handleFindEmployee);
    toolHandlers.set('bamboo_whos_out', handleWhosOut);
    toolHandlers.set('bamboo_team_info', handleTeamInfo);
    toolHandlers.set('bamboo_time_off_requests', handleTimeOffRequests);
    // Discovery tools
    toolHandlers.set('bamboo_discover_datasets', handleDiscoverDatasets);
    toolHandlers.set('bamboo_discover_fields', handleDiscoverFields);
    // Analytics tools (previously placeholders, now fully implemented)
    toolHandlers.set('bamboo_workforce_analytics', handleWorkforceAnalytics);
    toolHandlers.set('bamboo_run_custom_report', handleRunCustomReport);
    toolHandlers.set('bamboo_get_employee_photo', handleGetEmployeePhoto);
    toolHandlers.set('bamboo_list_departments', handleListDepartments);
    return toolHandlers.size;
}
/**
 * Get a tool handler by name
 */
export function getToolHandler(toolName) {
    const handler = toolHandlers.get(toolName);
    if (!handler) {
        throw new Error(`Tool handler not found: ${toolName}`);
    }
    return handler;
}
/**
 * Check if a tool handler exists
 */
export function hasToolHandler(toolName) {
    return toolHandlers.has(toolName);
}
/**
 * Get all registered tool names
 */
export function getRegisteredTools() {
    return Array.from(toolHandlers.keys());
}
/**
 * Get tool handler registry size
 */
export function getHandlerCount() {
    return toolHandlers.size;
}
/**
 * Get all available tools (alias for getRegisteredTools for backward compatibility)
 */
export function getAvailableTools() {
    return getRegisteredTools();
}
