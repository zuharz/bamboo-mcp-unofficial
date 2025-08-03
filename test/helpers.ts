/**
 * Simple test helpers - Modernized
 * Updated for modernized MCP architecture with additional validation
 */

export interface McpResponse {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
  _mcpError?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface ProgressContext {
  progressToken: string | null;
  isEnabled: boolean;
  sendProgress: (
    progress: number,
    total?: number,
    message?: string
  ) => Promise<void>;
}

/**
 * Validates MCP response format
 */
export const validateMcpResponse = (response: any): void => {
  expect(response).toHaveProperty('content');
  expect(Array.isArray(response.content)).toBe(true);
  expect(response.content.length).toBeGreaterThan(0);
  expect(response.content[0]).toHaveProperty('type', 'text');
  expect(response.content[0]).toHaveProperty('text');
  expect(typeof response.content[0].text).toBe('string');
};

/**
 * Validates response is LLM-friendly
 */
export const validateLLMFriendly = (text: string): void => {
  // No undefined/null strings
  expect(text).not.toContain('undefined');
  expect(text).not.toContain('null');
  expect(text).not.toContain('[object Object]');

  // Reasonable length
  expect(text.length).toBeGreaterThan(5);
  expect(text.length).toBeLessThan(20000); // Increased for detailed responses

  // Has some structure (more flexible patterns)
  expect(text).toMatch(
    /\*\*|##|•|-\s|\n|:|at:|Available|Employee|Error|No|found|matching/
  );
};

/**
 * Validates both MCP format and LLM-friendliness
 */
export const validateToolResponse = (response: any): void => {
  validateMcpResponse(response);
  validateLLMFriendly(response.content[0].text);
};

/**
 * Simple error response checker
 */
export const validateErrorResponse = (response: any): void => {
  validateMcpResponse(response);
  const text = response.content[0].text;
  expect(text).toContain('ERROR:');
  expect(text.length).toBeGreaterThan(10); // Error should be descriptive
};

/**
 * Validates modernized MCP error response structure
 */
export const validateModernErrorResponse = (response: any): void => {
  validateMcpResponse(response);

  // Check for modern error structure
  if (response._mcpError) {
    expect(response._mcpError).toHaveProperty('code');
    expect(response._mcpError).toHaveProperty('message');
    expect(typeof response._mcpError.code).toBe('number');
    expect(typeof response._mcpError.message).toBe('string');
    expect(response._mcpError.code).toBeLessThan(-32000); // MCP error range
  }

  // Should have isError flag for tool responses
  expect(response).toHaveProperty('isError', true);
};

/**
 * Validates progress context structure
 */
export const validateProgressContext = (context: any): void => {
  expect(context).toHaveProperty('progressToken');
  expect(context).toHaveProperty('isEnabled');
  expect(context).toHaveProperty('sendProgress');
  expect(typeof context.isEnabled).toBe('boolean');
  expect(typeof context.sendProgress).toBe('function');

  if (context.isEnabled) {
    expect(context.progressToken).not.toBeNull();
  } else {
    expect(context.progressToken).toBeNull();
  }
};

/**
 * Validates tool definition schema structure
 */
export const validateToolDefinition = (tool: any): void => {
  expect(tool).toHaveProperty('name');
  expect(tool).toHaveProperty('description');
  expect(tool).toHaveProperty('inputSchema');

  expect(typeof tool.name).toBe('string');
  expect(typeof tool.description).toBe('string');
  expect(typeof tool.inputSchema).toBe('object');

  // Validate schema structure
  expect(tool.inputSchema).toHaveProperty('type', 'object');
  expect(tool.inputSchema).toHaveProperty('properties');
  expect(tool.inputSchema).toHaveProperty('additionalProperties', false);
  expect(typeof tool.inputSchema.properties).toBe('object');
};

/**
 * Creates a mock progress context for testing
 */
export const createMockProgressContext = (
  enabled = false,
  token = 'test-token'
): ProgressContext => ({
  progressToken: enabled ? token : null,
  isEnabled: enabled,
  sendProgress: jest.fn().mockResolvedValue(undefined),
});

/**
 * Creates a mock server for testing progress notifications
 */
export const createMockServer = () => ({
  notification: jest.fn().mockResolvedValue(undefined),
  connect: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
});

/**
 * Validates that a function is a proper tool handler
 */
export const validateToolHandler = (handler: any): void => {
  expect(handler).toBeDefined();
  expect(typeof handler).toBe('function');

  // Check that handler has expected signature (args, progressContext)
  expect(handler.length).toBeGreaterThanOrEqual(1); // At least args parameter
};
