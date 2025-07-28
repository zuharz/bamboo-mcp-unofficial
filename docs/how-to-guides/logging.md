# Logging Guide

This guide explains the structured logging implementation in the BambooHR MCP server, following 2025 Node.js best practices.

## Overview

The server uses **Pino** for high-performance, structured JSON logging with the following features:

- **Structured JSON output** for production monitoring
- **Pretty printing** for development
- **Automatic sensitive data redaction**
- **Performance optimized** (5-10x faster than alternatives)
- **Request correlation** with unique request IDs

## Log Levels

The server uses standard log levels:

- **fatal**: Critical system failures that cause the server to exit
- **error**: API failures, authentication errors, tool execution errors
- **warn**: Rate limiting, deprecated usage, performance issues
- **info**: Tool executions, successful operations, server lifecycle
- **debug**: Detailed request/response data, caching operations
- **trace**: Internal state changes (not used in this implementation)

## Configuration

### Environment Variables

```bash
# Set log level (default: 'info' in production, 'debug' in development)
export LOG_LEVEL=debug

# Set environment (affects log formatting)
export NODE_ENV=production
```

### Development vs Production

**Development:**
- Pretty-printed, colorized output
- Debug level enabled
- Human-readable timestamps

**Production:**
- Structured JSON output
- Info level and above
- Machine-readable format

## Log Structure

All logs include these base fields:

```json
{
  "level": 30,
  "time": 1640995200000,
  "service": "bamboo-mcp",
  "version": "1.0.0",
  "environment": "production",
  "msg": "Employee search completed successfully"
}
```

### Tool-Specific Logs

Each MCP tool creates a child logger with tool context:

```json
{
  "level": 30,
  "time": 1640995200000,
  "service": "bamboo-mcp",
  "version": "1.0.0",
  "tool": "bamboo_find_employee",
  "employee_id": "123",
  "employee_name": "John Doe",
  "department": "Engineering",
  "duration_ms": 245,
  "msg": "Employee search completed successfully"
}
```

### API Request Logs

BambooHR API calls include detailed context:

```json
{
  "level": 30,
  "time": 1640995200000,
  "service": "bamboo-mcp",
  "request_id": "abc123",
  "endpoint": "/employees/directory",
  "status": 200,
  "duration_ms": 234,
  "cached": true,
  "msg": "BambooHR API request completed successfully"
}
```

## Security Features

### Automatic Data Redaction

Sensitive fields are automatically removed from logs:

- `api_key`, `bamboo_api_key`, `BAMBOO_API_KEY`
- `authorization`, `password`
- `ssn`, `salary`, `personal_email`
- `phone`, `address`

### Safe Logging Practices

```javascript
//  Safe - Log IDs and metadata
logger.info({
  employee_id: employee.id,
  department: employee.department,
  action: 'data_retrieved'
}, 'Employee data accessed');

//  Unsafe - Don't log full objects with sensitive data
logger.info({ employee }, 'Employee data accessed');
```

## Error Handling

Errors are logged with full context:

```json
{
  "level": 50,
  "time": 1640995200000,
  "service": "bamboo-mcp",
  "tool": "bamboo_find_employee",
  "query": "john",
  "error": "BambooHR API error: 401 Unauthorized",
  "stack": "Error: BambooHR API error...",
  "duration_ms": 1205,
  "msg": "Employee search failed with error"
}
```

## Monitoring Integration

The logging format is compatible with:

- **Elasticsearch/Kibana** (ELK stack)
- **Grafana Loki**
- **Datadog**
- **CloudWatch Logs**
- **Prometheus** (via log metrics)

## Performance

Pino's performance characteristics:

- **10,000+ logs/second** with minimal CPU overhead
- **Async by default** - non-blocking I/O
- **Worker thread support** for JSON serialization
- **Memory efficient** with optimized object handling

## Examples

### Basic Tool Logging

```javascript
const toolLogger = logger.child({ tool: 'my_tool' });

toolLogger.info({
  query: searchTerm,
  results_count: results.length,
  duration_ms: Date.now() - startTime
}, 'Tool execution completed');
```

### Error Logging

```javascript
toolLogger.error({
  query: args.query,
  error: error.message,
  stack: error.stack,
  duration_ms: Date.now() - startTime
}, 'Tool execution failed');
```

### API Request Logging

```javascript
logger.debug({
  request_id: requestId,
  endpoint,
  cache_hit: false
}, 'Making BambooHR API request');
```

This logging implementation provides comprehensive observability while maintaining high performance and security standards.