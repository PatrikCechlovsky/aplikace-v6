// FILE: app/lib/logger.ts
// PURPOSE: Centralized logging utility - replaces console.log/error/warn

const isDevelopment = process.env.NODE_ENV === 'development'

interface Logger {
  log: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
  debug: (...args: any[]) => void
}

function createLogger(prefix: string = ''): Logger {
  const prefixStr = prefix ? `[${prefix}]` : ''

  return {
    log: (...args: any[]) => {
      if (isDevelopment) {
        // eslint-disable-next-line no-console
        console.log(prefixStr, ...args)
      }
    },
    warn: (...args: any[]) => {
      if (isDevelopment) {
        // eslint-disable-next-line no-console
        console.warn(prefixStr, ...args)
      }
      // In production, you might want to send warnings to error tracking service
    },
    error: (...args: any[]) => {
      // Errors should always be logged, even in production
      // eslint-disable-next-line no-console
      console.error(prefixStr, ...args)
      // In production, you might want to send errors to error tracking service (e.g., Sentry)
    },
    debug: (...args: any[]) => {
      if (isDevelopment) {
        // eslint-disable-next-line no-console
        console.log(prefixStr, '[DEBUG]', ...args)
      }
    },
  }
}

// Default logger (no prefix)
export const logger = createLogger()

// Export factory function for creating prefixed loggers
export default createLogger

