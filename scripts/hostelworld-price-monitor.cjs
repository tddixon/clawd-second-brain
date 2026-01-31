#!/usr/bin/env node
/**
 * Hostelworld Price Monitor for Nomads properties + competitors in Ao Nang, Krabi
 * Prices shown in THB (Thai Baht) + Search Rankings
 * 
 * Usage: node hostelworld-price-monitor.cjs [--date YYYY-MM-DD] [--json] [--save]
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Nomads properties
const NOMADS_PROPERTIES = [
  { id: 316736, slug: 'Nomads-Ao-Nang-Beach', name: 'Nomads Ao Nang Beach' },
  { id: 322541, slug: 'Base-Ao-Nang-Beachfront-by-Nomads', name: 'Base Ao Nang Beachfront' },
];

// Competitors in Ao Nang area
const COMPETITOR_PROPERTIES = [
  { id: 272802, slug: 'Balcony-Party-Hostel-Ao-Nang-Beachfront-18-40', name: 'Balcony Party Hostel' },
  { id: 326955, slug: 'The-Hangout-Ao-Nang', name: 'The Hangout Ao Nang' },
  { id: 100461, slug: 'iRest-Ao-Nang-Krabi', name: 'iRest Ao Nang' },
  { id: 334981, slug: 'Whoopers-Hostel-Ao-Nang-By-The-Beach', name: 'Whoopers Hostel' },
];

const ALL_PROPERTIES = [...NOMADS_PROPERTIES, ...COMPETITOR_PROPERTIES];
const PROPERTY_MAP = new Map(ALL_PROPERTIES.map(p => [p.id, p]));

function getCheckDates(dateStr) {
  if (dateStr) {
    const d = new Date(dateStr);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    return {
      from: d.toISOString().split('T')[0],
      to: next.toISOString().split('T')[0],
    };
  }
  // Default: tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  return {
    from: tomorrow.toISOString().split('T')[0],
    to: dayAfter.toISOString().split('T')[0],
  };
}

async function scrapeSearchRankings(page, dates) {
  // Navigate to Krabi city search (Ao Nang properties show up here)
  // Using Krabi city ID 1124 since Ao Nang district search doesn't work directly
  const searchUrl = `https://www.hostelworld.com/s?q=Krabi%2C+Thailand&country=Thailand&city=Krabi&type=city&id=1124&from=${dates.from}&to=${dates.to}&guests=1&page=1`;
  
  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(8000);
    
    // Extract all property cards with their position
    const rankings = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('[data-testid*="property"], [class*="property-card"], article, .property');
      
      // Also try finding by links that contain property IDs
      const links = document.querySelectorAll('a[href*="/pwa/hosteldetails.php/"]');
      let position = 1;
      
      for (const link of links) {
        const href = link.getAttribute('href');
        // Extract property ID from URL like /pwa/hosteldetails.php/Name/Krabi/123456
        const idMatch = href.match(/\/(\d+)\?/) || href.match(/\/(\d+)$/);
        if (idMatch) {
          const propertyId = parseInt(idMatch[1]);
          // Get property name from nearby text
          const card = link.closest('article, [class*="card"], [class*="property"]') || link.parentElement;
          const nameEl = card?.querySelector('h3, h2, [class*="title"], [class*="name"]');
          const name = nameEl?.textContent?.trim() || 'Unknown';
          
          // Check if already in results (avoid duplicates)
          if (!results.find(r => r.propertyId === propertyId)) {
            results.push({ position, propertyId, name });
            position++;
          }
        }
      }
      
      return results;
    });
    
    return rankings;
  } catch (err) {
    console.error('Search ranking scrape failed:', err.message);
    return [];
  }
}

async function scrapeProperty(page, prop, dates) {
  const url = `https://www.hostelworld.com/pwa/hosteldetails.php/${prop.slug}/Krabi/${prop.id}?from=${dates.from}&to=${dates.to}&guests=1&currency=THB`;
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);
    
    const data = await page.evaluate(() => {
      const body = document.body.innerText;
      
      // Extract rating
      const ratingMatch = body.match(/(\d\.\d)\s*(Superb|Fabulous|Very Good|Good|Okay)/);
      const rating = ratingMatch ? { score: parseFloat(ratingMatch[1]), label: ratingMatch[2] } : null;
      
      // Extract review count
      const reviewMatch = body.match(/\((\d+)\)/);
      const reviewCount = reviewMatch ? parseInt(reviewMatch[1]) : null;
      
      // Extract THB prices - look for FINAL prices after discount
      // Hostelworld shows: Original Price -> Discount % -> Final Price
      // We want the final (discounted) price
      const roomSection = body.substring(body.indexOf('Dorm') || 0);
      
      // Strategy: Find price pairs where there's a discount
      // Hostelworld format: Discounted Price, -X%, Original Price
      // Example: THB 899.10 / -10% / THB 999.00
      // The FIRST price is the discounted one (what guests actually pay)
      
      const prices = [];
      
      // Look for pattern: THB Price, -XX%, THB Price (first is discounted)
      // Use [\s\S] to match any whitespace including newlines
      const discountedPrices = [];
      const originalPrices = [];
      
      const discountPattern = /THB\s*([\d,]+\.?\d*)[\s\S]*?-\d+%[\s\S]*?THB\s*([\d,]+\.?\d*)/g;
      let dMatch;
      while ((dMatch = discountPattern.exec(roomSection)) !== null) {
        // First price = discounted (what guest pays), Second = original (crossed out)
        const discounted = parseFloat(dMatch[1].replace(/,/g, ''));
        const original = parseFloat(dMatch[2].replace(/,/g, ''));
        if (discounted > 100 && discounted < 50000) discountedPrices.push(discounted);
        if (original > 100 && original < 50000) originalPrices.push(original);
      }
      
      const cheapestDorm = discountedPrices.length > 0 ? Math.min(...discountedPrices) : null;
      const originalPrice = originalPrices.length > 0 ? Math.min(...originalPrices) : null;
      const noDorms = body.includes('No Dorms Available') || body.includes('ไม่มีห้องนอนรวม');
      
      return { rating, reviewCount, cheapestDorm, originalPrice, noDorms };
    });
    
    return {
      name: prop.name,
      id: prop.id,
      ...data,
    };
  } catch (err) {
    return { name: prop.name, id: prop.id, error: err.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dateIdx = args.indexOf('--date');
  const dateStr = dateIdx > -1 ? args[dateIdx + 1] : null;
  const jsonOutput = args.includes('--json');
  const saveOutput = args.includes('--save');
  const dates = getCheckDates(dateStr);
  
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // First, get search rankings
  if (!jsonOutput && !saveOutput) {
    console.log('🔍 Checking search rankings...\n');
  }
  const searchRankings = await scrapeSearchRankings(page, dates);
  
  // Create ranking map
  const rankingMap = new Map(searchRankings.map(r => [r.propertyId, r.position]));
  const totalListings = searchRankings.length;
  
  // Then get detailed prices
  if (!jsonOutput && !saveOutput) {
    console.log('💰 Checking property prices...\n');
  }
  
  const results = [];
  for (const prop of ALL_PROPERTIES) {
    const result = await scrapeProperty(page, prop, dates);
    const rank = rankingMap.get(prop.id);
    results.push({ ...result, rank, totalListings });
  }
  
  await browser.close();
  
  // Sort by search rank for display
  const sortedResults = [...results].sort((a, b) => {
    if (!a.rank) return 1;
    if (!b.rank) return -1;
    return a.rank - b.rank;
  });
  
  if (!jsonOutput && !saveOutput) {
    console.log('📊 Ao Nang Search Results (sorted by Hostelworld ranking):\n');
    
    for (const r of sortedResults) {
      const isNomads = NOMADS_PROPERTIES.some(n => n.id === r.id);
      const tag = isNomads ? '🏠' : '🏨';
      const rankStr = r.rank ? `#${r.rank}` : 'Not ranked';
      const price = r.cheapestDorm ? `฿${Math.round(r.cheapestDorm).toLocaleString()}` : (r.noDorms ? 'No dorms' : 'N/A');
      const rating = r.rating ? `${r.rating.score}★` : 'N/A';
      
      // Show discount info if available
      let discountInfo = '';
      if (r.cheapestDorm && r.originalPrice && r.originalPrice > r.cheapestDorm) {
        const pct = Math.round((1 - r.cheapestDorm/r.originalPrice) * 100);
        discountInfo = ` (was ฿${Math.round(r.originalPrice).toLocaleString()}, ${pct}% off)`;
      }
      
      console.log(`${rankStr.padStart(3)} ${tag} ${r.name}`);
      console.log(`    💵 ${price}${discountInfo} | ⭐ ${rating} (${r.reviewCount || '?'} reviews)`);
      console.log('');
    }
    
    if (totalListings) {
      console.log(`📈 Total properties in search: ${totalListings}`);
      
      // Nomads ranking summary
      const nomadsRanks = results
        .filter(r => NOMADS_PROPERTIES.some(n => n.id === r.id) && r.rank)
        .map(r => ({ name: r.name, rank: r.rank }));
      
      if (nomadsRanks.length) {
        console.log('\n🏠 Nomads Ranking Summary:');
        for (const n of nomadsRanks.sort((a, b) => a.rank - b.rank)) {
          console.log(`   ${n.name}: #${n.rank} of ${totalListings}`);
        }
      }
    }
    
    console.log(`\n📅 Date checked: ${dates.from}`);
    
    // Price comparison
    const nomadsPrices = results.filter(r => NOMADS_PROPERTIES.some(n => n.id === r.id) && r.cheapestDorm);
    const compPrices = results.filter(r => COMPETITOR_PROPERTIES.some(c => c.id === r.id) && r.cheapestDorm);
    
    if (nomadsPrices.length && compPrices.length) {
      const avgNomads = nomadsPrices.reduce((s, r) => s + r.cheapestDorm, 0) / nomadsPrices.length;
      const avgComp = compPrices.reduce((s, r) => s + r.cheapestDorm, 0) / compPrices.length;
      const diff = ((avgNomads - avgComp) / avgComp * 100).toFixed(1);
      console.log(`\n💰 Nomads avg: ฿${Math.round(avgNomads).toLocaleString()} | Competitors avg: ฿${Math.round(avgComp).toLocaleString()} | Diff: ${diff > 0 ? '+' : ''}${diff}%`);
    }
  }
  
  const output = {
    date: dates.from,
    timestamp: new Date().toISOString(),
    totalListings,
    rankings: searchRankings,
    results: sortedResults,
  };
  
  if (saveOutput) {
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const filePath = path.join(dataDir, 'hostelworld-prices.jsonl');
    fs.appendFileSync(filePath, JSON.stringify(output) + '\n');
  }
  
  if (jsonOutput) {
    console.log(JSON.stringify(output, null, 2));
  }
}

main().catch(console.error);
