/**
 * Tells search engines the archive changed, via IndexNow.
 *
 * A sitemap only helps once a crawler decides to come back. IndexNow pushes
 * the other way: one request notifies Bing, Yandex and other participating
 * engines that specific URLs are new or updated. It needs no account and no
 * API key beyond a token file served from the site itself, which is the only
 * kind of search integration that can be automated here.
 *
 * Google does not participate — it needs Search Console, which requires the
 * owner to sign in once. See README.
 *
 * Ownership is proved by serving the key at:
 *   https://thewreckx.github.io/dse-news-explorer/<KEY>.txt
 *
 * Run after a successful deploy. Failure is never fatal: a missed ping just
 * means engines fall back to the sitemap.
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HOST = 'thewreckx.github.io';
const BASE = `https://${HOST}/dse-news-explorer`;
const KEY = '06e9dcfc44d121a87abb88fa3aa30b28';

const ENDPOINT = 'https://api.indexnow.org/IndexNow';

function collectUrls() {
  const archive = JSON.parse(readFileSync(join(ROOT, 'public', 'newsData.json'), 'utf-8'));
  const tickers = [...new Set(archive.newsList.map((item) => item.Ticker))].sort();

  return [
    `${BASE}/`,
    `${BASE}/companies.html`,
    ...tickers.map((ticker) => `${BASE}/company/${ticker}/`),
  ];
}

/**
 * IndexNow proves ownership by reading the key from the root of the host, not
 * from a subdirectory. A GitHub Pages *project* site lives under a path, and
 * the host root belongs to a different repository — so on the default
 * github.io URL this can never validate, and submissions return 403.
 *
 * Rather than pinging a rejecting endpoint on every deploy, check first. This
 * starts working on its own the moment the site gets a custom domain, or a
 * <user>.github.io repository serves the key at its root.
 */
async function keyIsReachableAtHostRoot() {
  try {
    const response = await fetch(`https://${HOST}/${KEY}.txt`);
    if (!response.ok) return false;
    return (await response.text()).trim() === KEY;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await keyIsReachableAtHostRoot())) {
    console.log(
      `IndexNow skipped: the key must be served at https://${HOST}/${KEY}.txt ` +
      `but that path is not this site. This activates once the archive has its ` +
      `own domain. Search engines still have sitemap.xml and robots.txt.`,
    );
    return;
  }

  const urlList = collectUrls();

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: `${BASE}/${KEY}.txt`,
      urlList,
    }),
  });

  // 200 accepted, 202 accepted pending key validation. Anything else is
  // reported but must not fail the deploy.
  console.log(`IndexNow: submitted ${urlList.length} URLs, HTTP ${response.status}`);
  if (![200, 202].includes(response.status)) {
    console.log(`Response body: ${(await response.text()).slice(0, 300)}`);
  }
}

main().catch((error) => {
  console.log(`IndexNow submission skipped: ${error.message}`);
});
