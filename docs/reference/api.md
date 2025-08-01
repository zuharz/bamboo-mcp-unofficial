# API Reference

Complete reference for all BambooHR MCP server tools and their parameters.

## Overview

The BambooHR MCP server provides 8 tools for accessing HR data. All tools return structured data formatted for natural language processing.

**Enhanced in v1.1.1**: Employee search now supports full names ("Igor Zivanovic") in addition to email/ID lookup.

## Discovery Tools

### `bamboo_discover_datasets`

**Purpose:** List all available datasets in your BambooHR instance.

**Parameters:** None

**Returns:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Available datasets:\n- employees\n- time_off\n- directory\n..."
    }
  ]
}
```

**Usage:**

- First tool to call when exploring data
- No parameters required
- Returns dataset names and descriptions

---

### `bamboo_discover_fields`

**Purpose:** Explore fields available in a specific dataset.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dataset` | string | Yes | Dataset name (e.g., "employees", "time_off") |

**Returns:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Fields in employees dataset:\n- id (Employee ID)\n- firstName (First Name)\n..."
    }
  ]
}
```

**Example:**

```json
{
  "dataset": "employees"
}
```

## Employee Tools

### `bamboo_find_employee`

**Purpose:** Find and retrieve employee information.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Search term (name, email, ID, department) |
| `fields` | array | No | Specific fields to return |

**Returns:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Employee: John Smith\nEmail: john.smith@company.com\n..."
    }
  ]
}
```

**Examples:**

```json
// Find by name
{
  "query": "John Smith"
}

// Find by email
{
  "query": "john.smith@company.com"
}

// Find by department
{
  "query": "Engineering"
}

// Find with specific fields
{
  "query": "John Smith",
  "fields": ["firstName", "lastName", "workEmail", "department"]
}
```

---

### `bamboo_team_info`

**Purpose:** Get information about a specific team or department.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `department` | string | No | Department name to filter by |
| `manager_id` | string | No | Manager's employee ID |
| `location` | string | No | Office location |

**Returns:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Engineering Team (15 members):\n- John Smith (Manager)\n- Sarah Chen (Developer)\n..."
    }
  ]
}
```

**Examples:**

```json
// Get department roster
{
  "department": "Engineering"
}

// Get team by manager
{
  "manager_id": "123"
}

// Get team by location
{
  "location": "San Francisco"
}
```

## Time-Off Tools

### `bamboo_whos_out`

**Purpose:** Check who is out of office during a specific time period.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start_date` | string | No | Start date (YYYY-MM-DD). Default: today |
| `end_date` | string | No | End date (YYYY-MM-DD). Default: start_date |
| `department` | string | No | Filter by department |

**Returns:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Out of Office Today:\n- John Smith: Vacation (Jan 15-20)\n- Sarah Chen: Sick Day (Jan 15)\n..."
    }
  ]
}
```

**Examples:**

```json
// Who's out today
{}

// Who's out this week
{
  "start_date": "2024-01-15",
  "end_date": "2024-01-19"
}

// Department-specific
{
  "department": "Engineering",
  "start_date": "2024-01-15"
}
```

---

### `bamboo_time_off_requests`

**Purpose:** View time-off requests with various filters.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | No | Filter by status: "pending", "approved", "denied" |
| `employee_id` | string | No | Specific employee ID |
| `start_date` | string | No | Requests starting after this date |
| `end_date` | string | No | Requests ending before this date |
| `type` | string | No | Time-off type (vacation, sick, etc.) |

**Returns:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Time-Off Requests:\n\nPending Approval:\n- John Smith: Vacation (Jan 15-20)\n..."
    }
  ]
}
```

**Examples:**

```json
// All pending requests
{
  "status": "pending"
}

// Specific employee's requests
{
  "employee_id": "123"
}

// Vacation requests only
{
  "type": "vacation",
  "status": "approved"
}
```

## Analytics Tools

