/**
 * Error handling and logging utilities
 */

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;  // e.g., 'API', 'UI', 'Files', 'LLM'
  message: string;
  details?: string;
  stackTrace?: string;
}

// In-memory log storage (could be expanded to persist to localStorage)
let logEntries: LogEntry[] = [];

/**
 * Add a log entry
 */
export const addLog = (
  level: LogEntry['level'], 
  category: string, 
  message: string, 
  details?: string, 
  error?: Error
): LogEntry => {
  const timestamp = new Date().toISOString();
  const stackTrace = error?.stack;
  
  const entry: LogEntry = { 
    timestamp, 
    level, 
    category, 
    message, 
    details, 
    stackTrace 
  };
  
  logEntries.push(entry);
  
  // Log to console as well for debugging
  const consoleMethod = level === 'error' 
    ? console.error 
    : level === 'warn' 
      ? console.warn 
      : console.log;
      
  consoleMethod(`[${category}] ${message}`, details || '', error || '');
  
  return entry;
};

/**
 * Get all logs
 */
export const getLogs = (): LogEntry[] => {
  return [...logEntries];
};

/**
 * Clear logs
 */
export const clearLogs = (): void => {
  logEntries = [];
};

/**
 * Filter logs
 */
export const filterLogs = (options: {
  level?: LogEntry['level'] | LogEntry['level'][];
  category?: string | string[];
  since?: Date;
}): LogEntry[] => {
  return logEntries.filter(log => {
    if (options.level) {
      const levels = Array.isArray(options.level) ? options.level : [options.level];
      if (!levels.includes(log.level)) return false;
    }
    
    if (options.category) {
      const categories = Array.isArray(options.category) ? options.category : [options.category];
      if (!categories.includes(log.category)) return false;
    }
    
    if (options.since) {
      const logDate = new Date(log.timestamp);
      if (logDate < options.since) return false;
    }
    
    return true;
  });
};

/**
 * Format a user-friendly error message from various error types
 */
export const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  
  return 'An unknown error occurred';
};

/**
 * Safely extract error details for display
 */
export const getErrorDetails = (error: unknown): string | undefined => {
  // For Error objects, return the stack trace
  if (error instanceof Error && error.stack) {
    // Return just the first few lines to avoid overwhelming the UI
    return error.stack.split('\n').slice(0, 3).join('\n');
  }
  
  // For API errors that might be nested
  if (
    error && 
    typeof error === 'object' && 
    'response' in error && 
    error.response && 
    typeof error.response === 'object'
  ) {
    try {
      return JSON.stringify(error.response, null, 2);
    } catch (e) {
      return 'Error response could not be stringified';
    }
  }
  
  return undefined;
}; 