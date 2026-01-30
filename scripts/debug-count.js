(function() {
  const links = Array.from(document.querySelectorAll('a[href*="hosteldetails.php"]'));
  const texts = links.map(a => (a.textContent || '').trim()).filter(t => t.includes('FromTHB'));

  return {
    totalLinks: links.length,
    withFromTHB: texts.length,
    uniqueTexts: new Set(texts).size,
    samples: texts.slice(0, 10)
  };
})()
