type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private minLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  constructor(minLevel: LogLevel = 'info') {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${ctx}`;
  }

  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('debug')) return;
    const entry: LogEntry = { timestamp: new Date(), level: 'debug', message, context };
    this.addLog(entry);
    console.debug(this.formatMessage('debug', message, context));
  }

  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('info')) return;
    const entry: LogEntry = { timestamp: new Date(), level: 'info', message, context };
    this.addLog(entry);
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('warn')) return;
    const entry: LogEntry = { timestamp: new Date(), level: 'warn', message, context };
    this.addLog(entry);
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    if (!this.shouldLog('error')) return;
    const entry: LogEntry = { timestamp: new Date(), level: 'error', message, context, error };
    this.addLog(entry);
    console.error(this.formatMessage('error', message, context), error);
  }

  getLogs(filter?: { level?: LogLevel; since?: Date }): LogEntry[] {
    let filtered = [...this.logs];

    if (filter?.level) {
      filtered = filtered.filter((log) => log.level === filter.level);
    }

    if (filter?.since) {
      filtered = filtered.filter((log) => log.timestamp >= filter.since!);
    }

    return filtered;
  }

  clear(): void {
    this.logs = [];
  }

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }
}

export const logger = new Logger();
