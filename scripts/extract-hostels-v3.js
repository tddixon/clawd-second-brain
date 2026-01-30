(function() {
  const links = Array.from(document.querySelectorAll('a[href*="hosteldetails.php"]'));
  const seenHostels = new Set();
  const hostels = [];
  const targetHostels = ['Nomads Ao Nang', 'Base Ao Nang Beachfront'];

  links.forEach((link) => {
    const text = (link.textContent || '').trim();
    if (text.includes('FromTHB')) {
      // Parse the hostel name from the href if possible
      const href = link.href || '';
      const nameFromHref = href.match(/hosteldetails\.php\/([^/]+)/);
      let name = '';

      // Try to extract name from text (before rating)
      const nameMatch = text.match(/^([^\d]+?)\s+(\d+\.\d)/);
      if (nameMatch) {
        name = nameMatch[1].trim();
      } else if (nameFromHref) {
        name = nameFromHref[1].replace(/-/g, ' ');
      }

      // Parse the rating
      const ratingMatch = text.match(/(\d+\.\d)(Superb|Very Good|Fabulous|Good)/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

      // Parse prices - look for the last "THB" followed by number (the final price after discount)
      const allPrices = text.match(/THB\s+([\d,]+)/g);
      let price = null;
      if (allPrices && allPrices.length > 0) {
        // Get the last price (the final discounted price)
        const lastPrice = allPrices[allPrices.length - 1];
        price = parseFloat(lastPrice.replace(/THB\s+/, '').replace(/,/g, ''));
      }

      if (name && price) {
        // Create a unique key for deduplication
        const uniqueKey = name + '|' + price;
        if (!seenHostels.has(uniqueKey)) {
          seenHostels.add(uniqueKey);

          const isTarget = targetHostels.some(target => name.includes(target));

          hostels.push({
            name: name,
            price: price,
            rating: rating,
            currency: 'THB',
            isTarget: isTarget
          });
        }
      }
    }
  });

  // Keep original order from Hostelworld page (don't sort)
  // Assign ranks based on page order (1 = first on page, 2 = second, etc.)
  hostels.forEach((h, i) => {
    h.rank = i + 1;
  });

  const nomads = hostels.find(h => h.name.includes('Nomads Ao Nang') && !h.name.includes('Base'));
  const base = hostels.find(h => h.name.includes('Base Ao Nang Beachfront'));

  // Calculate price comparison
  const avgPrice = hostels.length > 0 ?
    hostels.reduce((sum, h) => sum + h.price, 0) / hostels.length : 0;
  const minPrice = hostels.length > 0 ? Math.min(...hostels.map(h => h.price)) : 0;
  const maxPrice = hostels.length > 0 ? Math.max(...hostels.map(h => h.price)) : 0;

  const result = {
    timestamp: new Date().toISOString(),
    currency: 'THB',
    totalHostels: hostels.length,
    averagePrice: Math.round(avgPrice),
    minPrice: minPrice,
    maxPrice: maxPrice,
    top5: hostels.slice(0, 5).map(h => ({
      rank: h.rank,
      name: h.name,
      price: h.price,
      rating: h.rating
    })),
    nomads: nomads ? {
      rank: nomads.rank,
      name: nomads.name,
      price: nomads.price,
      rating: nomads.rating,
      vsAverage: Math.round(nomads.price - avgPrice),
      vsMin: Math.round(nomads.price - minPrice),
      vsMax: Math.round(nomads.price - maxPrice)
    } : null,
    base: base ? {
      rank: base.rank,
      name: base.name,
      price: base.price,
      rating: base.rating,
      vsAverage: Math.round(base.price - avgPrice),
      vsMin: Math.round(base.price - minPrice),
      vsMax: Math.round(base.price - maxPrice)
    } : null,
    allHostels: hostels.slice(0, 10).map(h => ({
      rank: h.rank,
      name: h.name,
      price: h.price,
      rating: h.rating
    }))
  };

  window.__hostelData = result;
  return result;
})()
