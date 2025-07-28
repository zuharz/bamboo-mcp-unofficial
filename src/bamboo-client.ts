/**
 * BambooHR HTTP Client and Caching Module
 *
 * This file contains the HTTP client logic for interacting with the BambooHR API,
 * including authentication, caching, error handling, and request/response processing.
 *
 * Features:
 * - HTTP Basic Auth with API key
 * - 5-minute in-memory cache with TTL
 * - Comprehensive error handling and logging
 * - Support for GET and POST requests
 * - Request timing and debugging information
 */

import type { CacheEntry } from './types';

// Simple console logger interface for MCP compatibility
interface SimpleLogger {
  debug: (msg: string, ...args: unknown[]) => void;
  info: (msg: string, ...args: unknown[]) => void;
  error: (msg: string, ...args: unknown[]) => void;
}

// Default simple logger - logs to stderr to avoid MCP stdio interference
const defaultLogger: SimpleLogger = {
  debug: (msg: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[DEBUG]', msg, ...args);
    }
  },
  info: (msg: string, ...args: unknown[]) =>
    console.error('[INFO]', msg, ...args),
  error: (msg: string, ...args: unknown[]) =>
    console.error('[ERROR]', msg, ...args),
};

// =============================================================================
// Configuration and Setup
// =============================================================================

/**
 * BambooHR API configuration
 */
export interface BambooClientConfig {
  apiKey: string;
  subdomain: string;
  baseUrl?: string;
  cacheTimeoutMs?: number;
}

/**
 * HTTP request options for BambooHR API calls
 */
export interface BambooRequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  headers?: Record<string, string>;
  skipCache?: boolean;
}

/**
 * BambooHR HTTP Client class
 * Encapsulates all HTTP communication with BambooHR API
 */
export class BambooClient {
  private readonly config: Required<BambooClientConfig>;
  private readonly cache = new Map<string, CacheEntry>();
  private logger: SimpleLogger;

  constructor(config: BambooClientConfig, logger?: SimpleLogger) {
    this.config = {
      baseUrl: `https://api.bamboohr.com/api/gateway.php/${config.subdomain}/v1`,
      cacheTimeoutMs: 300000, // 5 minutes
      ...config,
    };
    this.logger = logger || defaultLogger;
  }

  /**
   * Set the logger instance (for dependency injection)
   */
  setLogger(logger: SimpleLogger): void {
    this.logger = logger;
  }

  // ===========================================================================
  // Public API Methods
  // ===========================================================================

