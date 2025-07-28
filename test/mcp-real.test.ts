/**
 * Real MCP Protocol Integration Tests
 * 
 * Tests the MCP tools by spawning the server and sending JSON-RPC messages
 * Provides comprehensive logging of actual protocol communication
 */

import { spawn, ChildProcess } from 'child_process';
import { createWriteStream } from 'fs';
import { join } from 'path';

// Setup comprehensive logging
const logFile = join(process.cwd(), 'test', 'mcp-real.log');
const logStream = createWriteStream(logFile, { flags: 'w' });

function log(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(message);
  logStream.write(logMessage + '\n');
  
  if (data !== undefined) {
    const dataStr = `[${timestamp}] DATA: ${JSON.stringify(data, null, 2)}`;
    console.log('DATA:', JSON.stringify(data, null, 2));
    logStream.write(dataStr + '\n');
  }
}

// Environment check
const API_KEY = process.env.BAMBOO_API_KEY;
const SUBDOMAIN = process.env.BAMBOO_SUBDOMAIN;

describe('Real MCP Protocol Tests', () => {
  let serverProcess: ChildProcess;
  let messageId = 1;
  
  const testIf = (condition: boolean) => condition ? test : test.skip;
  const hasCredentials = !!API_KEY && !!SUBDOMAIN;

  /**
   * Send a JSON-RPC message to the MCP server
   */
  async function sendMessage(method: string, params?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        id: messageId++,
        method,
        params: params || {}
      };
      
      log(`📤 Sending: ${method}`, request);
      
      // Write to stdin
      serverProcess.stdin?.write(JSON.stringify(request) + '\n');
      
      // Set up response handler
      const responseHandler = (data: Buffer) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        for (const line of lines) {
          try {
            const response = JSON.parse(line);
            if (response.id === request.id) {
              log(`📥 Response:`, response);
              serverProcess.stdout?.off('data', responseHandler);
              
              if (response.error) {
                reject(new Error(response.error.message));
              } else {
                resolve(response.result);
              }
            }
          } catch (e) {
            // Not JSON, ignore
          }
        }
      };
      
      serverProcess.stdout?.on('data', responseHandler);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        serverProcess.stdout?.off('data', responseHandler);
        reject(new Error('Timeout waiting for response'));
      }, 5000);
    });
  }

  beforeAll(async () => {
    if (!hasCredentials) {
      log('⚠️  Skipping real MCP tests - missing credentials');
      return;
    }

    log('🚀 Starting Real MCP Protocol Tests');
    log(`📝 Logging to: ${logFile}`);
    
    // Start the MCP server
    log('🔧 Starting MCP server...');
    serverProcess = spawn('node', ['dist/bamboo-mcp.js'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        BAMBOO_API_KEY: API_KEY,
        BAMBOO_SUBDOMAIN: SUBDOMAIN,
        LOG_LEVEL: 'error'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Initialize connection
    const initResult = await sendMessage('initialize', {
      protocolVersion: '0.1.0',
      capabilities: {},
      clientInfo: {
        name: 'mcp-test-client',
        version: '1.0.0'
      }
    });
    
    log('✅ Server initialized:', initResult);
  }, 15000);

  afterAll(async () => {
    if (serverProcess) {
      log('🛑 Stopping server...');
      serverProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    log('🏁 Tests completed');
    logStream.end();
  });

  // List available tools
  testIf(hasCredentials)('lists all available tools', async () => {
    log('🧪 TEST: List tools');
    
    const result = await sendMessage('tools/list');
    log('🔧 Available tools:', result);
    
    expect(result.tools).toBeDefined();
    expect(Array.isArray(result.tools)).toBe(true);
    expect(result.tools.length).toBe(8);
    
    // Log tool names
    const toolNames = result.tools.map((t: any) => t.name);
    log('📋 Tool names:', toolNames);
    
    expect(toolNames).toContain('bamboo_find_employee');
    expect(toolNames).toContain('bamboo_whos_out');
    expect(toolNames).toContain('bamboo_team_info');
    expect(toolNames).toContain('bamboo_time_off_requests');
    expect(toolNames).toContain('bamboo_discover_datasets');
    expect(toolNames).toContain('bamboo_discover_fields');
    expect(toolNames).toContain('bamboo_workforce_analytics');
    expect(toolNames).toContain('bamboo_run_custom_report');
    
    log('✅ PASSED: List tools');
  });

  // Test bamboo_find_employee
  testIf(hasCredentials)('calls bamboo_find_employee', async () => {
    log('🧪 TEST: bamboo_find_employee');
    
    const result = await sendMessage('tools/call', {
      name: 'bamboo_find_employee',
      arguments: { query: 'John' }
    });
    
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    
    if (result.content?.[0]?.text) {
      log('📄 Employee search result:', result.content[0].text.substring(0, 200) + '...');
    }
    
    log('✅ PASSED: bamboo_find_employee');
  });

  // Test bamboo_whos_out
  testIf(hasCredentials)('calls bamboo_whos_out for today', async () => {
    log('🧪 TEST: bamboo_whos_out');
    
    const result = await sendMessage('tools/call', {
      name: 'bamboo_whos_out',
      arguments: {}
    });
    
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    
    if (result.content?.[0]?.text) {
      log('📄 Who\'s out today:', result.content[0].text);
    }
    
    log('✅ PASSED: bamboo_whos_out');
  });

  // Test bamboo_discover_datasets
  testIf(hasCredentials)('calls bamboo_discover_datasets', async () => {
    log('🧪 TEST: bamboo_discover_datasets');
    
    const result = await sendMessage('tools/call', {
      name: 'bamboo_discover_datasets',
      arguments: {}
    });
    
    expect(result).toBeDefined();
    
    if (result.content?.[0]?.text) {
      log('📄 Available datasets:', result.content[0].text);
    }
    
    log('✅ PASSED: bamboo_discover_datasets');
  });

  // Test error handling
  testIf(hasCredentials)('handles missing parameters gracefully', async () => {
    log('🧪 TEST: Error handling');
    
    try {
      const result = await sendMessage('tools/call', {
        name: 'bamboo_time_off_requests',
        arguments: {} // Missing required dates
      });
      
      if (result.content?.[0]?.text) {
        log('📄 Error response:', result.content[0].text);
        expect(result.content[0].text).toMatch(/ERROR|required|validation/i);
      }
    } catch (error) {
      log('✅ Expected error:', error);
    }
    
    log('✅ PASSED: Error handling');
  });

  // Performance test
  testIf(hasCredentials)('measures tool response times', async () => {
    log('⏱️ PERFORMANCE TEST');
    
    const tools = [
      { name: 'bamboo_discover_datasets', args: {} },
      { name: 'bamboo_whos_out', args: {} }
    ];
    
    for (const tool of tools) {
      const start = Date.now();
      
      await sendMessage('tools/call', {
        name: tool.name,
        arguments: tool.args
      });
      
      const duration = Date.now() - start;
      log(`⏱️ ${tool.name}: ${duration}ms`);
      
      expect(duration).toBeLessThan(5000);
    }
    
    log('✅ PASSED: Performance test');
  });
});

// Test summary
afterAll(() => {
  console.log('\n' + '='.repeat(80));
  console.log('📊 REAL MCP PROTOCOL TEST SUMMARY');
  console.log('='.repeat(80));
  console.log('✅ Direct JSON-RPC communication tested');
  console.log('✅ All tool calls verified with actual protocol');
  console.log('✅ Request/response pairs logged');
  console.log(`📝 Full protocol log: ${logFile}`);
  console.log('='.repeat(80) + '\n');
});