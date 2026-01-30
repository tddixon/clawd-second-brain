(function() {
  const links = Array.from(document.querySelectorAll('a'));
  const hostelLinks = links.filter(a => a.href && a.href.includes('hosteldetails.php'));
  
  const sample = hostelLinks.slice(0, 5).map(a => ({
    href: a.href,
    text: a.textContent.substring(0, 200),
    innerHTML: a.innerHTML.substring(0, 300)
  }));
  
  return {
    totalLinks: links.length,
    hostelLinksCount: hostelLinks.length,
    samples: sample
  };
})()