### `bamboo_workforce_analytics`

**Purpose:** Generate advanced workforce insights and analytics.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `analysis_type` | string | No | Type: "demographics", "tenure", "headcount" |
| `department` | string | No | Filter by department |
| `location` | string | No | Filter by location |
| `date_range` | string | No | Analysis period |

**Returns:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Workforce Analytics Report:\n\nDemographics:\n- Total Employees: 150\n- By Department:\n  - Engineering: 45 (30%)\n..."
    }
  ]
}
```

**Examples:**

```json
// Overall demographics
{
  "analysis_type": "demographics"
}

// Department-specific analysis
{
  "analysis_type": "headcount",
  "department": "Engineering"
}

// Tenure analysis
{
  "analysis_type": "tenure"
}
```

---

### `bamboo_run_custom_report`

**Purpose:** Execute pre-configured custom reports from BambooHR.

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `report_id` | string | No | Specific report ID to run |
| `report_name` | string | No | Report name (alternative to ID) |
| `format` | string | No | Output format: "summary", "detailed" |

**Returns:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Custom Report: Monthly Headcount\n\nExecuted: 2024-01-15\n\nSummary:\n..."
    }
  ]
}
```

**Examples:**

```json
// List available reports
{}

// Run specific report
{
  "report_name": "Monthly Headcount"
}

// Run by ID
{
  "report_id": "12345",
  "format": "detailed"
}
```

## Response Format

All tools return responses in the Model Context Protocol format:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Human-readable formatted response"
    }
  ]
}
```

### Text Formatting

Responses use Markdown formatting:

- **Bold** for headers and important values
- `Code blocks` for IDs and technical values
- Lists for structured data
- Tables for comparisons

## Error Handling

### Common Error Responses

**Invalid credentials:**

```json
{
  "content": [
    {
      "type": "text",
      "text": " Authentication failed. Please check your BAMBOO_API_KEY and BAMBOO_SUBDOMAIN."
    }
  ]
}
```

**Rate limit exceeded:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "⏱ Rate limit exceeded. Please wait before making more requests."
    }
  ]
}
```

**Invalid parameters:**

```json
{
  "content": [
    {
      "type": "text",
      "text": " Invalid parameter: 'dataset' must be one of: employees, time_off, directory"
    }
  ]
}
```

## Rate Limits

- **Employee queries:** 100 requests per hour
- **Time-off queries:** 200 requests per hour
- **Analytics queries:** 50 requests per hour
- **Discovery queries:** Unlimited

## Data Privacy

### Included Data

- Employee directory information
- Public contact details
- Department and role information
- Time-off schedules (dates only)
- Organizational structure

### Excluded Data

- Salary and compensation
- Performance reviews
- Personal/sensitive information
- Social security numbers
- Private communications

## Field Reference

### Common Employee Fields

| Field          | Type   | Description                |
| -------------- | ------ | -------------------------- |
| `id`           | string | Unique employee identifier |
| `firstName`    | string | Employee first name        |
| `lastName`     | string | Employee last name         |
| `workEmail`    | string | Business email address     |
| `department`   | string | Department name            |
| `jobTitle`     | string | Current job title          |
| `location`     | string | Office location            |
| `hireDate`     | string | Date of hire (YYYY-MM-DD)  |
| `supervisorId` | string | Manager's employee ID      |
| `status`       | string | Employment status          |

### Time-Off Fields

| Field        | Type   | Description             |
| ------------ | ------ | ----------------------- |
| `employeeId` | string | Employee identifier     |
| `startDate`  | string | Start date (YYYY-MM-DD) |
| `endDate`    | string | End date (YYYY-MM-DD)   |
| `type`       | string | Time-off type           |
| `status`     | string | Request status          |
| `amount`     | number | Days/hours requested    |

## See Also

- [Configuration Reference](configuration.md)
- [Error Codes](error-codes.md)
- [Getting Started Tutorial](../tutorials/getting-started.md)
