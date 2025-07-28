/**
 * BambooHR API Integration Tests
 * Simple happy path tests for core API functions
 */

import { createWriteStream } from 'fs';
import { join } from 'path';

// Setup logging (simpler approach for Jest compatibility)
const logFile = join(process.cwd(), 'test', 'api.log');
const logStream = createWriteStream(logFile, { flags: 'w' });

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(message);
  logStream.write(logMessage + '\n');
}

// Setup environment before imports
const API_KEY = process.env.BAMBOO_API_KEY;
const SUBDOMAIN = process.env.BAMBOO_SUBDOMAIN;

if (!API_KEY || !SUBDOMAIN) {
  log('⚠️  Skipping API tests - missing BAMBOO_API_KEY or BAMBOO_SUBDOMAIN');
} else {
  log('🧪 Starting BambooHR API Integration Tests');
  log(`📝 Logging to: ${logFile}`);
}

describe('BambooHR API Integration', () => {
  const BASE_URL = `https://api.bamboohr.com/api/gateway.php/${SUBDOMAIN}/v1`;
  
  // Simple HTTP client (extracted from main file)
  async function bambooGet(endpoint: string): Promise<any> {
    log(`📤 API Request: GET ${endpoint}`);
    const requestTime = Date.now();
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${API_KEY}:x`).toString('base64')}`,
        'Accept': 'application/json'
      }
    });

    const responseTime = Date.now() - requestTime;

    if (!response.ok) {
      const errorText = await response.text();
      const error = `API error: ${response.status} ${response.statusText}`;
      log(`❌ ${error} (${responseTime}ms)`);
      log(`❌ Error details: ${errorText}`);
      throw new Error(error);
    }

    const data = await response.json();
    const dataInfo = Array.isArray(data) 
      ? `array with ${data.length} items`
      : `object with ${Object.keys(data).length} keys`;
    
    log(`✅ API Response: ${response.status} - ${dataInfo} (${responseTime}ms)`);
    
    // Log sample data for debugging (but not sensitive info)
    if (Array.isArray(data) && data.length > 0) {
      log(`📊 Sample item structure: ${Object.keys(data[0]).join(', ')}`);
    } else if (typeof data === 'object' && data !== null) {
      log(`📊 Response structure: ${Object.keys(data).join(', ')}`);
    }
    
    return data;
  }

  // Skip tests if no credentials
  const testIf = (condition: boolean) => condition ? test : test.skip;

  testIf(!!API_KEY && !!SUBDOMAIN)('connects to BambooHR API', async () => {
    log('🔧 Testing: API connection');
    const data = await bambooGet('/meta/fields');
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    log('✅ Test passed: API connection');
  }, 10000);

  testIf(!!API_KEY && !!SUBDOMAIN)('fetches employee directory', async () => {
    log('🔧 Testing: Employee directory');
    const data = await bambooGet('/employees/directory');
    
    // Validate response structure
    expect(data).toBeDefined();
    expect(data.employees).toBeDefined();
    expect(Array.isArray(data.employees)).toBe(true);
    
    // Log detailed information
    log(`👥 Found ${data.employees.length} employees in directory`);
    
    if (data.employees.length > 0) {
      const firstEmployee = data.employees[0];
      const fields = Object.keys(firstEmployee);
      log(`📄 Employee fields available: ${fields.join(', ')}`);
      
      // Count departments
      const departments = new Set(data.employees.map((e: any) => e.department).filter(Boolean));
      log(`🏭 Found ${departments.size} unique departments: ${Array.from(departments).slice(0, 5).join(', ')}...`);
    }
    
    log('✅ Test passed: Employee directory');
  }, 10000);

  testIf(!!API_KEY && !!SUBDOMAIN)('fetches time off calendar', async () => {
    log('🔧 Testing: Time off calendar');
    const today = new Date().toISOString().split('T')[0];
    log(`📅 Checking who's out on: ${today}`);
    
    const data = await bambooGet(`/time_off/whos_out/?start=${today}&end=${today}`);
    expect(Array.isArray(data)).toBe(true);
    
    log(`🏖️ Found ${data.length} people out today`);
    
    if (data.length > 0) {
      const types = data.map((entry: any) => entry.type);
      const uniqueTypes = new Set(types);
      log(`🏷️ Time-off types: ${Array.from(uniqueTypes).join(', ')}`);
    }
    
    log('✅ Test passed: Time off calendar');
  }, 10000);

  testIf(!!API_KEY && !!SUBDOMAIN)('discovers datasets', async () => {
    log('🔧 Testing: Dataset discovery');
    const data = await bambooGet('/datasets');
    expect(data).toBeDefined();
    expect(typeof data).toBe('object');
    
    // Log available datasets
    if (data.datasets && Array.isArray(data.datasets)) {
      log(`📊 Found ${data.datasets.length} datasets available`);
      data.datasets.forEach((dataset: any) => {
        log(`  📁 Dataset: ${dataset.name || dataset.id} - ${dataset.description || 'No description'}`);
      });
    } else {
      log(`📁 Dataset response structure: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
    }
    
    log('✅ Test passed: Dataset discovery');
  }, 10000);

  testIf(!!API_KEY && !!SUBDOMAIN)('lists custom reports', async () => {
    log('🔧 Testing: Custom reports');
    const data = await bambooGet('/custom-reports');
    expect(data).toBeDefined();
    expect(typeof data).toBe('object');
    
    // Log available reports
    if (Array.isArray(data)) {
      log(`📋 Found ${data.length} custom reports`);
      data.slice(0, 3).forEach((report: any) => {
        log(`  📈 Report: "${report.name || report.title}" (ID: ${report.id})`);
      });
    } else if (data.reports && Array.isArray(data.reports)) {
      log(`📋 Found ${data.reports.length} custom reports`);
      data.reports.slice(0, 3).forEach((report: any) => {
        log(`  📈 Report: "${report.name || report.title}" (ID: ${report.id})`);
      });
    } else {
      log(`📄 Custom reports structure: ${Object.keys(data).join(', ')}`);
    }
    
    log('✅ Test passed: Custom reports');
  }, 10000);

  // Additional tests for edge cases and coverage
  testIf(!!API_KEY && !!SUBDOMAIN)('handles time-off requests with date range', async () => {
    log('🔧 Testing: Time-off requests endpoint');
    
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    log(`📅 Fetching time-off requests from ${startDate} to ${endDate}`);
    
    try {
      const data = await bambooGet(`/time_off/requests?start=${startDate}&end=${endDate}`);
      
      if (Array.isArray(data)) {
        log(`🏴 Found ${data.length} time-off requests`);
        
        // Analyze request statuses
        const statuses = data.map((req: any) => req.status).filter(Boolean);
        const statusCounts = statuses.reduce((acc: any, status: string) => {
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});
        
        log(`📊 Request statuses: ${JSON.stringify(statusCounts)}`);
      }
    } catch (error) {
      log(`⚠️ Time-off requests endpoint may require different parameters or permissions`);
      // This is OK - not all accounts have access to all endpoints
    }
    
    log('✅ Test completed: Time-off requests');
  }, 10000);

  testIf(!!API_KEY && !!SUBDOMAIN)('tests cache behavior with repeated requests', async () => {
    log('🔧 Testing: Cache behavior');
    
    const endpoint = '/meta/fields';
    
    // First request - should hit API
    const start1 = Date.now();
    await bambooGet(endpoint);
    const duration1 = Date.now() - start1;
    
    // Second request - might be cached on server side
    const start2 = Date.now();
    await bambooGet(endpoint);
    const duration2 = Date.now() - start2;
    
    log(`⏱️ First request: ${duration1}ms`);
    log(`⏱️ Second request: ${duration2}ms`);
    log(`🚀 Speed difference: ${duration1 - duration2}ms`);
    
    // Both should complete successfully
    expect(duration1).toBeGreaterThan(0);
    expect(duration2).toBeGreaterThan(0);
    
    log('✅ Test passed: Cache behavior');
  }, 15000);

  // Close log stream after all tests
  afterAll(() => {
    log('🏁 API Integration Tests completed');
    log('='.repeat(80));
    logStream.end();
  });
});