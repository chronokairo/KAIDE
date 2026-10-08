/**
 * Simple Logger Utility
 * 
 * Provides structured logging with context support.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'request';

interface LogContext {
    [key: string]: unknown;
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    category: string;
    message: string;
    context?: LogContext;
}

// In-memory log storage for admin access
const logBuffer: LogEntry[] = [];
const MAX_LOG_ENTRIES = 1000;

function formatLog(level: LogLevel, category: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${category}] ${message}${contextStr}`;
}

function log(level: LogLevel, category: string, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = formatLog(level, category, message, context);

    // Store in buffer
    logBuffer.push({ timestamp, level, category, message, context });
    if (logBuffer.length > MAX_LOG_ENTRIES) {
        logBuffer.shift();
    }

    switch (level) {
        case 'error':
            console.error(formattedMessage);
            break;
        case 'warn':
            console.warn(formattedMessage);
            break;
        case 'debug':
            if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
                console.debug(formattedMessage);
            }
            break;
        default:
            console.log(formattedMessage);
    }
}

export const logger = {
    debug: (category: string, message: string, context?: LogContext) =>
        log('debug', category, message, context),

    info: (category: string, message: string, context?: LogContext) =>
        log('info', category, message, context),

    warn: (category: string, message: string, context?: LogContext) =>
        log('warn', category, message, context),

    error: (category: string, message: string, context?: LogContext) =>
        log('error', category, message, context),

    request: (category: string, message: string, context?: LogContext) =>
        log('request', category, message, context),
};

/**
 * Get recent logs, optionally filtered by level
 */
export function getLogs(options: { level?: LogLevel; limit?: number } = {}): LogEntry[] {
    const { level, limit = 100 } = options;

    let logs = [...logBuffer];

    if (level) {
        logs = logs.filter(l => l.level === level);
    }

    return logs.slice(-limit);
}

/**
 * Get log statistics
 */
export function getLogStats(): Record<LogLevel, number> {
    const stats: Record<LogLevel, number> = {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
        request: 0,
    };

    for (const entry of logBuffer) {
        stats[entry.level]++;
    }

    return stats;
}

/**
 * Clear all logs from buffer
 */
export function clearLogs(): void {
    logBuffer.length = 0;
}