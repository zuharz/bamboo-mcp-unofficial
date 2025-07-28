// Jest test setup file
// This file runs before all tests

// Mock environment variables for testing
process.env.BAMBOO_API_KEY = process.env.BAMBOO_API_KEY || 'test-api-key';
process.env.BAMBOO_SUBDOMAIN = process.env.BAMBOO_SUBDOMAIN || 'test-company';

// Increase timeout for API tests
jest.setTimeout(10000);

// Mock console.error to reduce noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});