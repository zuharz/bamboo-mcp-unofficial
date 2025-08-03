/**
 * Formatting utility functions for BambooHR MCP Server
 *
 * This file contains pure formatting functions that transform data
 * into human-readable text for Claude Desktop responses.
 *
 * All functions are pure (no side effects) and easily testable.
 */
// =============================================================================
// Error Formatting Functions
// =============================================================================
/**
 * Creates a standardized error response for MCP tools
 */
export function formatErrorResponse(error, context) {
    let message = 'Unknown error';
    if (error instanceof Error) {
        message = error.message;
    }
    else if (typeof error === 'string') {
        message = error;
    }
    else if (error && typeof error === 'object') {
        // Handle complex error objects better
        try {
            const errorObj = error;
            if (errorObj.message) {
                message = String(errorObj.message);
            }
            else if (errorObj.error) {
                message = String(errorObj.error);
            }
            else {
                message = JSON.stringify(error, null, 2);
            }
        }
        catch {
            message = String(error);
        }
    }
    else {
        message = String(error);
    }
    const errorText = context
        ? `ERROR: ${context}\n\n${message}`
        : `ERROR: ${message}`;
    return { content: [{ type: 'text', text: errorText }] };
}
/**
 * Creates a detailed API error response with troubleshooting tips
 */
export function formatApiErrorResponse(error, endpoint, statusCode) {
    const message = error instanceof Error ? error.message : 'Unknown API error';
    let troubleshooting = '';
    if (statusCode) {
        switch (statusCode) {
            case 400:
                troubleshooting =
                    '\n\nTIP: Check your request parameters for correct format.';
                break;
            case 403:
                troubleshooting =
                    '\n\nTIP: Your API key may lack permissions for this resource. Some features require specific BambooHR subscription levels or admin privileges.';
                break;
            case 404:
                troubleshooting =
                    '\n\nTIP: The requested resource was not found. Check the ID or endpoint.';
                break;
            case 429:
                troubleshooting =
                    '\n\nTIP: API rate limit exceeded. Please wait before retrying.';
                break;
            case 500:
                troubleshooting = '\n\nTIP: BambooHR server error. Try again later.';
                break;
        }
    }
    const errorText = `ERROR: **API Request Failed**

Endpoint: ${endpoint}
${statusCode ? `Status: ${statusCode}` : ''}
Message: ${message}${troubleshooting}`;
    return { content: [{ type: 'text', text: errorText }] };
}
// =============================================================================
// Employee Formatting Functions
// =============================================================================
/**
 * Formats a list of employees into a readable text list
 */
export function formatEmployeeList(employees, title) {
    if (employees.length === 0) {
        return title
            ? `**${title}**\n\nNo employees found.`
            : 'No employees found.';
    }
    const employeeList = employees
        .map((emp) => {
        const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown Name';
        const title = emp.jobTitle || 'Not available';
        const email = emp.workEmail || 'Not available';
        return `• **${name}** - ${title} (${email})`;
    })
        .join('\n');
    const header = title
        ? `**${title} (${employees.length} employees)**\n\n`
        : '';
    return `${header}${employeeList}`;
}
/**
 * Formats a single employee's detailed information
 */
export function formatEmployeeDetails(employee) {
    const name = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() ||
        'Unknown Name';
    let details = `**Employee: ${name}**\n\n`;
    // Add available information
    if (employee.id) {
        details += `• ID: ${employee.id}\n`;
    }
    if (employee.employeeNumber) {
        details += `• Employee #: ${employee.employeeNumber}\n`;
    }
    if (employee.workEmail) {
        details += `• Email: ${employee.workEmail}\n`;
    }
    if (employee.jobTitle) {
        details += `• Job Title: ${employee.jobTitle}\n`;
    }
    if (employee.department) {
        details += `• Department: ${employee.department}\n`;
    }
    if (employee.location) {
        details += `• Location: ${employee.location}\n`;
    }
    if (employee.division) {
        details += `• Division: ${employee.division}\n`;
    }
    if (employee.workPhone) {
        details += `• Work Phone: ${employee.workPhone}\n`;
    }
    if (employee.mobilePhone) {
        details += `• Mobile: ${employee.mobilePhone}\n`;
    }
    return details;
}
// =============================================================================
// Time-Off Formatting Functions
// =============================================================================
/**
 * Formats who's out calendar entries
 */
