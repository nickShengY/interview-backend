/**
 * Simple logger utility
 * In production, consider using a service like Sentry, LogRocket, or Datadog
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

const nativeConsole = globalThis.console

interface LogData {
  message: string
  level: LogLevel
  timestamp: string
  data?: unknown
}

class Logger {
  private log(level: LogLevel, message: string, data?: unknown) {
    const logData: LogData = {
      message,
      level,
      timestamp: new Date().toISOString(),
      data,
    }

    // In development, use console
    if (process.env.NODE_ENV === 'development') {
      const color = {
        info: '\x1b[36m',    // Cyan
        warn: '\x1b[33m',    // Yellow
        error: '\x1b[31m',   // Red
        debug: '\x1b[90m',   // Gray
      }[level]

      nativeConsole.log(`${color}[${level.toUpperCase()}]\x1b[0m ${message}`, data || '')
      return
    }

    // In production, send to monitoring service
    // Example: Send to Sentry, LogRocket, etc.
    if (level === 'error') {
      // TODO: Integrate with error monitoring service
      nativeConsole.error(JSON.stringify(logData))
    } else {
      nativeConsole.log(JSON.stringify(logData))
    }
  }

  info(message: string, data?: unknown) {
    this.log('info', message, data)
  }

  warn(message: string, data?: unknown) {
    this.log('warn', message, data)
  }

  error(message: string, data?: unknown) {
    this.log('error', message, data)
  }

  debug(message: string, data?: unknown) {
    this.log('debug', message, data)
  }
}

export const logger = new Logger()
