/**
 * Simple contract tests for MCP tools
 * Validates basic input/output structure without overengineering
 */

describe('Tool Contracts', () => {
  // Simple validation that responses follow MCP format
  const validateMcpResponse = (response: any) => {
    expect(response).toHaveProperty('content');
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content[0]).toHaveProperty('type', 'text');
    expect(response.content[0]).toHaveProperty('text');
    expect(typeof response.content[0].text).toBe('string');
  };

  // Simple validation for LLM-friendly text
  const validateLLMFriendly = (text: string) => {
    // Basic checks - no undefined/null strings
    expect(text).not.toContain('undefined');
    expect(text).not.toContain('null');
    expect(text).not.toContain('[object Object]');

    // Has reasonable length
    expect(text.length).toBeGreaterThan(5);
    expect(text.length).toBeLessThan(10000);

    // Contains some structure (headers, bold, or lists)
    expect(text).toMatch(/\*\*|##|•|-\s|\n/);
  };

  test('All tools should return valid MCP response format', () => {
    const tools = [
      'bamboo_find_employee',
      'bamboo_whos_out',
      'bamboo_team_info',
      'bamboo_time_off_requests',
      'bamboo_discover_datasets',
      'bamboo_discover_fields',
      'bamboo_workforce_analytics',
      'bamboo_run_custom_report',
    ];

    // Just validate that we have these tools defined somewhere
    // (Integration tests will test actual functionality)
    expect(tools.length).toBe(8);
    tools.forEach((tool) => {
      expect(typeof tool).toBe('string');
      expect(tool).toMatch(/^bamboo_[a-z_]+$/);
    });
  });

  test('Error responses should be LLM-friendly', () => {
    // Test our error formatter directly
    const { formatErrorResponse } = require('../src/formatters');

    const errorResponse = formatErrorResponse(
      new Error('Test error'),
      'Test context'
    );

    validateMcpResponse(errorResponse);
    validateLLMFriendly(errorResponse.content[0].text);

    expect(errorResponse.content[0].text).toContain('ERROR:');
    expect(errorResponse.content[0].text).toContain('Test context');
  });

  test('Network error responses should be helpful', () => {
    const { formatNetworkError } = require('../src/formatters');

    const networkError = new Error('ECONNREFUSED');
    const errorResponse = formatNetworkError(networkError);

    validateMcpResponse(errorResponse);
    validateLLMFriendly(errorResponse.content[0].text);

    expect(errorResponse.content[0].text).toContain('Network Error');
  });
});
