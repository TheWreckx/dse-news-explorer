import type { NewsItem } from '../types';

/**
 * Full-text search over the announcement archive.
 *
 * The whole archive lives in memory, so this is a linear scan rather than an
 * inverted index — at ~23k records a scan costs a few milliseconds, and an
 * index would need rebuilding every time the routine set is lazy-loaded.
 * Lowercased fields are computed once at load time so keystrokes stay cheap.
 */

export interface SearchEntry {
  item: NewsItem;
  ticker: string;
  title: string;
  text: string;
}

/** Relative weight of a term appearing in each field. */
const TICKER_EXACT_SCORE = 100;
const TITLE_SCORE = 10;
const TEXT_SCORE = 1;

export function buildSearchIndex(items: readonly NewsItem[]): SearchEntry[] {
  return items.map(item => ({
    item,
    ticker: item.Ticker.toLowerCase(),
    title: item.News_Title.toLowerCase(),
    text: item.News_Text.toLowerCase(),
  }));
}

export function parseQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map(term => term.trim())
    .filter(Boolean);
}

/**
 * Score one entry against every search term. Returns 0 when any term is
 * missing — terms are ANDed, so "beximco dividend" excludes announcements
 * matching only one of the two.
 */
function scoreEntry(entry: SearchEntry, terms: readonly string[]): number {
  let total = 0;

  for (const term of terms) {
    let termScore = 0;

    if (entry.ticker === term) termScore += TICKER_EXACT_SCORE;
    else if (entry.ticker.includes(term)) termScore += TICKER_EXACT_SCORE / 2;

    if (entry.title.includes(term)) termScore += TITLE_SCORE;
    if (entry.text.includes(term)) termScore += TEXT_SCORE;

    if (termScore === 0) return 0;
    total += termScore;
  }

  return total;
}

/**
 * Returns matching items ordered by relevance, then newest first. An empty
 * query returns the input untouched so callers can pass results straight
 * through without branching.
 */
export function searchItems(
  index: readonly SearchEntry[],
  query: string,
): NewsItem[] {
  const terms = parseQuery(query);
  if (terms.length === 0) return index.map(entry => entry.item);

  const scored: { item: NewsItem; score: number }[] = [];
  for (const entry of index) {
    const score = scoreEntry(entry, terms);
    if (score > 0) scored.push({ item: entry.item, score });
  }

  return scored
    .sort((a, b) =>
      b.score - a.score || b.item.Date.localeCompare(a.item.Date))
    .map(result => result.item);
}
