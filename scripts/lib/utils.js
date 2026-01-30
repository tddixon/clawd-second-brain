#!/usr/bin/env node
/**
 * Shared Utility Functions
 * 
 * Common patterns extracted from integration scripts:
 * - File system utilities
 * - Name sanitization
 * - Logging
 * - Retry logic with exponential backoff
 * - JSON helpers
 * 
 * Usage:
 *   const { sanitizeName, log, retry, ensureDir } = require('./lib/utils');
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// File System Utilities
// ============================================================================

/**
 * Ensure directory exists, create if missing
 * @param {string} dir - Directory path
 */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Read JSON file with error handling
 * @param {string} filePath - Path to JSON file
 * @param {*} defaultValue - Default value if file doesn't exist
 * @returns {*} Parsed JSON or default value
 */
function readJSON(filePath, defaultValue = null) {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading JSON from ${filePath}:`, error.message);
    return defaultValue;
  }
}

/**
 * Write JSON file with pretty printing
 * @param {string} filePath - Path to JSON file
 * @param {*} data - Data to write
 * @param {number} indent - Indentation level (default: 2)
 */
function writeJSON(filePath, data, indent = 2) {
  try {
    ensureDir(path.dirname(filePath));
    const content = JSON.stringify(data, null, indent);
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing JSON to ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Safely read a file with fallback
 * @param {string} filePath - File to read
 * @param {string} defaultValue - Default value if file doesn't exist
 * @returns {string} File content or default
 */
function readFile(filePath, defaultValue = '') {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return defaultValue;
  }
}

/**
 * Safely write a file
 * @param {string} filePath - File to write
 * @param {string} content - Content to write
 * @returns {boolean} Success status
 */
function writeFile(filePath, content) {
  try {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error.message);
    return false;
  }
}

// ============================================================================
// Name Sanitization
// ============================================================================

/**
 * Sanitize filename/identifier
 * - Converts to lowercase
 * - Replaces spaces with dashes
 * - Removes special characters
 * - Collapses multiple dashes
 * - Trims leading/trailing dashes
 * 
 * @param {string} name - Name to sanitize
 * @param {number} maxLength - Maximum length (default: 60)
 * @returns {string} Sanitized name
 */
function sanitizeName(name, maxLength = 60) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars
    .replace(/\s+/g, '-')           // Spaces to dashes
    .replace(/-+/g, '-')            // Collapse dashes
    .replace(/^-+|-+$/g, '')        // Trim dashes
    .substring(0, maxLength);
}

/**
 * Sanitize for use as a filename (preserves case)
 * @param {string} name - Name to sanitize
 * @param {number} maxLength - Maximum length (default: 60)
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(name, maxLength = 60) {
  return name
    .replace(/[^a-zA-Z0-9\s-_]/g, '')  // Keep alphanumeric, spaces, dashes, underscores
    .replace(/\s+/g, '-')               // Spaces to dashes
    .replace(/-+/g, '-')                // Collapse dashes
    .replace(/^-+|-+$/g, '')            // Trim dashes
    .substring(0, maxLength);
}

// ============================================================================
// Logging Utilities
// ============================================================================

/**
 * Structured logger with timestamps and levels
 * @param {string} level - Log level (INFO, WARN, ERROR, DEBUG)
 * @param {string} message - Log message
 * @param {string|null} logFile - Optional log file path
 */
function log(level, message, logFile = null) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // Console output
  console.log(line);
  
  // File output (if specified)
  if (logFile) {
    try {
      ensureDir(path.dirname(logFile));
      fs.appendFileSync(logFile, line + '\n');
    } catch (error) {
      console.error(`Failed to write to log file ${logFile}:`, error.message);
    }
  }
}

/**
 * Convenience logging functions
 */
const logger = {
  info: (message, logFile) => log('INFO', message, logFile),
  warn: (message, logFile) => log('WARN', message, logFile),
  error: (message, logFile) => log('ERROR', message, logFile),
  debug: (message, logFile) => log('DEBUG', message, logFile),
};

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

/**
 * Sleep/delay utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 30000)
 * @param {number} options.backoffMultiplier - Backoff multiplier (default: 2)
 * @param {Function} options.onRetry - Callback on retry (optional)
 * @returns {Promise<*>} Result of function call
 */
async function retry(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    onRetry = null,
  } = options;
  
  let lastError;
  let delay = initialDelay;
  
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt > maxRetries) {
        throw error;
      }
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(attempt, error, delay);
      } else {
        console.warn(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms: ${error.message}`);
      }
      
      // Wait before retrying
      await sleep(delay);
      
      // Exponential backoff
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }
  
  throw lastError;
}