export function formatWhosOutList(entries, startDate, endDate) {
    if (entries.length === 0) {
        return `**Who's Out: ${startDate} to ${endDate}**\n\nNo one is scheduled to be out during this period.`;
    }
    const outList = entries
        .map((item) => `• **${item.name}** (${item.start} to ${item.end})`)
        .join('\n');
    return `**Who's Out: ${startDate} to ${endDate}**\n\n${outList}`;
}
/**
 * Formats time-off requests with status indicators
 */
export function formatTimeOffRequests(requests, startDate, endDate) {
    if (requests.length === 0) {
        return `**Time-Off Requests: ${startDate} to ${endDate}**\n\nNo time-off requests found for this period.`;
    }
    const requestList = requests
        .map((req) => {
        const typeName = typeof req.type === 'string' ? req.type : req.type?.name || 'Time Off';
        // Status indicators
        const statusIndicator = req.status === 'approved'
            ? '[APPROVED]'
            : req.status === 'denied'
                ? '[DENIED]'
                : req.status === 'pending'
                    ? '[PENDING]'
                    : '[OTHER]';
        return `${statusIndicator}: **${req.name}** - ${req.start} to ${req.end} (${typeName})`;
    })
        .join('\n');
    return `**Time-Off Requests: ${startDate} to ${endDate}**\n\n${requestList}`;
}
// =============================================================================
// Dataset and Analytics Formatting Functions
// =============================================================================
/**
 * Formats dataset discovery results
 */
export function formatDatasetsList(datasets) {
    if (datasets.length === 0) {
        return '**Available Datasets**\n\nNo datasets found. Your API key may not have access to datasets.';
    }
    let text = `**Available Datasets (${datasets.length})**\n\n`;
    datasets.forEach((dataset, index) => {
        const datasetName = dataset.name || 'Unnamed Dataset';
        const datasetId = dataset.id || 'No ID';
        text += `${index + 1}. **${datasetName}**\n`;
        if (dataset.description) {
            text += `   ${dataset.description}\n`;
        }
        text += `   ID: \`${datasetId}\`\n\n`;
    });
    text +=
        'Use `bamboo_discover_fields` with dataset ID to see available fields';
    return text;
}
/**
 * Formats dataset fields discovery results
 */
export function formatDatasetFields(fields, datasetId) {
    if (fields.length === 0) {
        return `**Fields in Dataset: ${datasetId}**\n\nNo fields found or access denied.`;
    }
    // Group fields by type for better organization
    const fieldsByType = {};
    fields.forEach((field) => {
        const type = field.type || 'unknown';
        // Safe: 'type' comes from BambooHR API field metadata, not user input
        // eslint-disable-next-line security/detect-object-injection
        if (!fieldsByType[type]) {
            // eslint-disable-next-line security/detect-object-injection
            fieldsByType[type] = [];
        }
        // eslint-disable-next-line security/detect-object-injection
        fieldsByType[type].push(field);
    });
    let text = `**Fields in Dataset: ${datasetId}** (${fields.length} total)\n\n`;
    Object.entries(fieldsByType).forEach(([type, typeFields]) => {
        text += `**${type.toUpperCase()} Fields:**\n`;
        typeFields.forEach((field) => {
            text += `• \`${field.name}\` - ${field.label || field.name}`;
            if (field.description) {
                text += ` (${field.description})`;
            }
            text += '\n';
        });
        text += '\n';
    });
    text += 'Use these exact field names in workforce analytics queries';
    return text;
}
/**
 * Analyzes and formats field distribution in dataset records
 */
export function formatFieldAnalysis(records, fieldName, displayName, requestedFields) {
    if (!requestedFields.includes(fieldName)) {
        return '';
    }
    const counts = {};
    let nullCount = 0;
    let undefinedCount = 0;
    records.forEach((record) => {
        // Safe: fieldName is a hardcoded string from a controlled list, not user input.
        // eslint-disable-next-line security/detect-object-injection
        const value = record[fieldName];
        if (value === null) {
            nullCount++;
        }
        else if (value === undefined) {
            undefinedCount++;
        }
        else {
            const key = String(value) || 'Empty';
            // Safe: 'key' is derived from trusted API data, not user-provided input.
            // eslint-disable-next-line security/detect-object-injection
            counts[key] = (counts[key] || 0) + 1;
        }
    });
    if (Object.keys(counts).length === 0 &&
        nullCount === 0 &&
        undefinedCount === 0) {
        return `${displayName} **${fieldName}**: No data found\n\n`;
    }
    let fieldText = `${displayName} **${fieldName}**:\n`;
    // Show non-null values (top 10)
    Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([value, count]) => {
        fieldText += `• ${value}: ${count}\n`;
    });
    // Show null/undefined counts if present
    if (nullCount > 0) {
        fieldText += `• (null): ${nullCount}\n`;
    }
    if (undefinedCount > 0) {
        fieldText += `• (undefined): ${undefinedCount}\n`;
    }
    if (Object.keys(counts).length > 10) {
        fieldText += `• ... and ${Object.keys(counts).length - 10} more values\n`;
    }
    return `${fieldText}\n`;
}
/**
 * Formats workforce analytics results
 */
