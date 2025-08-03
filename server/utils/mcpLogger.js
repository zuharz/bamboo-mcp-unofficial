/**
 * Enhanced MCP Logging System
 * Provides structured logging with MCP notification support and fallback to console
 */
class MCPLogger {
  server = null;
  config;
  logQueue = [];
  levelPriority = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };
  constructor(config = {}) {
    this.config = {
      minLevel: 'info',
      enableConsoleOutput: true,
      sanitizationRules: [
        { pattern: /api[_-]?key/i, replacement: '[REDACTED]' },
        { pattern: /password/i, replacement: '[REDACTED]' },
        { pattern: /token/i, replacement: '[REDACTED]' },
        { pattern: /authorization/i, replacement: '[REDACTED]' },
        {
          pattern: /bearer\s+[a-zA-Z0-9_-]+/i,
          replacement: 'Bearer [REDACTED]',
        },
      ],
      ...config,
    };
  }
  /**
   * Set the MCP server instance for sending notifications
   * Should be called after server initialization
   */
  setServer(server) {
    this.server = server;
    this.flushQueuedLogs();
  }
  /**
   * Set the minimum log level
   */
  setMinLevel(level) {
    this.config.minLevel = level;
  }
  /**
   * Check if a log level should be processed
   */
  shouldLog(level) {
    return (
      this.levelPriority[level] >= this.levelPriority[this.config.minLevel]
    );
  }
  /**
   * Main logging method
   */
  async log(level, logger, message, data) {
    if (!this.shouldLog(level)) {
      return;
    }
    const entry = {
      level,
      logger,
      message,
      data: data ? this.sanitizeData(data) : undefined,
      timestamp: new Date().toISOString(),
    };
    if (this.server) {
      await this.sendLogEntry(entry);
    } else {
      // Queue for later or use console fallback
      this.logQueue.push(entry);
      if (this.config.enableConsoleOutput) {
        this.consoleLog(entry);
      }
    }
  }
  /**
   * Flush queued logs when server becomes available
   */
  async flushQueuedLogs() {
    while (this.logQueue.length > 0) {
      const entry = this.logQueue.shift();
      await this.sendLogEntry(entry);
    }
  }
  /**
   * Send log entry via MCP notification with console fallback
   */
  async sendLogEntry(entry) {
    try {
      if (this.server) {
        await this.server.notification({
          method: 'notifications/message',
          params: {
            level: entry.level,
            logger: entry.logger,
            message: entry.message,
            data: entry.data,
          },
        });
      }
    } catch (error) {
      // Fallback to console if MCP notification fails
      if (this.config.enableConsoleOutput) {
        this.consoleLog(entry);
      }
    }
  }
  /**
   * Console logging fallback
   */
  consoleLog(entry) {
    const timestamp = entry.timestamp;
    const prefix = `[${entry.level.toUpperCase()}] ${timestamp} [${entry.logger}]`;
    const message = `${prefix} ${entry.message}`;
    if (entry.data) {
      console.error(message, entry.data);
    } else {
      console.error(message);
    }
  }
  /**
   * Sanitize sensitive data from logs
   */
  sanitizeData(data) {
    if (!data) {
      return data;
    }
    try {
      const sanitized = JSON.parse(JSON.stringify(data));
      this.applySanitizationRules(sanitized);
      return sanitized;
    } catch (error) {
      // If serialization fails, return safe representation
      return { error: 'Failed to sanitize log data' };
    }
  }
  /**
   * Apply sanitization rules recursively
   */
  applySanitizationRules(obj) {
    if (!obj || typeof obj !== 'object') {
      return;
    }
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Check if key matches sensitive patterns
        for (const rule of this.config.sanitizationRules) {
          if (rule.pattern.test(key)) {
            obj[key] = rule.replacement;
            break;
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        this.applySanitizationRules(value);
      }
    }
  }
  // Domain-specific logging methods for easy adoption
  /**
   * BambooClient logging
   */
  bambooClient(level, message, data) {
    this.log(level, 'bamboo-client', message, data);
  }
  /**
   * Employee handler logging
   */
  employee(level, message, data) {
    this.log(level, 'employee-handler', message, data);
  }
  /**
   * Analytics handler logging
   */
  analytics(level, message, data) {
    this.log(level, 'analytics-handler', message, data);
  }
  /**
   * Time-off handler logging
   */
  timeOff(level, message, data) {
    this.log(level, 'time-off-handler', message, data);
  }
  /**
   * Organization handler logging
   */
  organization(level, message, data) {
    this.log(level, 'organization-handler', message, data);
  }
  /**
   * Dataset handler logging
   */
  dataset(level, message, data) {
    this.log(level, 'dataset-handler', message, data);
  }
  /**
   * Report handler logging
   */
  report(level, message, data) {
    this.log(level, 'report-handler', message, data);
  }
  /**
   * Startup/initialization logging
   */
  startup(level, message, data) {
    this.log(level, 'startup', message, data);
  }
  // Convenience methods for common log levels
  debug(logger, message, data) {
    this.log('debug', logger, message, data);
  }
  info(logger, message, data) {
    this.log('info', logger, message, data);
  }
  warn(logger, message, data) {
    this.log('warn', logger, message, data);
  }
  error(logger, message, data) {
    this.log('error', logger, message, data);
  }
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Get queue status for debugging
   */
  getQueueStatus() {
    return {
      queueLength: this.logQueue.length,
      hasServer: this.server !== null,
    };
  }
}
// Global logger instance
export const mcpLogger = new MCPLogger();
