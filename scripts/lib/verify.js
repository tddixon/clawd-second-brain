#!/usr/bin/env node
/**
 * Verification Script for config.js and utils.js
 * 
 * Run this to verify the new libraries are working correctly:
 *   node scripts/lib/verify.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Centralized Configuration & Utilities\n');
console.log('=' .repeat(60));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
}

// ============================================================================
// Test 1: Load config.js
// ============================================================================

console.log('\n📦 Testing config.js...');

test('config.js can be loaded', () => {
  const config = require('./config');
  if (!config) throw new Error('Config is null/undefined');
});

test('config.clickup has required fields', () => {
  const config = require('./config');
  if (!config.clickup.apiToken) throw new Error('Missing clickup.apiToken');
  if (!config.clickup.teamId) throw new Error('Missing clickup.teamId');
});

test('config.todoist has required fields', () => {
  const config = require('./config');
  if (!config.todoist.apiToken) throw new Error('Missing todoist.apiToken');
});

test('config.obsidian.vault path exists', () => {
  const config = require('./config');
  if (!fs.existsSync(config.obsidian.vault)) {
    throw new Error(`Vault not found: ${config.obsidian.vault}`);
  }
});

test('config.obsidian directory getters work', () => {
  const config = require('./config');
  const dirs = ['inbox', 'daily', 'projects', 'areas', 'tasks'];
  dirs.forEach(dir => {
    if (!config.obsidian[dir]) {
      throw new Error(`Missing obsidian.${dir}`);
    }
  });
});

test('config.get() works with fallback', () => {
  const config = require('./config');
  const value = config.get('NONEXISTENT_KEY', 'fallback');
  if (value !== 'fallback') throw new Error('Fallback not working');
});

// ============================================================================
// Test 2: Load utils.js
// ============================================================================

console.log('\n🛠️  Testing utils.js...');

test('utils.js can be loaded', () => {
  const utils = require('./utils');
  if (!utils) throw new Error('Utils is null/undefined');
});

test('sanitizeName() works correctly', () => {
  const { sanitizeName } = require('./utils');
  const result = sanitizeName('My Project Name!');
  if (result !== 'my-project-name') {
    throw new Error(`Expected "my-project-name", got "${result}"`);
  }
});

test('sanitizeFilename() preserves case', () => {
  const { sanitizeFilename } = require('./utils');
  const result = sanitizeFilename('My File (v2).txt');
  if (!result.includes('My-File')) {
    throw new Error(`Case not preserved: ${result}`);
  }
});

test('ensureDir() creates directory', () => {
  const { ensureDir } = require('./utils');
  const testDir = '/tmp/clawd-test-' + Date.now();
  ensureDir(testDir);
  if (!fs.existsSync(testDir)) {
    throw new Error('Directory not created');
  }
  fs.rmdirSync(testDir);
});

test('readJSON() / writeJSON() work', () => {
  const { readJSON, writeJSON } = require('./utils');
  const testFile = '/tmp/clawd-test-' + Date.now() + '.json';
  const testData = { test: true, value: 123 };
  
  writeJSON(testFile, testData);
  const result = readJSON(testFile);
  
  if (result.test !== true || result.value !== 123) {
    throw new Error('JSON read/write mismatch');
  }
  
  fs.unlinkSync(testFile);
});

test('getTimestamp() returns ISO format', () => {
  const { getTimestamp } = require('./utils');
  const timestamp = getTimestamp();
  if (!timestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    throw new Error(`Invalid timestamp format: ${timestamp}`);
  }
});

test('getDateString() returns YYYY-MM-DD', () => {
  const { getDateString } = require('./utils');
  const date = getDateString();
  if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    throw new Error(`Invalid date format: ${date}`);
  }
});

test('groupBy() groups array correctly', () => {
  const { groupBy } = require('./utils');
  const items = [
    { type: 'A', value: 1 },
    { type: 'A', value: 2 },
    { type: 'B', value: 3 }
  ];
  const grouped = groupBy(items, 'type');
  if (grouped.A.length !== 2 || grouped.B.length !== 1) {
    throw new Error('groupBy not working correctly');
  }
});

test('chunk() splits array correctly', () => {
  const { chunk } = require('./utils');
  const items = [1, 2, 3, 4, 5, 6, 7];
  const chunks = chunk(items, 3);
  if (chunks.length !== 3 || chunks[0].length !== 3 || chunks[2].length !== 1) {
    throw new Error('chunk not working correctly');
  }
});

test('sleep() returns promise', () => {
  const { sleep } = require('./utils');
  const promise = sleep(1);
  if (!(promise instanceof Promise)) {
    throw new Error('sleep() did not return Promise');
  }
});

// ============================================================================
// Test 3: Integration Tests
// ============================================================================

console.log('\n🔗 Testing integration...');

test('Config and utils work together', () => {
  const config = require('./config');
  const { sanitizeName } = require('./utils');
  
  const vault = config.obsidian.vault;
  const sanitized = sanitizeName(vault);
  
  if (!sanitized || sanitized.length === 0) {
    throw new Error('Integration test failed');
  }
});

test('.env file exists and is readable', () => {
  const envPath = path.join(__dirname, '..', '..', '.env');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found');
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  if (!content.includes('CLICKUP')) {
    throw new Error('.env file missing CLICKUP config');
  }
});

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ All tests passed! Libraries are working correctly.\n');
  console.log('Next steps:');
  console.log('  1. Use config.js in your scripts: require("./lib/config")');
  console.log('  2. Use utils.js in your scripts: require("./lib/utils")');
  console.log('  3. See scripts/lib/README.md for documentation\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Review errors above.\n');
  process.exit(1);
}
