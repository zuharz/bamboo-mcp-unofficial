/**
 * TypeScript type definitions for BambooHR MCP Server
 *
 * This file contains all interface definitions for:
 * - BambooHR API response structures
 * - MCP tool argument types
 * - Internal data structures
 *
 * These types are extracted for reusability and maintainability.
 */

// =============================================================================
// BambooHR API Response Types
// =============================================================================

/**
 * Employee record from BambooHR API
 * Contains standard employee fields plus dynamic custom fields
 */
export interface BambooEmployee {
  id: string;
  employeeNumber?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  workEmail?: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  division?: string;
  linkedIn?: string;
  workPhone?: string;
  mobilePhone?: string;
  workPhoneExtension?: string;
  skypeUsername?: string;
  photoUploaded?: boolean;
  photoUrl?: string;
  canUploadPhoto?: number;
  [key: string]: unknown; // Support for custom fields
}

/**
 * Employee directory response structure
 */
export interface BambooEmployeeDirectory {
  employees: BambooEmployee[];
}

/**
 * Time-off request from BambooHR API
 * Contains request details, dates, and approval actions
 */
export interface BambooTimeOffRequest {
  id: string;
  employeeId: string;
  name?: string;
  start: string;
  end: string;
  created: string;
  type: string | { name?: string };
  amount: {
    unit: string;
    amount: string;
  };
  actions: {
    view?: boolean;
    edit?: boolean;
    cancel?: boolean;
    approve?: boolean;
    deny?: boolean;
    bypass?: boolean;
  };
  dates: Record<string, string>;
  icon?: string;
  comments?: string;
  status?: string;
}

/**
 * Who's out calendar entry
 * Represents an employee on leave for a specific date range
 */
export interface BambooWhosOutEntry {
  id: string;
  type: string;
  employeeId: string;
  name: string;
  start: string;
  end: string;
}

/**
 * BambooHR dataset definition
 * Used for workforce analytics and reporting
 */
export interface BambooDataset {
  id: string;
  name: string;
  description?: string;
  fields?: BambooDatasetField[];
}

/**
 * Field definition within a BambooHR dataset
 */
export interface BambooDatasetField {
  id: string;
  name: string;
  label?: string;
  type?: string;
  description?: string;
}

/**
 * Datasets API response structure
 */
export interface BambooDatasetsResponse {
  datasets: BambooDataset[];
}

/**
 * Fields API response structure
 */
export interface BambooFieldsResponse {
  fields: BambooDatasetField[];
}

/**
 * Generic dataset record for analytics queries
 * Contains dynamic field data from BambooHR datasets
 */
export interface BambooDatasetRecord {
  [key: string]: unknown;
}

/**
 * Custom report item from BambooHR
 * Represents a saved custom report that can be executed
 */
export interface BambooCustomReportItem {
  id: string;
  name?: string;
  title?: string;
  reportName?: string;
  description?: string;
  created?: string;
  lastModified?: string;
  owner?: string;
  reportId?: string;
}

// =============================================================================
// MCP Tool Argument Types
// =============================================================================

/**
 * Filter definition for workforce analytics queries
 */
export interface WorkforceAnalyticsFilter {
  field: string;
  operator: string;
  value?: unknown; // Can be string, number, boolean, date depending on field type
}

/**
 * Arguments for workforce analytics tool
 * Requires dataset discovery first to get valid field names
 */
export interface WorkforceAnalyticsArgs {
  dataset_id: string;
  fields: string[];
  filters?: WorkforceAnalyticsFilter[] | undefined;
  group_by?: string | undefined;
}

/**
 * Arguments for custom report tool
 * Can list reports or execute a specific report by ID
 */
export interface CustomReportArgs {
  list_reports?: boolean | undefined;
  report_id?: string | undefined;
  format?: 'json' | 'csv' | 'pdf' | undefined;
}

/**
 * Request payload for BambooHR analytics API
 * Internal structure sent to BambooHR datasets endpoint
 */
export interface BambooAnalyticsRequestPayload {
  fields: string[];
  groupBy?: string[];
  filters?: WorkforceAnalyticsFilter[];
}

// =============================================================================
// Internal System Types
// =============================================================================

/**
 * Cache entry for BambooHR API responses
 * Simple in-memory caching with expiration timestamps
 */
export interface CacheEntry {
  data: unknown;
  expires: number;
}

// =============================================================================
// MCP Protocol Types and Handlers
// =============================================================================

/**
 * Generic tool arguments interface
 * All MCP tool arguments extend this base interface
 */
export interface ToolArgs {
  [key: string]: unknown;
}

/**
 * MCP execution context with progress tracking and metadata
 * Passed to all tool handlers for enhanced functionality
 */
export interface ToolContext {
  _meta?: {
    progressToken?: string;
    [key: string]: unknown;
  };
  progressToken?: string;
  sendProgress?: (
    progress: number,
    total: number,
    message: string
  ) => Promise<void>;
  isEnabled?: boolean;
  [key: string]: unknown;
}

/**
 * Tool handler function signature
 * All MCP tool handlers must implement this interface
 */
export interface ToolHandlerFunction {
  (args: ToolArgs, context?: ToolContext): Promise<MCPToolResponse>;
}

/**
 * Standard MCP tool response structure
 * Follows 2025-06-18 compliance with structured outputs
 */
export interface MCPToolResponse {
  content: Array<{
    type: 'text' | 'resource';
    text?: string;
    _meta?: {
      [key: string]: unknown;
    };
  }>;
  isError?: boolean;
  _mcpError?: {
    code: number;
    message: string;
    data?: unknown;
  };
  _links?: {
    [key: string]: unknown;
  };
  [key: string]: unknown; // Allow additional properties for MCP compatibility
}

/**
 * Logger interface for structured logging
 * Compatible with console-style logging but type-safe
 */
export interface Logger {
  debug: (msg: string, ...args: unknown[]) => void;
  info: (msg: string, ...args: unknown[]) => void;
  warn: (msg: string, ...args: unknown[]) => void;
  error: (msg: string, ...args: unknown[]) => void;
  fatal: (msg: string, ...args: unknown[]) => void;
  child: () => Logger;
}

/**
 * Dependency injection interface for tool handlers
 * Provides all necessary dependencies to handlers via DI
 */
export interface HandlerDependencies {
  bambooClient: {
    get: (endpoint: string) => Promise<unknown>;
    post: (endpoint: string, data: unknown) => Promise<unknown>;
    getBaseUrl: () => string;
    clearCache: () => void;
  };
  formatters: unknown; // More lenient for the formatters module
  logger: Logger;
}

/**
 * Error data interface for MCP error handling
 * Type-safe error data structure
 */
export interface ErrorData {
  originalError?: string;
  context?: string;
  endpoint?: string;
  statusCode?: number;
  troubleshooting?: string[];
  [key: string]: unknown;
}

/**
 * MCP request interface for progress token extraction
 * Minimal interface for extracting progress tokens from requests
 */
export interface MCPRequest {
  params?: {
    _meta?: {
      progressToken?: string | number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}