export function formatWorkforceAnalytics(records, datasetId, requestedFields) {
    let text = `**Workforce Analytics - ${datasetId}**\n\n`;
    text += `Total Records: ${records.length}\n\n`;
    // Show sample data structure if available
    if (records.length > 0 &&
        typeof records[0] === 'object' &&
        records[0] !== null) {
        text += `**Sample Record Structure**:\n`;
        const sampleRecord = records[0];
        const sampleEntries = Object.entries(sampleRecord).slice(0, 10);
        if (sampleEntries.length > 0) {
            sampleEntries.forEach(([key, value]) => {
                const displayValue = value === null
                    ? 'null'
                    : value === undefined
                        ? 'undefined'
                        : typeof value === 'string'
                            ? `"${value}"`
                            : String(value);
                text += `• \`${key}\`: ${displayValue}\n`;
            });
            if (Object.keys(sampleRecord).length > 10) {
                text += `• ... and ${Object.keys(sampleRecord).length - 10} more fields\n`;
            }
        }
        else {
            text += `• (Record appears to be empty or has no enumerable properties)\n`;
        }
        text += '\n';
    }
    // Analyze common fields
    text += formatFieldAnalysis(records, 'department', '**Department**:', requestedFields);
    text += formatFieldAnalysis(records, 'location', '**Location**:', requestedFields);
    text += formatFieldAnalysis(records, 'status', '**Status**:', requestedFields);
    text += formatFieldAnalysis(records, 'jobTitle', '**Job Title**:', requestedFields);
    text += formatFieldAnalysis(records, 'division', '**Division**:', requestedFields);
    return text;
}
// =============================================================================
// Custom Reports Formatting Functions
// =============================================================================
/**
 * Formats custom reports list
 */
export function formatCustomReportsList(reports) {
    if (reports.length === 0) {
        return `**No Custom Reports Available**

This could mean:
• No custom reports have been created in your BambooHR account
• Your API key lacks report access permissions
• Your BambooHR plan doesn't include custom reporting
• The reports endpoint returned an empty result

**Next Steps:**
• Contact your BambooHR administrator to verify:
  - Custom reports exist in the system
  - Your API key has report permissions
  - Your plan includes custom reporting features
• Try using other tools like \`bamboo_workforce_analytics\` for data analysis`;
    }
    let text = `**Available Custom Reports (${reports.length})**\n\n`;
    reports.slice(0, 20).forEach((report, index) => {
        if (!report || typeof report !== 'object') {
            text += `${index + 1}. **Invalid Report Entry** (${typeof report})\n\n`;
            return;
        }
        const reportName = report.name || report.title || report.reportName || 'Unnamed Report';
        const reportId = report.id || report.reportId || 'No ID';
        text += `${index + 1}. **${reportName}**\n`;
        text += `   ID: \`${reportId}\`\n`;
        if (report.description) {
            text += `   Description: ${report.description}\n`;
        }
        if (report.created) {
            text += `   Created: ${report.created}\n`;
        }
        if (report.lastModified) {
            text += `   Modified: ${report.lastModified}\n`;
        }
        if (report.owner) {
            text += `   Owner: ${report.owner}\n`;
        }
        text += '\n';
    });
    if (reports.length > 20) {
        text += `... and ${reports.length - 20} more reports\n\n`;
    }
    text += 'Use `{"report_id": "ID_NUMBER"}` to run a specific report';
    return text;
}
/**
 * Formats custom report execution results
 */
