/**
 * Enhanced MCP Logging System
 * Provides structured logging with MCP notification support and fallback to console
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

interface LogData {
  [key: string]: any;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface SanitizationRule {
  pattern: RegExp;
  replacement: string;
}

interface MCPLoggerConfig {
  minLevel: LogLevel;
  enableConsoleOutput: boolean;
  sanitizationRules: SanitizationRule[];
}

interface LogEntry {
  level: LogLevel;
  logger: string;
  message: string;
  data?: LogData;
  timestamp: string;
}

class MCPLogger {
  private server: Server | null = null;
  private config: MCPLoggerConfig;
  private logQueue: LogEntry[] = [];
  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(config: Partial<MCPLoggerConfig> = {}) {
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
  setServer(server: Server): void {
    this.server = server;
    this.flushQueuedLogs();
  }

  /**
   * Set the minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  /**
   * Check if a log level should be processed
   */
  private shouldLog(level: LogLevel): boolean {
    return (
      this.levelPriority[level] >= this.levelPriority[this.config.minLevel]
    );
  }

  /**
   * Main logging method
   */
  async log(
    level: LogLevel,
    logger: string,
    message: string,
    data?: LogData
  ): Promise<void> {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
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
  private async flushQueuedLogs(): Promise<void> {
    while (this.logQueue.length > 0) {
      const entry = this.logQueue.shift()!;
      await this.sendLogEntry(entry);
    }
  }

  /**
   * Send log entry via MCP notification with console fallback
   */
  private async sendLogEntry(entry: LogEntry): Promise<void> {
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
  private consoleLog(entry: LogEntry): void {
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
  private sanitizeData(data: any): any {
    if (!data) return data;

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
  private applySanitizationRules(obj: any): void {
    if (!obj || typeof obj !== 'object') return;

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
  bambooClient(level: LogLevel, message: string, data?: LogData): void {
    this.log(level, 'bamboo-client', message, data);
  }

  /**
   * Employee handler logging
   */
  employee(level: LogLevel, message: string, data?: LogData): void {
    this.log(level, 'employee-handler', message, data);
  }

  /**
   * Analytics handler logging
   */
  analytics(level: LogLevel, message: string, data?: LogData): void {
    this.log(level, 'analytics-handler', message, data);
  }

  /**
   * Time-off handler logging
   */
  timeOff(level: LogLevel, message: string, data?: LogData): void {
    this.log(level, 'time-off-handler', message, data);
  }

  /**
   * Organization handler logging
   */
  organization(level: LogLevel, message: string, data?: LogData): void {
    this.log(level, 'organization-handler', message, data);
  }

  /**
   * Dataset handler logging
   */
  dataset(level: LogLevel, message: string, data?: LogData): void {
    this.log(level, 'dataset-handler', message, data);
  }

  /**
   * Report handler logging
   */
  report(level: LogLevel, message: string, data?: LogData): void {
    this.log(level, 'report-handler', message, data);
  }

  /**
   * Startup/initialization logging
   */
  startup(level: LogLevel, message: string, data?: LogData): void {
    this.log(level, 'startup', message, data);
  }

  // Convenience methods for common log levels

  debug(logger: string, message: string, data?: LogData): void {
    this.log('debug', logger, message, data);
  }

  info(logger: string, message: string, data?: LogData): void {
    this.log('info', logger, message, data);
  }

  warn(logger: string, message: string, data?: LogData): void {
    this.log('warn', logger, message, data);
  }

  error(logger: string, message: string, data?: LogData): void {
    this.log('error', logger, message, data);
  }

  /**
   * Get current configuration
   */
  getConfig(): MCPLoggerConfig {
    return { ...this.config };
  }

  /**
   * Get queue status for debugging
   */
  getQueueStatus(): { queueLength: number; hasServer: boolean } {
    return {
      queueLength: this.logQueue.length,
      hasServer: this.server !== null,
    };
  }
}

// Global logger instance
export const mcpLogger = new MCPLogger();

// Export types for external use
export type { LogLevel, LogData, MCPLoggerConfig };
