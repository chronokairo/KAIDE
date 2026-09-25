/**
 * Simple logger utility for Anamnesic Core
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: string, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data,
    };

    this.logs.push(entry);

    // Also log to console in development
    const levelName = LogLevel[level];
    const prefix = context ? `[${context}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`${levelName} ${prefix} ${message}${dataStr}`);
        break;
      case LogLevel.INFO:
        console.info(`${levelName} ${prefix} ${message}${dataStr}`);
        break;
      case LogLevel.WARN:
        console.warn(`${levelName} ${prefix} ${message}${dataStr}`);
        break;
      case LogLevel.ERROR:
        console.error(`${levelName} ${prefix} ${message}${dataStr}`);
        break;
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export default Logger.getInstance();