  /**
   * Make a GET request to BambooHR API
   */
  async get(
    endpoint: string,
    options: Omit<BambooRequestOptions, 'method' | 'body'> = {}
  ): Promise<unknown> {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request to BambooHR API
   */
  async post(
    endpoint: string,
    body: unknown,
    options: Omit<BambooRequestOptions, 'method' | 'body'> = {}
  ): Promise<unknown> {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body,
      skipCache: true,
    });
  }

  /**
   * Clear the cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.debug('BambooHR client cache cleared');
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; entries: string[] } {
    const entries: string[] = [];
    const now = Date.now();

    this.cache.forEach((entry, key) => {
      if (entry.expires > now) {
        entries.push(key);
      }
    });

    return { size: entries.length, entries };
  }

  // ===========================================================================
  // Private Implementation Methods
  // ===========================================================================

  /**
   * Main request method that handles caching, authentication, and error handling
   */
  private async request(
    endpoint: string,
    options: BambooRequestOptions = {}
  ): Promise<unknown> {
    const method = options.method || 'GET';
    const cacheKey = this.buildCacheKey(endpoint, options);

    // Check cache for GET requests (unless explicitly skipped)
    if (method === 'GET' && !options.skipCache) {
      const cached = this.getCachedResponse(cacheKey);
      if (cached !== null) {
        this.logger.debug(
          'BambooHR API request served from cache:',
          endpoint,
          method
        );
        return cached;
      }
    }

    this.logger.debug('Making BambooHR API request:', method, endpoint);

    try {
      const response = await this.makeHttpRequest(endpoint, options);
      const data = await this.parseResponse(response, endpoint);

      // Cache successful GET responses
      if (method === 'GET' && !options.skipCache) {
        this.setCachedResponse(cacheKey, data);
      }

      this.logger.info(
        'BambooHR API request completed successfully:',
        method,
        endpoint,
        'status:',
        response.status
      );

      return data;
    } catch (error) {
      this.logger.error(
        'BambooHR API request failed:',
        method,
        endpoint,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Make the actual HTTP request to BambooHR API
   */
  private async makeHttpRequest(
    endpoint: string,
    options: BambooRequestOptions
  ): Promise<Response> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const method = options.method || 'GET';

    const authHeader = `Basic ${Buffer.from(`${this.config.apiKey}:x`).toString('base64')}`;
    const headers: Record<string, string> = {
      Authorization: authHeader,
      Accept: 'application/json',
      ...options.headers,
    };

    // Debug logging for authentication troubleshooting
    this.logger.debug('API Request Debug - URL:', url);
    this.logger.debug(
      'API Request Debug - Auth header length:',
      authHeader.length
    );
    this.logger.debug(
      'API Request Debug - API key length:',
      this.config.apiKey.length
    );

    // Add Content-Type for POST requests with body
    if (method === 'POST' && options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const fetchConfig: globalThis.RequestInit = {
      method,
      headers,
    };

    // Add body for POST requests
    if (method === 'POST' && options.body) {
      fetchConfig.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, fetchConfig);
      return response;
    } catch (networkError) {
      throw new Error(
        `Network error connecting to BambooHR API: ${networkError instanceof Error ? networkError.message : 'Unknown network error'}`
      );
    }
  }

  /**
   * Parse and validate HTTP response
   */
  private async parseResponse(
    response: Response,
    endpoint: string
  ): Promise<unknown> {
    if (!response.ok) {
      const errorMessage = await this.buildErrorMessage(response);

      this.logger.error(
        'BambooHR API request failed:',
        endpoint,
        'status:',
        response.status,
        'error:',
        errorMessage
      );

      throw new Error(errorMessage);
    }

    try {
      const data = await response.json();
      return data;
    } catch (parseError) {
      const error = `Invalid JSON response from BambooHR API: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`;

      this.logger.error(
        'Failed to parse BambooHR API response:',
        endpoint,
        'error:',
        parseError instanceof Error ? parseError.message : parseError
      );

      throw new Error(error);
    }
  }

  /**
   * Build comprehensive error message from HTTP response
   */
  private async buildErrorMessage(response: Response): Promise<string> {
    let errorMessage = `BambooHR API error: ${response.status} ${response.statusText}`;

    try {
      const errorText = await response.text();
      if (errorText) {
        // Try to parse error as JSON for better error messages
        try {
          const errorJson = JSON.parse(errorText);
          const message = errorJson.message || errorJson.error || errorText;
          errorMessage += ` - ${message}`;
        } catch {
          // Use raw text if JSON parsing fails
          errorMessage += ` - ${errorText}`;
        }
      }
    } catch {
      // Ignore errors when reading response text
    }

    return errorMessage;
  }

  // ===========================================================================
  // Cache Management Methods
  // ===========================================================================

  /**
   * Build cache key from endpoint and request options
   */
  private buildCacheKey(
    endpoint: string,
    options: BambooRequestOptions
  ): string {
    const method = options.method || 'GET';
    const bodyHash = options.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${bodyHash}`;
  }

  /**
   * Get cached response if it exists and hasn't expired
   */
  private getCachedResponse(cacheKey: string): unknown | null {
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }

    // Remove expired entries
    if (cached) {
      this.cache.delete(cacheKey);
    }

    return null;
  }

  /**
   * Store response in cache with TTL
   */
  private setCachedResponse(cacheKey: string, data: unknown): void {
    this.cache.set(cacheKey, {
      data,
      expires: Date.now() + this.config.cacheTimeoutMs,
    });
  }
}

// =============================================================================
// Factory Functions and Utilities
// =============================================================================

/**
 * Create a BambooClient with optional logger injection
 * Preferred way to create client instances
 */
export function createBambooClient(
  config: BambooClientConfig,
  logger?: SimpleLogger
): BambooClient {
  return new BambooClient(config, logger);
}

/**
 * Create a BambooClient for testing with sensible defaults
 */
export function createTestBambooClient(
  overrides: Partial<BambooClientConfig> = {},
  logger?: SimpleLogger
): BambooClient {
  const config: BambooClientConfig = {
    apiKey: 'test-api-key',
    subdomain: 'test-subdomain',
    cacheTimeoutMs: 1000, // Shorter timeout for tests
    ...overrides,
  };

  // Create silent logger for tests
  const silentLogger: SimpleLogger = {
    debug: () => {
      // No-op debug logger
    },
    info: () => {
      // No-op info logger
    },
    error: () => {
      // No-op error logger
    },
  };

  return new BambooClient(config, logger || silentLogger);
}
