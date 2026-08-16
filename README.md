# DSE News Explorer

A searchable, permanent archive of official company announcements from the
**Dhaka Stock Exchange**.

**Live site:** https://thewreckx.github.io/dse-news-explorer/

DSE publishes every listed company's announcements — dividends, financial
results, regulatory actions, ownership changes — and then removes them from its
own website after about two years. This project captures them daily and keeps
them, so the record survives past DSE's retention window.

Currently holding **22,000+ announcements** across **400+ listed companies**,
going back further than DSE's own archive now serves.

---

## What it does

- **Full-text search** across every announcement, ranked by relevance
- **Filters** by company, industry, subject and date range
- **Shareable URLs** — every filtered view has its own link
- **Excel export** of any result set, including capture timestamps and hashes
- **Static company pages** at `/company/<TICKER>/` so announcements are
  findable through search engines
- **Freshness indicator** that turns amber if the pipeline stalls

### Routine vs material announcements

About **62% of DSE's feed is mechanical**: funds posting daily NAV, boards
announcing meeting dates, trading-status flags around record dates. These are
kept, but hidden by default — otherwise a dividend declaration is buried under
thousands of NAV postings. Turn them on with *Include routine notices*.

| Group | Categories |
| --- | --- |
| Material | Dividends & Earnings, Regulatory & Legal, Restructuring & Ownership, Operations & Growth, Distress & Bankruptcy, Capital Structure, Asset Events, General |
| Routine | Fund NAV, Meeting Schedule, Trading Status |

---

## How it works

```
GitHub Actions (daily, 06:05 Dhaka)
  └─ scripts/scrape_dse.py     fetch new announcements from dsebd.org
     ├─ scripts/classify.py    categorise, flag routine postings
     └─ scripts/store.py       write the split JSON payload
  └─ scripts/check_freshness.py   fail loudly if the archive stopped advancing
  └─ commit → push → Pages deploy
```

The site is a static React SPA on GitHub Pages. There is no server and no
database; the archive ships as JSON.

| File | Contents |
| --- | --- |
| `public/newsData.json` | Tickers, material announcements, archive metadata |
| `public/newsRoutine.json` | Routine announcements, fetched only on request |
| `public/lastChecked.json` | Timestamp of the last successful scrape |

Splitting the payload keeps the initial load near half its former size, which
matters on mobile data.

### Provenance

Every record carries `Content_Hash` (a fingerprint of the announcement as
published) and `Fetched_At` (when this project captured it). Because this
archive outlives DSE's own copy, those fields let anyone verify a stored record
has not been altered. Records captured before provenance tracking have a null
`Fetched_At` rather than an invented one.

---

## Running locally

```bash
npm install
npm run dev                       # http://localhost:5173/dse-news-explorer/
```

```bash
pip install -r scripts/requirements.txt

python scripts/scrape_dse.py                # catch up from the newest stored item
python scripts/scrape_dse.py --full         # re-scan DSE's whole 2-year archive
python scripts/rebuild_derived.py           # preview reclassification
python scripts/rebuild_derived.py --write   # apply it to every stored record
python scripts/check_freshness.py           # verify the archive is advancing
```

`npm run build` compiles the app and prerenders the company pages, sitemap and
robots.txt into `dist/`.

### After changing classification rules

Rules live in `scripts/classify.py`. Historical records are **not** reclassified
automatically — run `rebuild_derived.py --write` so the whole archive reflects
the current rules instead of whichever taxonomy was in force the day each record
was scraped.

---

## Notes for maintainers

**dsebd.org serves an incomplete TLS certificate chain.** It omits the Sectigo
intermediate, so `requests` fails with `CERTIFICATE_VERIFY_FAILED` where a
browser succeeds. `scrape_dse.py` fetches the missing intermediate from the URL
the leaf certificate advertises and appends it to the trusted bundle —
verification stays fully enabled. Do not "fix" this with `verify=False`.

**Never run `--trim` casually.** DSE deletes its own archive after two years, so
trimming destroys records that cannot be re-fetched from anywhere.

**Scheduled workflows get disabled after 60 days of repository inactivity.**
The daily job writes `lastChecked.json` even when nothing new is published, so
a quiet stretch still produces a commit and the schedule stays alive.

---

## Data source and licence

Announcements are reproduced from [dsebd.org](https://www.dsebd.org/), the
official DSE website, for reference and research. DSE is the authoritative
source — verify anything material against it before acting on it.

Built by Syed Tareq Aziz Hoque.
