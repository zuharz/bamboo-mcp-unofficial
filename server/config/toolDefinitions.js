/**
 * Tool definitions for MCP 2025-06-18 compliance
 */
export const BAMBOO_TOOLS = [
    {
        name: 'bamboo_find_employee',
        title: 'Find Employee',
        description: 'Find employee by name, email, or ID with support for partial name matches',
        inputSchema: {
            type: 'object',
            properties: {
                query: {
                    type: 'string',
                    description: 'Employee name, email, or ID to search for. Examples: "John Smith", "john.smith@company.com", "123"',
                },
            },
            required: ['query'],
            additionalProperties: false,
        },
    },
    {
        name: 'bamboo_whos_out',
        title: "Who's Out",
        description: 'See who is out on leave today or in date range. Defaults to today if no dates provided.',
        inputSchema: {
            type: 'object',
            properties: {
                start_date: {
                    type: 'string',
                    description: 'Start date in YYYY-MM-DD format (optional, defaults to today). Example: "2024-01-15"',
                },
                end_date: {
                    type: 'string',
                    description: 'End date in YYYY-MM-DD format (optional, defaults to start_date). Example: "2024-01-20"',
                },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'bamboo_team_info',
        title: 'Team Information',
        description: 'Get team/department roster with employee details including job titles and contact info',
        inputSchema: {
            type: 'object',
            properties: {
                department: {
                    type: 'string',
                    description: 'Department name to get roster for. Supports partial matching. Examples: "Engineering", "Product", "QA", "Sales"',
                },
            },
            required: ['department'],
            additionalProperties: false,
        },
    },
    {
        name: 'bamboo_time_off_requests',
        title: 'Time Off Requests',
        description: 'Get time-off requests for date range',
        inputSchema: {
            type: 'object',
            properties: {
                start_date: {
                    type: 'string',
                    description: 'Start date in YYYY-MM-DD format (required)',
                },
                end_date: {
                    type: 'string',
                    description: 'End date in YYYY-MM-DD format (required)',
                },
                status: {
                    type: 'string',
                    description: 'Filter by request status (approved, denied, pending, all). Defaults to all',
                },
            },
            required: ['start_date', 'end_date'],
            additionalProperties: false,
        },
    },
    {
        name: 'bamboo_discover_datasets',
        title: 'Discover Datasets',
        description: 'Discover what datasets are available in BambooHR for analytics',
        inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
        },
    },
    {
        name: 'bamboo_discover_fields',
        title: 'Discover Fields',
        description: 'Discover what fields are available in a specific dataset for use in workforce analytics',
        inputSchema: {
            type: 'object',
            properties: {
                dataset_id: {
                    type: 'string',
                    description: 'Dataset ID to explore (use bamboo_discover_datasets first to get IDs). Examples: "employee", "time_off", "performance"',
                },
            },
            required: ['dataset_id'],
            additionalProperties: false,
        },
    },
    {
        name: 'bamboo_workforce_analytics',
        title: 'Workforce Analytics',
        description: 'Get workforce analytics data from BambooHR datasets - use discovery tools first to find correct dataset and field names',
        inputSchema: {
            type: 'object',
            properties: {
                dataset_id: {
                    type: 'string',
                    description: 'Dataset ID (use bamboo_discover_datasets to find available datasets)',
                },
                fields: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of field names to retrieve (use bamboo_discover_fields to find available fields)',
                },
                filters: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            field: { type: 'string' },
                            operator: { type: 'string' },
                            value: {},
                        },
                        required: ['field', 'operator', 'value'],
                    },
                    description: 'Optional filters to apply to the data',
                },
                group_by: {
                    type: 'string',
                    description: 'Optional field name to group results by',
                },
            },
            required: ['dataset_id', 'fields'],
            additionalProperties: false,
        },
    },
    {
        name: 'bamboo_run_custom_report',
        title: 'Run Custom Report',
        description: 'List available custom reports or run a specific report by ID with multiple output formats',
        inputSchema: {
            type: 'object',
            properties: {
                list_reports: {
                    type: 'boolean',
                    description: 'Set to true to list all available custom reports. Example: {"list_reports": true}',
                },
                report_id: {
                    type: 'string',
                    description: 'ID of specific report to run (get from list_reports first). Example: {"report_id": "123"}',
                },
                format: {
                    type: 'string',
                    enum: ['json', 'csv', 'pdf'],
                    description: 'Output format for the report (defaults to json). Example: {"report_id": "123", "format": "json"}',
                },
            },
            additionalProperties: false,
        },
    },
    {
        name: 'bamboo_get_employee_photo',
        title: 'Get Employee Photo',
        description: 'Get the profile photo for a specific employee by their ID',
        inputSchema: {
            type: 'object',
            properties: {
                employee_id: {
                    type: 'string',
                    description: 'Employee ID to get photo for. Use bamboo_find_employee to get the ID first.',
                },
            },
            required: ['employee_id'],
            additionalProperties: false,
        },
    },
    {
        name: 'bamboo_list_departments',
        title: 'List Departments',
        description: 'Get a list of all departments in the company',
        inputSchema: {
            type: 'object',
            properties: {},
            additionalProperties: false,
        },
    },
];
