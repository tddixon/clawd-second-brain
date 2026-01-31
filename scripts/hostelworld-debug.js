#!/usr/bin/env node

import { chromium } from 'playwright';

const url = 'https://www.hostelworld.com/pwa/s?q=Ao%20Nang,%20Krabi,%20Thailand&country=Thailand&type=city&id=62879&from=2026-01-31&to=2026-02-01&guests=1';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('Loading page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(10000);
    
    console.log('\n=== Taking screenshot ===');
    await page.screenshot({ path: '/home/desktop/clawd/logs/hostelworld/debug-screenshot.png', fullPage: true });
    
    console.log('\n=== Checking for common selectors ===');
    const selectors = [
      '[data-testid="property-card"]',
      '.property-card',
      '[class*="property"]',
      '[class*="listing"]',
      '[class*="hostel"]',
      'article',
      '[role="article"]'
    ];
    
    for (const selector of selectors) {
      const count = await page.locator(selector).count();
      console.log(`${selector}: ${count} elements`);
    }
    
    console.log('\n=== Page HTML sample ===');
    const html = await page.content();
    const bodyMatch = html.match(/<body[^>]*>([\s\S]{0,2000})/);
    if (bodyMatch) {
      console.log(bodyMatch[1]);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