/**
 * Retry wrapper for API calls with common patterns
 * @param {Function} apiCall - API call function
 * @param {string} errorContext - Context for error messages
 * @returns {Promise<*>} API response
 */
async function retryAPI(apiCall, errorContext = 'API call') {
  return retry(apiCall, {
    maxRetries: 3,
    initialDelay: 1000,
    onRetry: (attempt, error, delay) => {
      console.warn(`${errorContext} failed (attempt ${attempt}): ${error.message}. Retrying in ${delay}ms...`);
    },
  });
}

// ============================================================================
// Date/Time Utilities
// ============================================================================

/**
 * Get ISO timestamp
 * @returns {string} ISO 8601 timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Get formatted date (YYYY-MM-DD)
 * @param {Date} date - Date object (default: now)
 * @returns {string} Formatted date
 */
function getDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

/**
 * Get formatted time (HH:MM:SS)
 * @param {Date} date - Date object (default: now)
 * @returns {string} Formatted time
 */
function getTimeString(date = new Date()) {
  return date.toTimeString().split(' ')[0];
}

/**
 * Format date for Obsidian (YYYY-MM-DD)
 * @param {number|string} timestamp - Unix timestamp or ISO date
 * @returns {string} Formatted date
 */
function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = typeof timestamp === 'string' 
    ? new Date(timestamp) 
    : new Date(parseInt(timestamp));
  return date.toISOString().split('T')[0];
}

/**
 * Format ISO datetime for frontmatter
 * @param {number|string} timestamp - Unix timestamp or ISO date
 * @returns {string} ISO datetime string
 */
function formatDateTime(timestamp) {
  if (!timestamp) return new Date().toISOString();
  const date = typeof timestamp === 'string' 
    ? new Date(timestamp) 
    : new Date(parseInt(timestamp));
  return date.toISOString();
}

// ============================================================================
// Configuration Utilities
// ============================================================================

/**
 * Load config from file and environment
 * @param {string} configPath - Path to config file
 * @returns {object} - Config object
 */
function loadConfig(configPath) {
  const config = {
    CLICKUP_API_TOKEN: process.env.CLICKUP_API_TOKEN || process.env.CLICKUP_API_KEY,
    CLICKUP_TEAM_ID: process.env.CLICKUP_TEAM_ID,
    OBSIDIAN_VAULT: process.env.OBSIDIAN_VAULT || '/home/desktop/obsidian-second-brain',
  };
  
  // Try to source config file if it exists
  if (fs.existsSync(configPath)) {
    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const lines = configContent.split('\n');
      
      for (const line of lines) {
        if (line.trim().startsWith('export ')) {
          const match = line.match(/export\s+(\w+)=["']?([^"'\n]+)["']?/);
          if (match) {
            const [, key, value] = match;
            // Only override if not already set in environment
            if (!config[key]) {
              config[key] = value;
            }
          }
        }
      }
    } catch (e) {
      console.warn(`⚠️  Could not load config from ${configPath}: ${e.message}`);
    }
  }
  
  return config;
}

// ============================================================================
// Array/Object Utilities
// ============================================================================

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {string|Function} key - Property name or getter function
 * @returns {Object} Grouped object
 */
function groupBy(array, key) {
  const getKey = typeof key === 'function' ? key : item => item[key];
  
  return array.reduce((grouped, item) => {
    const groupKey = getKey(item);
    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(item);
    return grouped;
  }, {});
}

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array<Array>} Chunked arrays
 */
function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // File system
  ensureDir,
  readJSON,
  writeJSON,
  readFile,
  writeFile,
  
  // Name sanitization
  sanitizeName,
  sanitizeFilename,
  
  // Logging
  log,
  logger,
  
  // Retry logic
  sleep,
  retry,
  retryAPI,
  
  // Date/time
  getTimestamp,
  getDateString,
  getTimeString,
  formatDate,
  formatDateTime,
  
  // Configuration
  loadConfig,
  
  // Array/object
  groupBy,
  chunk,
};
