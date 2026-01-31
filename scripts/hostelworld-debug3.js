#!/usr/bin/env node

import { chromium } from 'playwright';
import { promises as fs } from 'fs';

const url = 'https://www.hostelworld.com/pwa/s?q=Ao%20Nang,%20Krabi,%20Thailand&country=Thailand&type=city&id=62879&from=2026-01-31&to=2026-02-01&guests=1';

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('Loading page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(15000);
    
    // Save HTML for inspection
    const html = await page.content();
    await fs.writeFile('/home/desktop/clawd/logs/hostelworld/debug-page.html', html);
    console.log('HTML saved');
    
    // Take screenshot
    await page.screenshot({ 
      path: '/home/desktop/clawd/logs/hostelworld/debug-screenshot.png',
      fullPage: true 
    });
    console.log('Screenshot saved');
    
    // Check for links
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href*="hosteldetails.php"]'))
        .map(a => ({
          href: a.href,
          text: a.textContent.trim().substring(0, 100)
        }));
    });
    
    console.log(`\nFound ${links.length} hostel detail links`);
    links.slice(0, 5).forEach((link, i) => {
      console.log(`\n${i + 1}. ${link.text}`);
      console.log(`   ${link.href}`);
    });
    
    // Check for any links with "From" and price
    const priceLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .filter(a => a.textContent.includes('From') && a.textContent.includes('THB'))
        .map(a => a.textContent.trim().substring(0, 150));
    });
    
    console.log(`\n\nFound ${priceLinks.length} price links`);
    priceLinks.slice(0, 3).forEach((text, i) => {
      console.log(`\n${i + 1}. ${text}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
