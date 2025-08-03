/**
 * Organization and team management handlers for BambooHR MCP server
 * Handles department listings and team information operations
 */
import * as formatters from '../formatters.js';
import { mcpLogger } from '../utils/mcpLogger.js';
import { handleBambooError } from '../utils/errorHandler.js';
// Import dependencies (will be passed via DI)
let bambooClient;
let logger;
export function initializeOrganizationHandlers(dependencies) {
    bambooClient = dependencies.bambooClient;
    logger = dependencies.logger;
    mcpLogger.organization('info', 'Organization handlers initialized successfully');
    return true;
}
export async function handleTeamInfo(args, _context = {}) {
    try {
        const department = args.department;
        if (!department ||
            typeof department !== 'string' ||
            department.trim() === '') {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Missing required parameter: department. Provide department name to get team roster for.',
                    },
                ],
            };
        }
        const employees = await bambooClient.get('/employees/directory?fields=firstName,lastName,workEmail,jobTitle,department');
        const teamMembers = employees.employees?.filter((emp) => emp.department?.toLowerCase().includes(department.toLowerCase())) || [];
        if (!teamMembers.length) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `No employees found in department "${department}"`,
                    },
                ],
            };
        }
        const text = formatters.formatEmployeeList(teamMembers, `${department} Team`);
        return {
            content: [
                {
                    type: 'text',
                    text,
                    _meta: {
                        department,
                        employeeCount: teamMembers.length,
                        timestamp: new Date().toISOString(),
                    },
                },
            ],
        };
    }
    catch (error) {
        return handleBambooError(error instanceof Error ? error : new Error(String(error)), 'team info retrieval', 'bamboo_team_info', {
            parameters: { department: args.department },
            endpoint: '/employees/directory',
        });
    }
}
export async function handleListDepartments(_args, context = {}) {
    try {
        // Support both direct progressToken and _meta.progressToken
        const progressToken = context.progressToken || context._meta?.progressToken;
        // Progress tracking
        const sendProgress = async (progress, total, message) => {
            if (progressToken) {
                logger.debug(`Progress ${progress}/${total}: ${message}`);
            }
            // Also call the mock function if present and enabled (for testing)
            if (context.sendProgress && context.isEnabled) {
                await context.sendProgress(progress, total, message);
            }
        };
        await sendProgress(25, 100, 'Fetching employee directory');
        // Use employee directory endpoint to get department data
        const employees = await bambooClient.get('/employees/directory?fields=department');
        const employeeData = employees;
        if (!employeeData?.employees || !Array.isArray(employeeData.employees)) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Could not retrieve employee data for departments.',
                        _meta: {
                            error: true,
                            errorType: 'invalid_response',
                            timestamp: new Date().toISOString(),
                        },
                    },
                ],
            };
        }
        await sendProgress(75, 100, 'Processing department data');
        // Extract unique departments from employee data with analytics
        const departmentMap = new Map();
        let totalEmployees = 0;
        employeeData.employees.forEach((emp) => {
            if (emp.department && emp.department.trim()) {
                const dept = emp.department.trim();
                departmentMap.set(dept, (departmentMap.get(dept) || 0) + 1);
                totalEmployees++;
            }
        });
        const departments = Array.from(departmentMap.keys()).sort();
        if (departments.length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'No departments found in employee data.',
                        _meta: {
                            departmentCount: 0,
                            employeeCount: employeeData.employees.length,
                            timestamp: new Date().toISOString(),
                        },
                    },
                ],
            };
        }
        await sendProgress(100, 100, 'Department analysis complete');
        // Generate analytics-rich department list
        const departmentAnalytics = departments
            .map((dept) => {
            const count = departmentMap.get(dept);
            const percentage = ((count / totalEmployees) * 100).toFixed(1);
            return `• **${dept}** - ${count} employees (${percentage}%)`;
        })
            .join('\n');
        const text = `**Available Departments (${departments.length}):**

${departmentAnalytics}

**Summary:**
- Total Departments: ${departments.length}
- Total Employees: ${totalEmployees}
- Average Department Size: ${Math.round(totalEmployees / departments.length)}`;
        return {
            content: [
                {
                    type: 'text',
                    text,
                    _meta: {
                        departmentCount: departments.length,
                        employeeCount: totalEmployees,
                        averageDepartmentSize: Math.round(totalEmployees / departments.length),
                        operation: 'list_departments',
                        timestamp: new Date().toISOString(),
                        analytics: {
                            departments: Array.from(departmentMap.entries()).map(([name, count]) => ({
                                name,
                                employeeCount: count,
                                percentage: ((count / totalEmployees) * 100).toFixed(1),
                            })),
                        },
                    },
                },
            ],
            _links: {
                related: departments.map((dept) => ({
                    href: `department://${encodeURIComponent(dept)}`,
                    title: `${dept} Department`,
                    rel: 'department',
                })),
            },
        };
    }
    catch (error) {
        return handleBambooError(error instanceof Error ? error : new Error(String(error)), 'departments listing', 'bamboo_list_departments', {
            endpoint: '/employees/directory',
        });
    }
}
