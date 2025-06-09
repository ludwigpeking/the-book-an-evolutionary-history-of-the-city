// Performance test script for TOC generation
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);

// Test 1: Current synchronous approach
function currentSyncApproach() {
  console.time('sync-approach');
  const chaptersDir = path.join(__dirname, 'chapters');
  const files = fs.readdirSync(chaptersDir)
    .filter(file => /^\d+\.html$/.test(file))
    .sort((a, b) => parseInt(a) - parseInt(b));

  const chapters = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(chaptersDir, file), 'utf8');
    const match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (match && match[1]) {
      chapters.push({
        number: parseInt(file),
        title: match[1].replace(/<\/?[^>]+(>|$)/g, '').trim(),
        id: `chapter-${parseInt(file)}`
      });
    }
  }
  console.timeEnd('sync-approach');
  return chapters.length;
}

// Test 2: Parallel async approach with Promise.all
async function parallelAsyncApproach() {
  console.time('parallel-async');
  const chaptersDir = path.join(__dirname, 'chapters');
  const files = fs.readdirSync(chaptersDir)
    .filter(file => /^\d+\.html$/.test(file))
    .sort((a, b) => parseInt(a) - parseInt(b));

  const chapters = await Promise.all(
    files.map(async file => {
      const content = await readFileAsync(path.join(chaptersDir, file), 'utf8');
      const match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
      if (match && match[1]) {
        return {
          number: parseInt(file),
          title: match[1].replace(/<\/?[^>]+(>|$)/g, '').trim(),
          id: `chapter-${parseInt(file)}`
        };
      }
    })
  );
  console.timeEnd('parallel-async');
  return chapters.filter(Boolean).length;
}

// Test 3: Cached approach
const titleCache = new Map();
async function cachedAsyncApproach() {
  console.time('cached-async');
  const chaptersDir = path.join(__dirname, 'chapters');
  const files = fs.readdirSync(chaptersDir)
    .filter(file => /^\d+\.html$/.test(file))
    .sort((a, b) => parseInt(a) - parseInt(b));

  const chapters = await Promise.all(
    files.map(async file => {
      if (titleCache.has(file)) {
        return titleCache.get(file);
      }

      const content = await readFileAsync(path.join(chaptersDir, file), 'utf8');
      const match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
      if (match && match[1]) {
        const chapter = {
          number: parseInt(file),
          title: match[1].replace(/<\/?[^>]+(>|$)/g, '').trim(),
          id: `chapter-${parseInt(file)}`
        };
        titleCache.set(file, chapter);
        return chapter;
      }
    })
  );
  console.timeEnd('cached-async');
  return chapters.filter(Boolean).length;
}

// Run all tests
async function runTests() {
  console.log('Running performance tests...\n');
  
  // Test 1: Current sync approach
  console.log('Test 1: Current synchronous approach');
  const syncCount = currentSyncApproach();
  console.log(`Processed ${syncCount} chapters\n`);

  // Test 2: Parallel async approach
  console.log('Test 2: Parallel async approach');
  const asyncCount = await parallelAsyncApproach();
  console.log(`Processed ${asyncCount} chapters\n`);

  // Test 3: Cached async approach
  console.log('Test 3: First run with empty cache');
  const firstCacheCount = await cachedAsyncApproach();
  console.log(`Processed ${firstCacheCount} chapters`);
  
  console.log('\nTest 3: Second run with filled cache');
  const secondCacheCount = await cachedAsyncApproach();
  console.log(`Processed ${secondCacheCount} chapters`);
}

// Run the tests
runTests().catch(console.error);
