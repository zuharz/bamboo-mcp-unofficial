/**
 * Simple test helpers
 * Keep it minimal - avoid overengineering!
 */

export interface McpResponse {
  content: Array<{ type: string; text: string }>;
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
  expect(text.length).toBeLessThan(10000);

  // Has some structure
  expect(text).toMatch(/\*\*|##|•|-\s|\n/);
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
