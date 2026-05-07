/**
 * Parse Open Cookie Database CSV → JSON
 * Source: https://github.com/jkwakman/Open-Cookie-Database
 * 
 * Run: node scripts/parse-cookie-database.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CSV_URL = 'https://raw.githubusercontent.com/jkwakman/Open-Cookie-Database/master/open-cookie-database.csv';
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'cookies-management', 'cookie-database.json');

function downloadCSV() {
  return new Promise((resolve, reject) => {
    https.get(CSV_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// Category mapping: Open Cookie DB categories → our internal categories
const CATEGORY_MAP = {
  'Analytics': 'ANALYTICS',
  'Marketing': 'ADVERTISING',
  'Functional': 'FUNCTIONAL',
  'Security': 'NECESSARY',
  'Necessary': 'NECESSARY',
};

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  console.log('📥 Downloading Open Cookie Database...');
  const csv = await downloadCSV();
  
  const lines = csv.split('\n').filter(l => l.trim().length > 0);
  console.log(`📊 Found ${lines.length - 1} entries in CSV`);
  
  // Skip header: ID,Platform,Category,Cookie / Data Key name,Domain,Description,Retention period,Data Controller,User Privacy & GDPR Rights Portals,Wildcard match
  const entries = [];
  const seen = new Set();

  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    if (fields.length < 10) continue;

    const [id, platform, category, cookieName, domain, description, retention, dataController, privacyUrl, wildcardMatch] = fields;

    if (!cookieName || cookieName.trim().length === 0) continue;

    const name = cookieName.trim();
    const key = `${name}__${(domain || '').trim()}`.toLowerCase();
    
    // Deduplicate
    if (seen.has(key)) continue;
    seen.add(key);

    const mappedCategory = CATEGORY_MAP[category] || 'UNCATEGORIZED';

    entries.push({
      name,
      platform: platform || 'Unknown',
      category: mappedCategory,
      originalCategory: category || 'Unknown',
      domain: domain || '',
      description: description || `Cookie set by ${platform || 'Unknown'}`,
      retention: retention || 'Unknown',
      dataController: dataController || 'Unknown',
      wildcard: wildcardMatch === '1',
    });
  }

  // Sort: exact matches first, then wildcards
  entries.sort((a, b) => {
    if (a.wildcard && !b.wildcard) return 1;
    if (!a.wildcard && b.wildcard) return -1;
    return a.name.localeCompare(b.name);
  });

  // Build optimized lookup structures
  const exactMatch = {};
  const wildcardPatterns = [];
  const domainPatterns = {};

  for (const entry of entries) {
    const info = {
      name: entry.name,
      platform: entry.platform,
      category: entry.category,
      description: entry.description,
      retention: entry.retention,
      dataController: entry.dataController,
      domain: entry.domain,
    };

    if (entry.wildcard) {
      wildcardPatterns.push(info);
    } else {
      exactMatch[entry.name] = info;
    }

    // Build domain patterns for Tier 3 classification
    if (entry.domain && entry.domain.includes('.')) {
      const cleanDomain = entry.domain
        .replace(/\(3rd party\)/i, '')
        .replace(/\s+or\s+/g, ',')
        .trim();
      
      const domains = cleanDomain.split(',').map(d => d.trim()).filter(Boolean);
      for (const d of domains) {
        if (!domainPatterns[d]) {
          domainPatterns[d] = entry.category;
        }
      }
    }
  }

  const database = {
    version: new Date().toISOString().split('T')[0],
    totalEntries: entries.length,
    exactMatchCount: Object.keys(exactMatch).length,
    wildcardCount: wildcardPatterns.length,
    domainPatternsCount: Object.keys(domainPatterns).length,
    exactMatch,
    wildcardPatterns,
    domainPatterns,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(database, null, 2), 'utf-8');
  
  console.log(`\n✅ Cookie Database generated successfully!`);
  console.log(`   📁 Output: ${OUTPUT_PATH}`);
  console.log(`   📊 Total entries: ${entries.length}`);
  console.log(`   🎯 Exact matches: ${Object.keys(exactMatch).length}`);
  console.log(`   🔄 Wildcard patterns: ${wildcardPatterns.length}`);
  console.log(`   🌐 Domain patterns: ${Object.keys(domainPatterns).length}`);
  
  // Print category distribution
  const catDist = {};
  entries.forEach(e => {
    catDist[e.category] = (catDist[e.category] || 0) + 1;
  });
  console.log(`\n   📈 Category distribution:`);
  Object.entries(catDist).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`      ${cat}: ${count}`);
  });
}

main().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
