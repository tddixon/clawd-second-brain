#!/usr/bin/env node
/**
 * Centralized Configuration Loader
 * 
 * Loads configuration from .env file and provides defaults.
 * Usage:
 *   const config = require('./lib/config');
 *   console.log(config.OBSIDIAN_VAULT);
 *   console.log(config.clickup.teamId);
 */

const fs = require('fs');
const path = require('path');

// Find project root (where .env lives)
function findProjectRoot() {
  let currentDir = __dirname;
  
  // Walk up from scripts/lib/ to find .env
  while (currentDir !== '/') {
    const envPath = path.join(currentDir, '.env');
    if (fs.existsSync(envPath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  
  // Default to /home/desktop/clawd
  return '/home/desktop/clawd';
}

// Load .env file
function loadEnv(envPath) {
  if (!fs.existsSync(envPath)) {
    console.warn(`Warning: .env file not found at ${envPath}`);
    return {};
  }
  
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  
  content.split('\n').forEach(line => {
    // Skip comments and empty lines
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    
    // Parse KEY=VALUE
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2].trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      env[key] = value;
    }
  });
  
  return env;
}

// Merge environment variables (process.env takes precedence over .env file)
function mergeEnv(fileEnv) {
  const merged = { ...fileEnv };
  
  // Override with process.env values
  Object.keys(fileEnv).forEach(key => {
    if (process.env[key]) {
      merged[key] = process.env[key];
    }
  });
  
  return merged;
}

// ============================================================================
// Load Configuration
// ============================================================================

const PROJECT_ROOT = findProjectRoot();
const ENV_PATH = path.join(PROJECT_ROOT, '.env');
const fileEnv = loadEnv(ENV_PATH);
const env = mergeEnv(fileEnv);

// ============================================================================
// Export Structured Configuration
// ============================================================================

const config = {
  // Project paths
  PROJECT_ROOT,
  ENV_PATH,
  
  // ClickUp
  clickup: {
    // Trevor's credentials (for syncing)
    apiToken: env.CLICKUP_API_TOKEN || env.CLICKUP_API_KEY || '',
    apiKey: env.CLICKUP_API_KEY || env.CLICKUP_API_TOKEN || '',
    teamId: env.CLICKUP_TEAM_ID || '',
    baseUrl: env.CLICKUP_BASE_URL || 'https://api.clickup.com/api/v2',
    
    // Clawd's credentials (for task execution)
    clawdToken: env.CLAWD_CLICKUP_TOKEN || '',
    clawdUserId: env.CLAWD_CLICKUP_USER_ID || '',
    
    // Trevor's user ID (for assistance)
    trevorUserId: env.CLAWD_TREVOR_USER_ID || '',
  },
  
  // Todoist
  todoist: {
    apiToken: env.TODOIST_API_TOKEN || '',
    apiUrl: env.TODOIST_API_URL || 'https://api.todoist.com/rest/v2',
  },
  
  // Obsidian
  obsidian: {
    vault: env.OBSIDIAN_VAULT || env.VAULT_PATH || '/home/desktop/obsidian-second-brain',
    
    // Common vault directories
    get inbox() { return path.join(this.vault, '00-Inbox'); },
    get daily() { return path.join(this.vault, '01-Daily-Notes'); },
    get projects() { return path.join(this.vault, '02-Projects'); },
    get areas() { return path.join(this.vault, '03-Areas'); },
    get tasks() { return path.join(this.vault, '04-Tasks'); },
    get resources() { return path.join(this.vault, 'Resources'); },
    get archives() { return path.join(this.vault, 'Archives'); },
  },
  
  // System paths
  paths: {
    logs: env.LOG_DIR || '/home/desktop/clawd/logs',
    state: env.STATE_DIR || '/home/desktop/clawd/.clawdsync',
  },
  
  // Raw environment for direct access
  env,
  
  // Helper: Get config value with fallback
  get(key, defaultValue = '') {
    return env[key] || defaultValue;
  },
  
  // Helper: Validate required config keys
  validate(requiredKeys = []) {
    const missing = requiredKeys.filter(key => !env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}\nCheck ${ENV_PATH}`);
    }
    return true;
  },
};

// ============================================================================
// Validation Helpers
// ============================================================================

// Validate ClickUp configuration
config.validateClickUp = () => {
  return config.validate(['CLICKUP_API_TOKEN', 'CLICKUP_TEAM_ID']);
};

// Validate Todoist configuration
config.validateTodoist = () => {
  return config.validate(['TODOIST_API_TOKEN']);
};

// Validate Obsidian vault exists
config.validateObsidian = () => {
  if (!fs.existsSync(config.obsidian.vault)) {
    throw new Error(`Obsidian vault not found: ${config.obsidian.vault}`);
  }
  return true;
};

module.exports = config;
