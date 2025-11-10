import { redact } from './redactor.js';

/**
 * Simple structured logger with JSON output in CI, pretty in terminal
 */

export interface LogContext {
  cmd?: string;
  runId?: string;
  [key: string]: any;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
}

const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

function formatLogEntry(level: string, msg: string, ctx?: LogContext): string {
  const shouldRedact = process.env.GLOVEN_LOG_PII !== 'true';
  const safeMsg = shouldRedact ? redact(msg) : msg;
  const safeCtx = shouldRedact && ctx ? JSON.parse(redact(JSON.stringify(ctx))) : ctx;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message: safeMsg,
    ...(safeCtx && { context: safeCtx }),
  };

  if (isCI) {
    // JSON output in CI for structured logging
    return JSON.stringify(entry);
  } else {
    // Pretty terminal output
    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🔍',
    }[level] || 'ℹ️';
    
    const contextStr = safeCtx ? ` ${JSON.stringify(safeCtx)}` : '';
    return `${emoji}  ${safeMsg}${contextStr}`;
  }
}

export const logger = {
  info(msg: string, ctx?: LogContext): void {
    console.log(formatLogEntry('info', msg, ctx));
  },

  warn(msg: string, ctx?: LogContext): void {
    console.warn(formatLogEntry('warn', msg, ctx));
  },

  error(msg: string, ctx?: LogContext): void {
    console.error(formatLogEntry('error', msg, ctx));
  },

  debug(msg: string, ctx?: LogContext): void {
    if (process.env.DEBUG === 'true') {
      console.log(formatLogEntry('debug', msg, ctx));
    }
  },
};