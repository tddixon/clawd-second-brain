(function() {
  const links = Array.from(document.querySelectorAll('a[href*="hosteldetails.php"]'));
  const seenHostels = new Set();
  const hostels = [];
  const targetHostels = ['Nomads Ao Nang', 'Base Ao Nang Beachfront'];

  links.forEach((link) => {
    const text = (link.textContent || '').trim();
    if (text.includes('FromTHB') && !seenHostels.has(text)) {
      seenHostels.add(text);

      // Parse the hostel name (everything before the rating number)
      const nameMatch = text.match(/^([^\d]+?)\s+(\d+\.\d)/);
      // Parse the rating
      const ratingMatch = text.match(/(\d+\.\d)(Superb|Very Good|Fabulous|Good)/);
      // Parse the price (THB amount)
      const priceMatch = text.match(/FromTHB\s+([\d,]+)/);

      if (nameMatch && priceMatch) {
        const name = nameMatch[1].trim();
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
        // Remove commas from price and convert to number
        const price = parseFloat(priceMatch[1].replace(/,/g, ''));
        const isTarget = targetHostels.some(target => name.includes(target));

        hostels.push({
          rank: hostels.length + 1,
          name: name,
          price: price,
          rating: rating,
          currency: 'THB',
          isTarget: isTarget
        });
      }
    }
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
    top5: hostels.slice(0, 5),
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
    allHostels: hostels.slice(0, 10)
  };

  window.__hostelData = result;
  return result;
})()
