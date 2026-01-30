const hostelLinks = document.querySelectorAll('a[href^="/hosteldetails.php"]');
const hostels = [];
const targetHostels = ['Nomads Ao Nang', 'Base Ao Nang Beachfront'];

hostelLinks.forEach((link, index) => {
  const text = link.textContent || link.innerText;
  if (text.includes('From') && (text.includes('Superb') || text.includes('Very Good') || text.includes('Fabulous') || text.includes('Good'))) {
    const nameMatch = text.match(/([A-Za-z0-9\s&'\-]+)\s+\d+\.\d/);
    const priceMatch = text.match(/From\s+\$([0-9.]+)/);
    const ratingMatch = text.match(/(\d+\.\d)\s+(Superb|Very Good|Fabulous|Good)/);

    if (nameMatch && priceMatch) {
      const name = nameMatch[1].trim();
      const price = parseFloat(priceMatch[1]);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
      const isTarget = targetHostels.some(target => name.includes(target));

      hostels.push({
        rank: hostels.length + 1,
        name: name,
        price: price,
        rating: rating,
        isTarget: isTarget
      });
    }
  }
});

const result = {
  top5: hostels.slice(0, 5),
  nomads: hostels.find(h => h.name.includes('Nomads Ao Nang') && !h.name.includes('Base')),
  base: hostels.find(h => h.name.includes('Base Ao Nang Beachfront')),
  allHostels: hostels.slice(0, 10),
  timestamp: new Date().toISOString()
};

console.log(JSON.stringify(result, null, 2));
