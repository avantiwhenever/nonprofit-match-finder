#!/usr/bin/env node
// Dev tool (not part of the automated pipeline): uses Crawlee's
// PlaywrightCrawler to visit an org's homepage, automatically follow links
// that look like volunteer/careers pages, and report any embedded iframes —
// the same JS-hidden-ATS gotcha scripts/deep-fetch.mjs was built to catch
// (voaww.org/jobs and bgcsc.org/employment/ both looked empty until their
// real listings were found behind an embedded Paycom/ADP widget).
//
// Why this exists alongside scripts/deep-fetch.mjs: that script only
// renders the exact URLs you already know to check. This one, given just an
// org's homepage, discovers and follows likely volunteer/careers links
// itself. deep-fetch.mjs is kept as a fallback — if this proves less
// reliable in practice, switch back to it.
//
// Usage: node scripts/crawlee-fetch.mjs <homepage-url> [homepage-url2] ...
// Requires `crawlee` + `playwright` + a Chromium install, which are NOT
// project dependencies (kept out of package.json to avoid bloating the
// deployed app) — install on demand:
//   npm install --no-save crawlee playwright && npx playwright install chromium
//
// Crawlee itself is free and open-source (MIT license) — no Apify account
// or paid service required to run this.

import { PlaywrightCrawler } from 'crawlee';

const startUrls = process.argv.slice(2);
if (startUrls.length === 0) {
  console.error('Usage: node scripts/crawlee-fetch.mjs <homepage-url> [homepage-url2] ...');
  process.exit(1);
}

const RELEVANT_LINK_PATTERN = /volunteer|careers|jobs|get-involved|employment/i;
const ATS_HINT_PATTERN = /paycomonline|workforcenow\.adp|icims|myworkday|paylocity|bamboohr|jazzhr|greenhouse\.io|lever\.co|betterteam|indeedjobs|ultipro|dayforcehcm|hrmdirect|hireology/i;

const crawler = new PlaywrightCrawler({
  maxRequestsPerCrawl: 15,
  requestHandlerTimeoutSecs: 45,
  async requestHandler({ request, page, enqueueLinks, log }) {
    log.info(`Visiting ${request.url}`);
    await page.waitForTimeout(2000); // let JS-rendered widgets settle

    const frames = page.frames().filter(
      (f) => f.url() && f.url() !== 'about:blank' && f.url() !== request.url
    );
    console.log(`\n${'='.repeat(80)}\n${request.url}\n${'='.repeat(80)}`);
    if (frames.length > 0) {
      console.log(`>>> ${frames.length} iframe(s) found:`);
      for (const f of frames) {
        const flag = ATS_HINT_PATTERN.test(f.url()) ? '  <-- looks like an ATS widget, fetch this directly' : '';
        console.log(`   - ${f.url()}${flag}`);
      }
    } else {
      console.log('>>> No iframes found.');
    }

    const text = await page.locator('body').innerText();
    console.log(`>>> Text preview:\n${text.slice(0, 800)}`);

    // Depth 0 (homepage): follow same-domain volunteer/careers-looking
    // links. Depth 1 (e.g. an org's own /careers page): also follow a link
    // to an external ATS if one is linked out (not just embedded as an
    // iframe) — this is what actually happens on some sites, found via
    // testing against bastyr.edu, where /about/jobs links out to a Paycom
    // page rather than embedding it inline. Cap at depth 2 either way —
    // this is a targeted lookup, not a general-purpose site crawl.
    if (request.userData.depth === 0) {
      await enqueueLinks({
        strategy: 'all',
        transformRequestFunction: (req) => {
          if (!RELEVANT_LINK_PATTERN.test(req.url)) return false;
          req.userData = { depth: 1 };
          return req;
        },
      });
    } else if (request.userData.depth === 1) {
      await enqueueLinks({
        strategy: 'all',
        transformRequestFunction: (req) => {
          if (!ATS_HINT_PATTERN.test(req.url)) return false;
          req.userData = { depth: 2 };
          return req;
        },
      });
    }
  },
  async failedRequestHandler({ request }, error) {
    console.log(`\n>>> FAILED ${request.url}: ${error.message}`);
  },
});

await crawler.run(startUrls.map((url) => ({ url, userData: { depth: 0 } })));
