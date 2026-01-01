/**
 * Centralized Logging System
 */

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: any;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, context } = entry;
    let log = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (context) {
      log += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }
    
    if (entry.error) {
      log += `\nError: ${entry.error.message}\nStack: ${entry.error.stack}`;
    }
    
    return log;
  }

  private log(level: LogLevel, message: string, context?: any, error?: Error) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error,
    };

    const formattedLog = this.formatLog(entry);

    // Console output based on environment
    if (this.isDevelopment) {
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedLog);
          break;
        case LogLevel.WARN:
          console.warn(formattedLog);
          break;
        case LogLevel.INFO:
          console.info(formattedLog);
          break;
        case LogLevel.DEBUG:
          console.debug(formattedLog);
          break;
      }
    } else {
      // In production, you would send to external logging service
      // e.g., Sentry, DataDog, CloudWatch, etc.
      console.log(JSON.stringify(entry));
    }
  }

  error(message: string, error?: Error, context?: any) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context?: any) {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: any) {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: any) {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }
}

export const logger = new Logger();
