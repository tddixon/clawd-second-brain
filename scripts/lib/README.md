# Shared Libraries Documentation

Location: `/home/desktop/clawd/scripts/lib/`

---

## Quick Start

```javascript
// Import configuration and utilities
const config = require('./lib/config');
const { sanitizeName, ensureDir, logger, retry } = require('./lib/utils');

// Access configuration
const vault = config.obsidian.vault;
const clickupToken = config.clickup.apiToken;

// Use utilities
ensureDir('/path/to/dir');
const cleanName = sanitizeName('My Project Name');
logger.info('Starting script...');
```

---

## 📦 config.js - Centralized Configuration

Loads configuration from `/home/desktop/clawd/.env` and provides structured access.

### Configuration Hierarchy

1. **Process environment variables** (highest priority)
2. **`.env` file** values (fallback)
3. **Default values** (if neither exists)

### Usage Examples

```javascript
const config = require('./lib/config');

// ClickUp
config.clickup.apiToken        // Trevor's API token
config.clickup.teamId          // Team ID
config.clickup.clawdToken      // Clawd's API token
config.clickup.clawdUserId     // Clawd's user ID
config.clickup.trevorUserId    // Trevor's user ID

// Todoist
config.todoist.apiToken        // Todoist API token
config.todoist.apiUrl          // API endpoint

// Obsidian
config.obsidian.vault          // Vault path
config.obsidian.inbox          // 00-Inbox/
config.obsidian.daily          // 01-Daily-Notes/
config.obsidian.projects       // 02-Projects/
config.obsidian.areas          // 03-Areas/
config.obsidian.tasks          // 04-Tasks/
config.obsidian.resources      // Resources/
config.obsidian.archives       // Archives/

// Paths
config.paths.logs              // /home/desktop/clawd/logs
config.paths.state             // /home/desktop/clawd/.clawdsync

// Validation
config.validateClickUp()       // Throws if ClickUp config missing
config.validateTodoist()       // Throws if Todoist config missing
config.validateObsidian()      // Throws if vault doesn't exist

// Direct access
config.get('SOME_KEY', 'default')
```

### Environment Variables

**Note:** Environment variables take precedence over `.env` file values.

Check current environment:
```bash
env | grep OBSIDIAN
env | grep CLICKUP
env | grep TODOIST
```

---

## 🛠️ utils.js - Common Utilities

Shared utility functions for all integration scripts.

### File System

```javascript
const { ensureDir, readJSON, writeJSON, readFile, writeFile } = require('./lib/utils');

// Create directory if missing
ensureDir('/path/to/dir');

// Read/write JSON with error handling
const data = readJSON('/path/to/file.json', { default: 'value' });
writeJSON('/path/to/file.json', { key: 'value' });

// Read/write files safely
const content = readFile('/path/to/file.txt', 'default content');
writeFile('/path/to/file.txt', 'content');
```

### Name Sanitization

```javascript
const { sanitizeName, sanitizeFilename } = require('./lib/utils');

// Lowercase, dashes, no special chars
sanitizeName('My Project Name!')  
// → "my-project-name"

// Preserve case, safe for filenames
sanitizeFilename('My File (v2).txt')
// → "My-File-v2.txt"
```

### Logging

```javascript
const { log, logger } = require('./lib/utils');

// Structured logging with timestamps
log('INFO', 'Starting sync...');
log('ERROR', 'Failed to connect', '/path/to/logfile.log');

// Convenience methods
logger.info('Starting...');
logger.warn('Warning message');
logger.error('Error occurred');
logger.debug('Debug info');
```

### Retry Logic

```javascript
const { retry, retryAPI, sleep } = require('./lib/utils');

// Retry with exponential backoff
const result = await retry(async () => {
  return await someApiCall();
}, {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  onRetry: (attempt, error, delay) => {
    console.log(`Retry ${attempt}: ${error.message}`);
  }
});

// API-specific retry (simpler)
const data = await retryAPI(
  () => fetch('https://api.example.com/data'),
  'Fetching data'
);

// Sleep/delay
await sleep(1000);  // 1 second
```

### Date/Time

```javascript
const { getTimestamp, getDateString, getTimeString } = require('./lib/utils');

getTimestamp()      // "2026-01-31T18:35:24.914Z"
getDateString()     // "2026-01-31"
getTimeString()     // "18:35:24"
```

### Array/Object Utilities

```javascript
const { groupBy, chunk } = require('./lib/utils');

// Group array by property
const tasks = [
  { project: 'A', name: 'Task 1' },
  { project: 'A', name: 'Task 2' },
  { project: 'B', name: 'Task 3' }
];
const grouped = groupBy(tasks, 'project');
// { A: [...], B: [...] }

// Chunk array
const items = [1, 2, 3, 4, 5, 6, 7];
const chunks = chunk(items, 3);
// [[1, 2, 3], [4, 5, 6], [7]]
```

---

## 🔒 Security Notes

**`.env` file contains sensitive credentials!**

- ✅ Included in `.gitignore` (check with `git check-ignore .env`)
- ⚠️ Do NOT commit to git
- ⚠️ Do NOT share publicly
- ✅ Backup securely (encrypted)

**Rotating credentials:**

1. Update `.env` file with new values
2. Scripts automatically pick up changes on next run
3. No code changes needed

---

## 📝 Migration Checklist

When migrating existing scripts:

- [ ] Replace hardcoded paths with `config.obsidian.*`
- [ ] Replace `process.env.CLICKUP_API_TOKEN` with `config.clickup.apiToken`
- [ ] Remove custom `ensureDir()` functions, use `require('./lib/utils').ensureDir`
- [ ] Remove custom `sanitizeName()` functions, use `require('./lib/utils').sanitizeName`
- [ ] Replace custom retry logic with `retry()` or `retryAPI()`
- [ ] Use `logger.*` instead of `console.log` for better logging
- [ ] Test script still works after migration

---

## 🧪 Testing

### Test Configuration Loading

```bash
cd /home/desktop/clawd
node -e "const config = require('./scripts/lib/config'); console.log(config.obsidian.vault);"
```

### Test Utilities

```bash
cd /home/desktop/clawd
node -e "const { sanitizeName } = require('./scripts/lib/utils'); console.log(sanitizeName('Test Name'));"
```

### Run Full Test Suite

```bash
cd /home/desktop/clawd/scripts/lib
node tests/config.test.js
node tests/utils.test.js
```

*(Note: Test files not yet created - TODO)*

---

## 📚 Examples

See `/home/desktop/clawd/MIGRATION-2026-01-31.md` for:
- Before/after migration examples
- Full list of changes
- Rollback instructions

---

## 🐛 Troubleshooting

### Config not loading

**Problem:** `config.obsidian.vault` returns wrong path

**Solution:** Check environment variables override `.env`:
```bash
env | grep OBSIDIAN_VAULT
# If wrong, unset it:
unset OBSIDIAN_VAULT
# Or update ~/.bashrc to use correct path
```

### Missing dependencies

**Problem:** `Cannot find module './lib/config'`

**Solution:** Ensure you're in the correct directory:
```javascript
// Relative import from scripts/ directory
const config = require('./lib/config');

// Or use absolute path
const config = require('/home/desktop/clawd/scripts/lib/config');
```

### Validation fails

**Problem:** `Missing required configuration: CLICKUP_API_TOKEN`

**Solution:** Check `.env` file exists and has required values:
```bash
cat /home/desktop/clawd/.env | grep CLICKUP
```

---

**Last Updated:** 2026-01-31  
**Maintainer:** Clawd  
**Questions:** Update this README or see MIGRATION-2026-01-31.md