export function formatCustomReportResults(reportData, reportId) {
    let text = `**Custom Report Results - ID: ${reportId}**\n\n`;
    // Handle array responses (common for employee reports)
    if (Array.isArray(reportData)) {
        text += `${reportData.length} records found\n\n`;
        if (reportData.length > 0) {
            // Analyze first record for field structure
            const firstRecord = reportData[0];
            if (firstRecord && typeof firstRecord === 'object') {
                const fieldNames = Object.keys(firstRecord);
                text += `**Available Fields (${fieldNames.length})**: ${fieldNames.join(', ')}\n\n`;
                // Show sample records
                const sampleSize = Math.min(3, reportData.length);
                text += `**Sample Records (${sampleSize} of ${reportData.length})**:\n\n`;
                reportData.slice(0, sampleSize).forEach((record, index) => {
                    if (record && typeof record === 'object') {
                        text += `**Record ${index + 1}**:\n`;
                        Object.entries(record)
                            .slice(0, 8)
                            .forEach(([key, value]) => {
                            if (value !== null && value !== undefined && value !== '') {
                                const displayValue = typeof value === 'string' ? value : JSON.stringify(value);
                                text += `• ${key}: ${displayValue}\n`;
                            }
                        });
                        text += '\n';
                    }
                    else {
                        text += `**Record ${index + 1}**: Invalid record format (${typeof record})\n\n`;
                    }
                });
                if (reportData.length > sampleSize) {
                    text += `... and ${reportData.length - sampleSize} more records\n`;
                }
            }
            else {
                text += `WARNING: **Unexpected Record Format**: First record is ${typeof firstRecord}\n`;
            }
        }
        else {
            text += `**Empty Report**: No records returned\n`;
        }
    }
    // Handle object responses with data property
    else if (reportData &&
        typeof reportData === 'object' &&
        reportData !== null) {
        const dataObj = reportData;
        if (Array.isArray(dataObj.data)) {
            const records = dataObj.data;
            text += `TOTAL: **${records.length} records found**\n\n`;
            if (records.length > 0) {
                // Process same as array case
                const firstRecord = records[0];
                if (firstRecord && typeof firstRecord === 'object') {
                    const fieldNames = Object.keys(firstRecord);
                    text += `REPORT: **Available Fields (${fieldNames.length})**: ${fieldNames.join(', ')}\n\n`;
                    const sampleSize = Math.min(3, records.length);
                    text += `SAMPLE: **Sample Records (${sampleSize} of ${records.length})**:\n\n`;
                    records.slice(0, sampleSize).forEach((record, index) => {
                        if (record && typeof record === 'object') {
                            text += `**Record ${index + 1}**:\n`;
                            Object.entries(record)
                                .slice(0, 8)
                                .forEach(([key, value]) => {
                                if (value !== null && value !== undefined && value !== '') {
                                    const displayValue = typeof value === 'string' ? value : JSON.stringify(value);
                                    text += `• ${key}: ${displayValue}\n`;
                                }
                            });
                            text += '\n';
                        }
                    });
                    if (records.length > sampleSize) {
                        text += `... and ${records.length - sampleSize} more records\n`;
                    }
                }
            }
        }
        // Handle single object responses (summary/aggregate reports)
        else {
            text += `REPORT: **Report Summary**:\n\n`;
            const entries = Object.entries(dataObj);
            if (entries.length > 0) {
                entries.slice(0, 20).forEach(([key, value]) => {
                    const displayValue = typeof value === 'string' ? value : JSON.stringify(value);
                    text += `• **${key}**: ${displayValue}\n`;
                });
                if (entries.length > 20) {
                    text += `• ... and ${entries.length - 20} more properties\n`;
                }
            }
            else {
                text += `No data properties found in response\n`;
            }
        }
    }
    // Handle other response formats
    else {
        text += `**Raw Response**:\n${JSON.stringify(reportData, null, 2)}`;
    }
    return text;
}
// =============================================================================
// Validation Error Formatting Functions
// =============================================================================
/**
 * Formats validation error messages for better user experience
 */
export function formatValidationError(message, suggestions) {
    let errorText = `ERROR: **Validation Failed**\n\n${message}`;
    if (suggestions && suggestions.length > 0) {
        errorText += '\n\n**Suggestions:**\n';
        suggestions.forEach((suggestion) => {
            errorText += `- ${suggestion}\n`;
        });
    }
    return { content: [{ type: 'text', text: errorText }] };
}
/**
 * Formats network error with troubleshooting tips
 */
export function formatNetworkError(error) {
    const message = error instanceof Error ? error.message : 'Unknown network error';
    const errorText = `ERROR: **Network Error**

Failed to connect to BambooHR API: ${message}

TIP: Check your internet connection and API credentials.`;
    return { content: [{ type: 'text', text: errorText }] };
}
