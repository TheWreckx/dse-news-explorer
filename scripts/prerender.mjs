/**
 * Generates static, indexable pages after the Vite build.
 *
 * The app is a client-rendered SPA holding its entire dataset in one JSON
 * payload, which means search engines see an empty <div id="root"> and none of
 * the 22,000 announcements. That is the worst possible position for an archive
 * whose whole value is being the lasting public record: the content exists
 * nowhere else once DSE drops it, and nobody can find it.
 *
 * So for each listed company we emit a real HTML page containing that
 * company's announcement history as text, linking into the app for the
 * interactive view. These are not doorway pages — the announcements are the
 * content.
 *
 * Run automatically by `npm run build`.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const BASE = '/dse-news-explorer';
const SITE = `https://thewreckx.github.io${BASE}`;

/** Announcements shown on each company page. Enough to be genuinely useful. */
const MAX_ITEMS_PER_PAGE = 300;

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const readableCategory = (category) => category.replace(/_/g, ' ');

function layout({ title, description, canonical, heading, intro, body, jsonLd }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonical}">
<link rel="icon" type="image/svg+xml" href="${BASE}/favicon.svg">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${canonical}">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
<style>
:root{color-scheme:dark;--bg:#0b0f1a;--panel:#141a2b;--border:#232c44;--text:#e6ebf5;--muted:#8b93a7;--accent:#4da3ff}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:860px;margin:0 auto;padding:2.5rem 1.25rem 4rem}
a{color:var(--accent)}
h1{font-size:clamp(1.6rem,1.2rem+2vw,2.4rem);margin:0 0 .5rem;line-height:1.2}
.intro{color:var(--muted);margin:0 0 1.5rem}
.cta{display:inline-block;background:var(--accent);color:#08111f;font-weight:600;padding:.6rem 1.1rem;border-radius:8px;text-decoration:none;margin-bottom:2rem}
article{border-top:1px solid var(--border);padding:1.25rem 0}
article h2{font-size:1.05rem;margin:0 0 .35rem}
.meta{color:var(--muted);font-size:.82rem;display:flex;gap:.75rem;flex-wrap:wrap;margin-bottom:.5rem}
.tag{background:var(--panel);border:1px solid var(--border);border-radius:99px;padding:.1rem .6rem}
p.body{margin:0;color:#c3cbdb;font-size:.94rem}
nav.links{display:flex;flex-wrap:wrap;gap:.5rem;margin:1.5rem 0}
nav.links a{background:var(--panel);border:1px solid var(--border);padding:.3rem .7rem;border-radius:6px;text-decoration:none;font-size:.85rem}
footer{border-top:1px solid var(--border);margin-top:2.5rem;padding-top:1.25rem;color:var(--muted);font-size:.85rem}
</style>
</head>
<body>
<div class="wrap">
<h1>${escapeHtml(heading)}</h1>
<p class="intro">${escapeHtml(intro)}</p>
${body}
<footer>
<p>Announcements are reproduced from <a href="https://www.dsebd.org/">dsebd.org</a>, the official Dhaka Stock Exchange website. DSE removes announcements from its own archive after two years; this project keeps them.</p>
<p><a href="${BASE}/">DSE News Explorer</a> · <a href="${BASE}/companies.html">All companies</a></p>
</footer>
</div>
</body>
</html>`;
}

function renderItems(items) {
  return items
    .map(
      (item) => `<article>
<div class="meta"><time datetime="${item.Date}">${item.Date}</time><span class="tag">${escapeHtml(readableCategory(item.Category))}</span><span>${escapeHtml(item.Ticker)}</span></div>
<h2>${escapeHtml(item.News_Title)}</h2>
<p class="body">${escapeHtml(item.News_Text)}</p>
</article>`,
    )
    .join('\n');
}

function buildTickerPage(ticker, industry, items) {
  const shown = items.slice(0, MAX_ITEMS_PER_PAGE);
  const latest = items[0];
  const canonical = `${SITE}/company/${ticker}/`;

  const description = latest
    ? `${items.length} official DSE announcements for ${ticker} (${industry}). Most recent: ${latest.News_Title} on ${latest.Date}.`
    : `Official Dhaka Stock Exchange announcements for ${ticker}.`;

  const body = `
<a class="cta" href="${BASE}/?tickers=${encodeURIComponent(ticker)}">Search ${escapeHtml(ticker)} in the full explorer →</a>
${renderItems(shown)}
${items.length > shown.length ? `<p class="intro">Showing the ${shown.length} most recent of ${items.length} announcements. <a href="${BASE}/?tickers=${encodeURIComponent(ticker)}">See all in the explorer</a>.</p>` : ''}`;

  return layout({
    title: `${ticker} Announcements — DSE News Explorer`,
    description,
    canonical,
    heading: `${ticker} — Dhaka Stock Exchange announcements`,
    intro: `${items.length} announcements from ${industry}. Covering ${items[items.length - 1]?.Date ?? ''} to ${latest?.Date ?? ''}.`,
    body,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: `${ticker} announcements`,
      description,
      url: canonical,
      isPartOf: { '@type': 'WebSite', name: 'DSE News Explorer', url: `${SITE}/` },
    },
  });
}

function buildIndexPage(groups) {
  const sorted = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  const links = sorted
    .map(([ticker, items]) =>
      `<a href="${BASE}/company/${ticker}/">${escapeHtml(ticker)} <span style="color:var(--muted)">(${items.length})</span></a>`)
    .join('\n');

  return layout({
    title: 'All Companies — DSE News Explorer',
    description: `Announcement archives for ${sorted.length} companies listed on the Dhaka Stock Exchange.`,
    canonical: `${SITE}/companies.html`,
    heading: 'All listed companies',
    intro: `Announcement archives for ${sorted.length} companies on the Dhaka Stock Exchange.`,
    body: `<nav class="links">${links}</nav>`,
  });
}

function buildSitemap(tickers, latestDate) {
  const urls = [
    `${SITE}/`,
    `${SITE}/companies.html`,
    ...tickers.map((ticker) => `${SITE}/company/${ticker}/`),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc><lastmod>${latestDate}</lastmod></url>`).join('\n')}
</urlset>`;
}

function main() {
  const archive = JSON.parse(readFileSync(join(ROOT, 'public', 'newsData.json'), 'utf-8'));
  const industries = new Map(archive.tickersList.map((t) => [t.ticker, t.industry]));

  // Newest first, matching how the app presents them.
  const items = [...archive.newsList].sort((a, b) => b.Date.localeCompare(a.Date));

  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.Ticker)) groups.set(item.Ticker, []);
    groups.get(item.Ticker).push(item);
  }

  for (const [ticker, tickerItems] of groups) {
    const dir = join(DIST, 'company', ticker);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, 'index.html'),
      buildTickerPage(ticker, industries.get(ticker) ?? 'Listed company', tickerItems),
    );
  }

  writeFileSync(join(DIST, 'companies.html'), buildIndexPage(groups));

  const latestDate = archive.meta?.latestDate ?? items[0]?.Date ?? '';
  writeFileSync(join(DIST, 'sitemap.xml'), buildSitemap([...groups.keys()].sort(), latestDate));
  writeFileSync(
    join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`,
  );

  console.log(
    `Prerendered ${groups.size} company pages, companies.html, sitemap.xml, robots.txt`,
  );
}

main();
