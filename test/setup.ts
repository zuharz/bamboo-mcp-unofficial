// Jest test setup file
// This file runs before all tests

import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

// Log loaded credentials for debugging (mask API key for security)
console.log('🔧 Test Setup - Environment loaded:');
console.log(`  BAMBOO_SUBDOMAIN: ${process.env.BAMBOO_SUBDOMAIN || 'NOT SET'}`);
console.log(`  BAMBOO_API_KEY: ${process.env.BAMBOO_API_KEY ? `${process.env.BAMBOO_API_KEY.substring(0, 8)}...` : 'NOT SET'}`);

// Mock environment variables for testing if not found in .env
process.env.BAMBOO_API_KEY = process.env.BAMBOO_API_KEY || 'test-api-key';
process.env.BAMBOO_SUBDOMAIN = process.env.BAMBOO_SUBDOMAIN || 'test-company';

// Increase timeout for API tests (real API tests may take longer)
jest.setTimeout(30000);

// Mock console.error to reduce noise in tests
const originalConsoleError = console.error;
beforeEach(() => {
  console.error = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
});