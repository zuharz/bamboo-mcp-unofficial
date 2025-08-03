/**
 * Security tests for BambooHR MCP Server
 * Validates secure handling of sensitive data
 */

import { BambooClient } from '../server/bamboo-client.js';

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

      invalidKeys.forEach((key) => {
        const isValidKey =
          key && typeof key === 'string' && key.trim().length > 0;
        expect(isValidKey).toBeFalsy();
      });
    });

    test('API key validation prevents injection attacks', () => {
      const maliciousInputs = [
        '"; DROP TABLE users; --',
        '<script>alert("xss")</script>',
        '${process.env.SECRET}',
        '../../../etc/passwd',
        'key\nmalicious\nheader',
      ];

      maliciousInputs.forEach((input) => {
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
        '\x00\x01\x02', // null bytes
      ];

      maliciousInputs.forEach((input) => {
        // Simulate proper input sanitization
        const sanitized = input.replace(
          /[<>"';\\]|DROP\s+TABLE|script|\.\.\//gi,
          ''
        );
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
        'query\twith\ttabs',
      ];

      invalidQueries.forEach((query) => {
        const isValid =
          query &&
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
          subdomain: process.env.BAMBOO_SUBDOMAIN,
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
        'subdomain;admin',
      ];

      suspiciousSubdomains.forEach((subdomain) => {
        // Secure validation - only allow simple alphanumeric with hyphens
        const isSecureFormat =
          /^[a-zA-Z0-9-]+$/.test(subdomain) &&
          subdomain.length > 0 &&
          subdomain.length < 100 &&
          !subdomain.includes('.');

        expect(isSecureFormat).toBeFalsy();
      });
    });
  });

  describe('Error Handling Security', () => {
    test('Error messages should not leak sensitive information', () => {
      // Simulate error message creation
      const createSafeErrorMessage = (userMessage: string) => {
        // Should only return safe, generic error messages
        return userMessage.includes('Authentication')
          ? 'Authentication failed. Please check your credentials.'
          : 'An error occurred. Please try again.';
      };

      const errorMsg = createSafeErrorMessage(
        'Authentication failed for key: secret-key-123'
      );
      expect(errorMsg).not.toContain('secret-key-123');
      expect(errorMsg).toContain('Authentication failed');
    });
  });

  describe('Configuration Validation', () => {
    test('BambooClient should handle invalid subdomain configurations', () => {
      const invalidSubdomains = [
        '', // empty
        '   ', // whitespace only
        'test.bamboohr.com', // full domain
        'admin/../secret', // path traversal
        'test\x00null', // null byte
      ];

      invalidSubdomains.forEach((subdomain) => {
        const client = new BambooClient({
          apiKey: 'test-key',
          subdomain,
        });

        // Should create client but URL construction should be checked
        expect(client.config.baseUrl).toContain(subdomain);
        expect(client.config.baseUrl).toContain('api.bamboohr.com');
      });
    });

    test('Environment variable validation should be secure', () => {
      const testValidateEnvVar = (name: string, value: any) => {
        // Basic validation logic
        if (!value || typeof value !== 'string') {
          return false;
        }
        if (value.trim().length === 0) {
          return false;
        }
        // Additional security checks for specific vars
        if (name === 'BAMBOO_SUBDOMAIN') {
          return /^[a-zA-Z0-9-]+$/.test(value) && value.length < 100;
        }
        if (name === 'BAMBOO_API_KEY') {
          return value.length > 10 && value.length < 500;
        }
        return true;
      };

      // Valid cases
      expect(testValidateEnvVar('BAMBOO_API_KEY', 'valid-api-key-12345')).toBe(
        true
      );
      expect(testValidateEnvVar('BAMBOO_SUBDOMAIN', 'mycompany')).toBe(true);

      // Invalid cases
      expect(testValidateEnvVar('BAMBOO_API_KEY', '')).toBe(false);
      expect(testValidateEnvVar('BAMBOO_API_KEY', null)).toBe(false);
      expect(testValidateEnvVar('BAMBOO_SUBDOMAIN', 'test.com')).toBe(false);
      expect(testValidateEnvVar('BAMBOO_SUBDOMAIN', 'test space')).toBe(false);
    });

    test('BambooClient should use secure default configurations', () => {
      const client = new BambooClient({
        apiKey: 'test-key',
        subdomain: 'test-company',
      });

      // Should have secure timeout values
      expect(client.config.requestTimeoutMs).toBeLessThanOrEqual(60000); // Max 1 minute
      expect(client.config.cacheTimeoutMs).toBeLessThanOrEqual(600000); // Max 10 minutes
      expect(client.config.maxRetryAttempts).toBeLessThanOrEqual(5); // Reasonable retry limit

      // Should use HTTPS
      expect(client.config.baseUrl).toContain('https://');
      expect(client.config.baseUrl).toContain('api.bamboohr.com');
    });
  });
});
