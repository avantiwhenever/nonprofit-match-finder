#!/usr/bin/env node
// Dev tool (not part of the automated pipeline): renders a page with a real
// browser and reports every embedded iframe it finds.
//
// Why this exists: a plain HTML fetch missed real job listings on both
// voaww.org/jobs and bgcsc.org/employment/ — both pages looked empty
// ("no positions currently listed") because their actual listings load via
// JavaScript into an embedded ATS widget (Paycom, ADP, etc.) that a static
// fetch never executes. This tool renders the page for real and prints any
// iframe URLs found, so that widget gets caught instead of silently missed.
//
// Usage: node scripts/deep-fetch.mjs <url> [url2] ...
// Requires `playwright` + a Chromium install, which are NOT project
// dependencies (kept out of package.json to avoid bloating the deployed
// app) — install on demand: npm install --no-save playwright && npx
// playwright install chromium
//
// Workflow when adding a new org to scripts/curated-orgs.json: run this
// against its volunteer/careers page first. If it reports an iframe (an ATS
// domain like paycomonline.net, workforcenow.adp.com, icims.com, myworkday
// etc.), deep-fetch that iframe URL too — that's where the real listings
// are, not the page you started on.
import { chromium } from 'playwright';

const urls = process.argv.slice(2);
if (urls.length === 0) {
  console.error('Usage: node scripts/deep-fetch.mjs <url> [url2] ...');
  process.exit(1);
}

const browser = await chromium.launch();

for (const url of urls) {
  console.log(`\n${'='.repeat(80)}\nFETCHING: ${url}\n${'='.repeat(80)}`);
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(3000);

    const frames = page.frames().filter((f) => f.url() && f.url() !== 'about:blank' && f.url() !== url);
    if (frames.length > 0) {
      console.log(`\n>>> ${frames.length} embedded iframe(s) found (check these for hidden ATS/widget content):`);
      for (const f of frames) console.log('   -', f.url());
    } else {
      console.log('\n>>> No embedded iframes found — page content is likely fully server-rendered/static.');
    }

    const text = await page.locator('body').innerText();
    console.log(`\n>>> Visible page text (first 3000 chars):\n${text.slice(0, 3000)}`);
  } catch (err) {
    console.log(`\n>>> ERROR: ${err.message}`);
  } finally {
    await page.close();
  }
}

await browser.close();
