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
  warn: (msg: string, ...args: unknown[]) => void;
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
  warn: (msg: string, ...args: unknown[]) =>
    console.error('[WARN]', msg, ...args),
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
  requestTimeoutMs?: number;
  maxRetryAttempts?: number;
  retryBaseDelayMs?: number;
  retryMaxDelayMs?: number;
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
      requestTimeoutMs: 30000, // 30 seconds
      maxRetryAttempts: 3, // Number of retry attempts
      retryBaseDelayMs: 1000, // Base delay for exponential backoff (1 second)
      retryMaxDelayMs: 30000, // Maximum delay between retries (30 seconds)
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

  /**
   * Get the base URL for API requests
   */
  getBaseUrl(): string {
    return this.config.baseUrl;
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
      const response = await this.makeHttpRequestWithRetry(endpoint, options);
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
        'BambooHR API request failed after all retries:',
        method,
        endpoint,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Make HTTP request with retry logic and exponential backoff
   */
  private async makeHttpRequestWithRetry(
    endpoint: string,
    options: BambooRequestOptions
  ): Promise<Response> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.config.maxRetryAttempts; attempt++) {
      try {
        const response = await this.makeHttpRequest(endpoint, options);

        // Check if this is a rate limit response that we should retry
        if (response.status === 429) {
          const retryAfter = this.getRetryAfterDelay(response);

          if (attempt < this.config.maxRetryAttempts) {
            this.logger.warn(
              `Rate limit hit (429) for ${endpoint}, attempt ${attempt + 1}/${this.config.maxRetryAttempts + 1}, waiting ${retryAfter}ms`
            );

            await this.sleep(retryAfter);
            continue; // Retry the request
          }

          // Last attempt, let it fail naturally
          return response;
        }

        // Check for other retryable errors (5xx server errors)
        if (response.status >= 500 && response.status < 600) {
          if (attempt < this.config.maxRetryAttempts) {
            const delay = this.calculateExponentialBackoffDelay(attempt);
            this.logger.warn(
              `Server error (${response.status}) for ${endpoint}, attempt ${attempt + 1}/${this.config.maxRetryAttempts + 1}, waiting ${delay}ms`
            );

            await this.sleep(delay);
            continue; // Retry the request
          }
        }

        // Success or non-retryable error
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if this is a retryable network error
        if (
          this.isRetryableNetworkError(lastError) &&
          attempt < this.config.maxRetryAttempts
        ) {
          const delay = this.calculateExponentialBackoffDelay(attempt);
          this.logger.warn(
            `Network error for ${endpoint}, attempt ${attempt + 1}/${this.config.maxRetryAttempts + 1}, waiting ${delay}ms: ${lastError.message}`
          );

          await this.sleep(delay);
          continue; // Retry the request
        }

        // Non-retryable error or last attempt
        throw lastError;
      }
    }

    // This shouldn't be reached, but just in case
    throw lastError || new Error('Request failed after all retry attempts');
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
      // Add timeout wrapper for complex queries
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.requestTimeoutMs
      );

      fetchConfig.signal = controller.signal;

      const response = await fetch(url, fetchConfig);
      clearTimeout(timeoutId);

      return response;
    } catch (networkError) {
      if (networkError instanceof Error && networkError.name === 'AbortError') {
        const timeoutSeconds = this.config.requestTimeoutMs / 1000;
        throw new Error(
          `Request to BambooHR API timed out after ${timeoutSeconds} seconds: ${endpoint}`
        );
      }

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

    // Get response text first to handle edge cases
    const responseText = await response.text();

    // Handle empty responses
    if (!responseText || responseText.trim() === '') {
      this.logger.debug('Empty response from BambooHR API:', endpoint);
      return null;
    }

    try {
      const data = JSON.parse(responseText);
      return data;
    } catch (parseError) {
      // Log more detailed error information
      this.logger.error(
        'Failed to parse BambooHR API response:',
        endpoint,
        'Response length:',
        responseText.length,
        'Response preview:',
        responseText.substring(0, 200),
        'Parse error:',
        parseError instanceof Error ? parseError.message : parseError
      );

      // Check if response looks like HTML (common error page)
      if (responseText.trim().startsWith('<')) {
        throw new Error(
          `BambooHR returned HTML instead of JSON. This usually indicates an authentication or server error. Endpoint: ${endpoint}`
        );
      }

      // Check if response is partial JSON
      if (
        responseText.trim().startsWith('{') ||
        responseText.trim().startsWith('[')
      ) {
        throw new Error(
          `Incomplete JSON response from BambooHR API. Response was truncated or corrupted. Endpoint: ${endpoint}`
        );
      }

      const error = `Invalid JSON response from BambooHR API: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`;
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
          let message = '';

          // Handle various error response formats from BambooHR
          if (typeof errorJson === 'string') {
            message = errorJson;
          } else if (errorJson.message) {
            message = errorJson.message;
          } else if (errorJson.error) {
            message =
              typeof errorJson.error === 'string'
                ? errorJson.error
                : JSON.stringify(errorJson.error);
          } else if (errorJson.errors && Array.isArray(errorJson.errors)) {
            message = errorJson.errors.join(', ');
          } else if (errorJson.detail) {
            message = errorJson.detail;
          } else {
            // Fallback to stringified JSON if structure is unknown
            message = JSON.stringify(errorJson);
          }

          errorMessage += ` - ${message}`;
        } catch {
          // Use raw text if JSON parsing fails, but truncate if too long
          const truncatedText =
            errorText.length > 500
              ? `${errorText.substring(0, 500)}...`
              : errorText;
          errorMessage += ` - ${truncatedText}`;
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

  // ===========================================================================
  // Retry and Rate Limiting Helper Methods
  // ===========================================================================

  /**
   * Get retry delay from Retry-After header or use exponential backoff
   */
  private getRetryAfterDelay(response: Response): number {
    const retryAfterHeader = response.headers.get('Retry-After');

    if (retryAfterHeader) {
      // Retry-After can be in seconds or a date
      const retryAfterSeconds = parseInt(retryAfterHeader, 10);
      if (!isNaN(retryAfterSeconds)) {
        // Convert seconds to milliseconds, but cap at max delay
        return Math.min(retryAfterSeconds * 1000, this.config.retryMaxDelayMs);
      }

      // Try parsing as date
      const retryAfterDate = new Date(retryAfterHeader);
      if (!isNaN(retryAfterDate.getTime())) {
        const delayMs = retryAfterDate.getTime() - Date.now();
        return Math.min(Math.max(delayMs, 0), this.config.retryMaxDelayMs);
      }
    }

    // Fallback to exponential backoff for rate limits
    return Math.min(
      this.config.retryBaseDelayMs * 2,
      this.config.retryMaxDelayMs
    );
  }

  /**
   * Calculate exponential backoff delay with jitter
   */
  private calculateExponentialBackoffDelay(attempt: number): number {
    // Exponential backoff: baseDelay * (2 ^ attempt) + jitter
    const exponentialDelay =
      this.config.retryBaseDelayMs * Math.pow(2, attempt);

    // Add random jitter (±25%) to avoid thundering herd
    const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
    const delayWithJitter = exponentialDelay + jitter;

    // Cap at maximum delay
    return Math.min(delayWithJitter, this.config.retryMaxDelayMs);
  }

  /**
   * Check if error is retryable (network errors, timeouts, etc.)
   */
  private isRetryableNetworkError(error: Error): boolean {
    // Network-related errors that should be retried
    const retryableErrorMessages = [
      'fetch is not defined',
      'network error',
      'timeout',
      'connection',
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'socket hang up',
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableErrorMessages.some((msg) => errorMessage.includes(msg));
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
    warn: () => {
      // No-op warn logger
    },
    error: () => {
      // No-op error logger
    },
  };

  return new BambooClient(config, logger || silentLogger);
}
