/**
 * Photo Integration Test
 * Tests the photo functionality directly without MCP tool layer
 * Validates that we can retrieve employee photos and save them to disk
 */

import { BambooClient } from '../src/bamboo-client.js';
import {
  handleGetEmployeePhoto,
  initializeEmployeeHandlers,
} from '../src/handlers/employeeHandlers.js';
import { mcpLogger } from '../src/utils/mcpLogger.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('Photo Integration Tests - Direct API', () => {
  let bambooClient: BambooClient;
  let tempDir: string;

  beforeAll(async () => {
    // Skip if no API credentials
    if (!process.env.BAMBOO_API_KEY || !process.env.BAMBOO_SUBDOMAIN) {
      console.log('⚠️  Skipping photo integration tests - no API credentials');
      return;
    }

    // Initialize BambooClient with real credentials
    bambooClient = new BambooClient(
      {
        apiKey: process.env.BAMBOO_API_KEY,
        subdomain: process.env.BAMBOO_SUBDOMAIN,
      },
      mcpLogger
    );

    // Initialize handlers
    initializeEmployeeHandlers({
      bambooClient,
      logger: mcpLogger,
    });

    // Create temporary directory for test files
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bamboo-photo-test-'));
    console.log('📁 Test temp directory:', tempDir);
  });

  afterAll(async () => {
    // Clean up temp directory
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log('🧹 Cleaned up temp directory');
      } catch (error) {
        console.warn('⚠️  Failed to clean up temp directory:', error);
      }
    }
  });

  test('should retrieve employee data directly from API', async () => {
    if (!process.env.BAMBOO_API_KEY || !process.env.BAMBOO_SUBDOMAIN) {
      return; // Skip test
    }

    console.log('🧪 Testing direct employee API call...');

    // Test getting employee data directly
    const employeeData = await bambooClient.get(
      '/employees/5?fields=id,firstName,lastName,email'
    );

    expect(employeeData).toBeDefined();
    expect(typeof employeeData).toBe('object');
    expect((employeeData as any).id).toBe('5');
    expect((employeeData as any).firstName).toBeDefined();
    expect((employeeData as any).lastName).toBeDefined();

    console.log(
      '✅ Employee data retrieved:',
      JSON.stringify(employeeData, null, 2)
    );
  });

  test('should download employee photo via direct API and save to disk', async () => {
    if (!process.env.BAMBOO_API_KEY || !process.env.BAMBOO_SUBDOMAIN) {
      return; // Skip test
    }

    console.log('🖼️  Testing direct photo download...');

    try {
      // Download photo directly using BambooClient
      const photoBuffer = await bambooClient.getBinary(
        '/employees/5/photo/large'
      );

      // Validate buffer
      expect(Buffer.isBuffer(photoBuffer)).toBe(true);
      expect(photoBuffer.length).toBeGreaterThan(1000); // Should be substantial
      console.log('📊 Photo buffer size:', photoBuffer.length, 'bytes');

      // Check for valid image headers
      const isValidImage = validateImageBuffer(photoBuffer);
      expect(isValidImage.isValid).toBe(true);
      console.log('🔍 Image validation:', isValidImage);

      // Save to temporary file
      const filename = `employee-5-photo-${Date.now()}.${isValidImage.extension}`;
      const filepath = path.join(tempDir, filename);
      await fs.writeFile(filepath, photoBuffer);
      console.log('💾 Photo saved to:', filepath);

      // Verify file was saved correctly
      const stats = await fs.stat(filepath);
      expect(stats.size).toBe(photoBuffer.length);
      expect(stats.isFile()).toBe(true);

      // Read back and verify content matches
      const readBuffer = await fs.readFile(filepath);
      expect(readBuffer.equals(photoBuffer)).toBe(true);

      console.log('✅ Photo successfully downloaded and saved');
      console.log('📁 File size on disk:', stats.size, 'bytes');
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        console.log(
          '⚠️  Employee 5 has no photo uploaded - this is expected for some employees'
        );
        return; // This is not a failure - employee just has no photo
      }
      throw error; // Re-throw other errors
    }
  });

  test('should handle photo retrieval through handler with base64 mode', async () => {
    if (!process.env.BAMBOO_API_KEY || !process.env.BAMBOO_SUBDOMAIN) {
      return; // Skip test
    }

    console.log('🔧 Testing photo handler with base64 mode...');

    try {
      // Test the handler directly (bypassing MCP)
      const result = await handleGetEmployeePhoto(
        { employee_id: '5', return_base64: true },
        {}
      );

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);

      const content = result.content[0];
      expect(content.type).toBe('text');
      expect(content.text).toBeDefined();

      // Should contain HTML with base64 data URI
      expect(content.text).toContain('<!DOCTYPE html>');
      expect(content.text).toContain('data:image/');
      expect(content.text).toContain('base64,');

      // Extract and validate base64 data
      const base64Match = content.text.match(
        /data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)/
      );
      expect(base64Match).toBeTruthy();

      if (base64Match) {
        const base64Data = base64Match[1];
        const imageBuffer = Buffer.from(base64Data, 'base64');
        expect(imageBuffer.length).toBeGreaterThan(1000);

        const validation = validateImageBuffer(imageBuffer);
        expect(validation.isValid).toBe(true);

        console.log('✅ Handler returned valid base64 image data');
        console.log('📊 Decoded image size:', imageBuffer.length, 'bytes');
        console.log('🔍 Image type:', validation.mimeType);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        console.log('⚠️  Employee 5 has no photo - testing error handling...');
        // Verify error response format
        const result = await handleGetEmployeePhoto(
          { employee_id: '5', return_base64: true },
          {}
        );
        expect(result.content[0].text).toContain('Employee Photo Not Found');
        return;
      }
      throw error;
    }
  });

  test('should handle photo retrieval through handler with URL mode', async () => {
    if (!process.env.BAMBOO_API_KEY || !process.env.BAMBOO_SUBDOMAIN) {
      return; // Skip test
    }

    console.log('🔗 Testing photo handler with URL mode...');

    try {
      // Test the handler in URL mode
      const result = await handleGetEmployeePhoto(
        { employee_id: '5', return_base64: false },
        {}
      );

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content.length).toBeGreaterThan(0);

      const content = result.content[0];
      expect(content.type).toBe('text');
      expect(content.text).toBeDefined();

      // Should contain photo URL
      expect(content.text).toContain('Employee Photo URL');
      expect(content.text).toContain('cloudlinux.bamboohr.com');
      expect(content.text).toContain('/employees/5/photo');

      console.log('✅ Handler returned photo URL successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        console.log(
          '⚠️  Employee 5 has no photo - this is expected for some employees'
        );
        return;
      }
      throw error;
    }
  });

  test('should test multiple photo sizes', async () => {
    if (!process.env.BAMBOO_API_KEY || !process.env.BAMBOO_SUBDOMAIN) {
      return; // Skip test
    }

    console.log('📐 Testing different photo sizes...');

    const sizes = ['large', 'medium', 'small', 'xs', 'tiny'];

    for (const size of sizes) {
      try {
        console.log(`  Testing size: ${size}`);
        const photoBuffer = await bambooClient.getBinary(
          `/employees/5/photo/${size}`
        );

        expect(Buffer.isBuffer(photoBuffer)).toBe(true);
        expect(photoBuffer.length).toBeGreaterThan(100); // Even tiny should be > 100 bytes

        const validation = validateImageBuffer(photoBuffer);
        expect(validation.isValid).toBe(true);

        console.log(
          `    ✅ ${size}: ${photoBuffer.length} bytes, ${validation.mimeType}`
        );
      } catch (error) {
        if (error instanceof Error && error.message.includes('404')) {
          console.log(`    ⚠️  Size ${size}: Employee has no photo`);
          break; // If any size fails with 404, employee has no photo
        }
        throw error;
      }
    }
  });
});

/**
 * Validate image buffer and detect format
 */
function validateImageBuffer(buffer: Buffer): {
  isValid: boolean;
  mimeType?: string;
  extension?: string;
  reason?: string;
} {
  if (!Buffer.isBuffer(buffer) || buffer.length < 8) {
    return { isValid: false, reason: 'Buffer too small or invalid' };
  }

  // Check PNG signature
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { isValid: true, mimeType: 'image/png', extension: 'png' };
  }

  // Check JPEG signature
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, mimeType: 'image/jpeg', extension: 'jpg' };
  }

  // Check GIF signature
  if (
    buffer.toString('ascii', 0, 6) === 'GIF87a' ||
    buffer.toString('ascii', 0, 6) === 'GIF89a'
  ) {
    return { isValid: true, mimeType: 'image/gif', extension: 'gif' };
  }

  // Check WebP signature
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { isValid: true, mimeType: 'image/webp', extension: 'webp' };
  }

  return { isValid: false, reason: 'Unknown image format' };
}
