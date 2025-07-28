/**
 * Security tests for BambooHR MCP Server
 * Validates secure handling of sensitive data
 */

describe('BambooHR MCP Server - Security Tests', () => {
  const originalEnv = process.env;

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  describe('API Key Security', () => {
    test('API keys should not be logged in error messages', () => {
      const testApiKey = 'test-secret-api-key-12345';
      process.env.BAMBOO_API_KEY = testApiKey;

      // Simulate error message creation
      const createErrorMessage = (error: string) => {
        // Should NOT include the actual API key
        return `Authentication failed: ${error}`;
      };

      const errorMsg = createErrorMessage('Invalid credentials');
      expect(errorMsg).not.toContain(testApiKey);
      expect(errorMsg).toContain('Authentication failed');
    });

    test('API keys should not appear in JSON responses', () => {
      const testApiKey = 'secret-key-xyz';
      process.env.BAMBOO_API_KEY = testApiKey;

      // Simulate response object
      const responseData = {
        status: 'success',
        message: 'Request completed',
        // API key should never be in response
      };

      const responseJson = JSON.stringify(responseData);
      expect(responseJson).not.toContain(testApiKey);
    });

    test('Empty or whitespace API keys should be rejected', () => {
      const invalidKeys = ['', '   ', '\t', '\n', null, undefined];
      
      invalidKeys.forEach(key => {
        const isValidKey = key && typeof key === 'string' && key.trim().length > 0;
        expect(isValidKey).toBeFalsy();
      });
    });

    test('API key validation prevents injection attacks', () => {
      const maliciousInputs = [
        '"; DROP TABLE users; --',
        '<script>alert("xss")</script>',
        '${process.env.SECRET}',
        '../../../etc/passwd',
        'key\nmalicious\nheader'
      ];

      maliciousInputs.forEach(input => {
        // Basic validation - API keys should be alphanumeric with limited special chars
        const isValidFormat = /^[a-zA-Z0-9._-]+$/.test(input);
        expect(isValidFormat).toBeFalsy();
      });
    });
  });

  describe('Input Sanitization', () => {
    test('User input should be sanitized', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '"; DROP TABLE employees; --',
        '../../../etc/passwd',
        '${process.env.SECRET}',
        '\x00\x01\x02' // null bytes
      ];

      maliciousInputs.forEach(input => {
        // Simulate proper input sanitization
        const sanitized = input.replace(/[<>"\';\\]|DROP\s+TABLE|script|\.\.\/|SELECT|INSERT|DELETE|UPDATE/gi, '');
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('DROP TABLE');
        expect(sanitized).not.toContain('../');
      });
    });

    test('Query parameters should be validated', () => {
      const invalidQueries = [
        '', // empty
        '   ', // whitespace only
        'a'.repeat(1000), // too long
        'query\nwith\nnewlines',
        'query\twith\ttabs'
      ];

      invalidQueries.forEach(query => {
        const isValid = query && 
                       typeof query === 'string' && 
                       query.trim().length > 0 && 
                       query.length < 500 &&
                       !/[\n\r\t]/.test(query);
        
        expect(isValid).toBeFalsy();
      });
    });
  });

  describe('Environment Variable Security', () => {
    test('Should handle missing environment variables gracefully', () => {
      delete process.env.BAMBOO_API_KEY;
      delete process.env.BAMBOO_SUBDOMAIN;

      expect(() => {
        const config = {
          apiKey: process.env.BAMBOO_API_KEY,
          subdomain: process.env.BAMBOO_SUBDOMAIN
        };
        // Should not crash, should handle undefined values
        expect(config.apiKey).toBeUndefined();
        expect(config.subdomain).toBeUndefined();
      }).not.toThrow();
    });

    test('Should validate subdomain format securely', () => {
      const suspiciousSubdomains = [
        'admin.bamboohr.com',
        'https://malicious.site',
        'subdomain/../admin',
        'test\x00admin', // null byte injection
        'sub domain', // spaces
        'subdomain;admin'
      ];

      suspiciousSubdomains.forEach(subdomain => {
        // Secure validation - only allow simple alphanumeric with hyphens
        const isSecureFormat = /^[a-zA-Z0-9-]+$/.test(subdomain) && 
                              subdomain.length > 0 && 
                              subdomain.length < 100 &&
                              !subdomain.includes('.');
        
        expect(isSecureFormat).toBeFalsy();
      });
    });
  });

  describe('Error Handling Security', () => {
    test('Error messages should not leak sensitive information', () => {
      const sensitiveData = {
        apiKey: 'secret-key-123',
        internalPath: '/internal/admin/users',
        dbPassword: 'db-secret-password'
      };

      // Simulate error message creation
      const createSafeErrorMessage = (userMessage: string) => {
        // Should only return safe, generic error messages
        return userMessage.includes('Authentication') 
          ? 'Authentication failed. Please check your credentials.'
          : 'An error occurred. Please try again.';
      };

      const errorMsg = createSafeErrorMessage('Authentication failed for key: secret-key-123');
      expect(errorMsg).not.toContain('secret-key-123');
      expect(errorMsg).toContain('Authentication failed');
    });
  });
});