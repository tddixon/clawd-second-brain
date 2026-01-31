#!/usr/bin/env node

import { chromium } from 'playwright';
import { promises as fs } from 'fs';

const url = 'https://www.hostelworld.com/pwa/s?q=Ao%20Nang,%20Krabi,%20Thailand&country=Thailand&type=city&id=62879&from=2026-01-31&to=2026-02-01&guests=1';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Loading page...');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(15000); // Wait 15 seconds for everything to load

    console.log('\n=== Saving HTML ===');
    const html = await page.content();
    await fs.writeFile('/home/desktop/clawd/logs/hostelworld/page.html', html);
    console.log('HTML saved to /home/desktop/clawd/logs/hostelworld/page.html');

    console.log('\n=== Saving screenshot ===');
    await page.screenshot({ path: '/home/desktop/clawd/logs/hostelworld/debug2-screenshot.png', fullPage: true });

    console.log('\n=== Searching for hostel-related elements ===');
    const results = await page.evaluate(() => {
      const output = [];

      // Search for any elements containing hostel names (like "Nomads", "Base")
      const allElements = Array.from(document.querySelectorAll('*'));
      const hostelElements = allElements.filter(el => {
        const text = el.textContent || '';
        return text.toLowerCase().includes('nomads') ||
               text.toLowerCase().includes('base') ||
               text.toLowerCase().includes('ao nang');
      });

      output.push(`Found ${hostelElements.length} elements containing hostel keywords`);

      // Show the structure of first 5 hostel elements
      hostelElements.slice(0, 5).forEach((el, i) => {
        output.push(`\n--- Element ${i + 1} ---`);
        output.push(`Tag: ${el.tagName}`);
        output.push(`Classes: ${el.className}`);
        output.push(`Data attributes: ${Array.from(el.attributes)
          .filter(attr => attr.name.startsWith('data-'))
          .map(attr => `${attr.name}="${attr.value}"`)
          .join(', ')}`);
        output.push(`Text preview: ${el.textContent.trim().substring(0, 100)}`);
      });

      // Look for price elements
      const priceElements = Array.from(document.querySelectorAll('*')).filter(el => {
        const text = el.textContent || '';
        return text.includes('THB') && /\d+/.test(text);
      });

      output.push(`\n\nFound ${priceElements.length} elements with prices`);

      // Show first 5 price elements
      priceElements.slice(0, 5).forEach((el, i) => {
        output.push(`\n--- Price ${i + 1} ---`);
        output.push(`Text: ${el.textContent.trim().substring(0, 80)}`);
      });

      return output;
    });

    results.forEach(line => console.log(line));

    console.log('\n\nPress Enter to close browser...');
    // Give some time to see what's happening
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
})();
