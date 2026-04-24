const https = require('https');
const { JSDOM } = require('jsdom');

// List of Duda sites to test
const dudaSites = [
  'https://www.earthlagoon.is/',
  'https://www.badguysstudios.com/',
  'https://www.wizzyl.com/',
  'https://www.blacklabfilms.com/',
  'https://www.destinationdogtraining.com/',
  'https://www.propercannabis.com/',
  'https://www.chocochalet.ch/',
  'https://www.clinicog.fr/'
];

// Function to fetch HTML content
function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Extract stylesheet URLs from HTML
function extractStylesheetUrls(html) {
  const dom = new JSDOM(html);
  const links = dom.window.document.querySelectorAll('link[rel="stylesheet"]');
  return Array.from(links).map(link => link.href).filter(href => href.includes('cdn-website.com'));
}

// Fetch CSS content
function fetchCss(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Extract colors from CSS
function extractColors(css) {
  const colorRegex = /#([0-9a-fA-F]{3,8})|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/g;
  const matches = css.match(colorRegex) || [];
  return [...new Set(matches)]; // Unique colors
}

// Derive theme from colors (simplified version of deriveTheme)
function deriveTheme(colors) {
  // Simple scoring: prefer blues, greens, etc. for primary
  const scores = {};
  colors.forEach(color => {
    if (!scores[color]) scores[color] = 0;
    // Boost score for common brand colors
    if (color.includes('#00') || color.includes('#0f') || color.includes('blue') || color.includes('green')) {
      scores[color] += 1;
    }
  });
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0]?.[0] || '#000000';
  const secondary = sorted[1]?.[0] || '#ffffff';
  return { primary, secondary, surface: '#ffffff', text: '#000000', muted: '#666666', border: '#cccccc' };
}

// Main test function
async function testSite(url) {
  try {
    console.log(`\nTesting ${url}...`);
    const html = await fetchHtml(url);
    const stylesheetUrls = extractStylesheetUrls(html);
    console.log(`Found ${stylesheetUrls.length} stylesheets`);

    let allCss = '';
    for (const cssUrl of stylesheetUrls.slice(0, 3)) { // Limit to first 3 for speed
      try {
        const css = await fetchCss(cssUrl);
        allCss += css;
      } catch (e) {
        console.log(`Failed to fetch ${cssUrl}`);
      }
    }

    const colors = extractColors(allCss);
    console.log(`Extracted ${colors.length} unique colors`);
    const theme = deriveTheme(colors);
    console.log('Derived theme:', theme);
  } catch (error) {
    console.error(`Error testing ${url}:`, error.message);
  }
}

// Run tests
async function runTests() {
  for (const site of dudaSites) {
    await testSite(site);
  }
}

runTests();