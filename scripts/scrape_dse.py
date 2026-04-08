#!/usr/bin/env python3
"""
DSE News Scraper
Fetches real news from Dhaka Stock Exchange (dsebd.org) and updates newsData.json.

Usage:
  python scripts/scrape_dse.py           # fetch last 7 days
  python scripts/scrape_dse.py --full    # fetch last 180 days (initial sync)
"""

import json
import re
import sys
import time
import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
from pathlib import Path

# ---------------------------------------------------------------------------
# Category taxonomy for keyword classification
# ---------------------------------------------------------------------------
DSE_TAXONOMY = {
    # Checked in order — most specific first to avoid greedy early matches
    "Distress_Bankruptcy": [
        "bankruptcy", "insolvency", "liquidation", "winding up", "cib default",
        "production suspension", "factory closure", "layoff", "auction",
        "going concern", "qualified opinion", "asset seizure",
        "adverse opinion", "disclaimer of opinion", "loan default",
        "classified loan", "appoints administrator", "administrator for the company",
        "financial difficulties", "unable to pay", "non-performing loan",
        "write off", "write-off",
    ],
    "Capital_Structure": [
        "rights issue", "right issue", "right share", "stock split", "reverse split",
        "share buyback", "buy back shares", "par value", "paid-up capital",
        "authorized capital", "dilution", "renunciation", "subscription period",
        "capitalization of reserve", "initial public offering", "ipo proceeds",
        "rpo proceeds", "capital raising proceeds", "subordinated bond",
        "convertible bond", "preference share", "issuance of bond",
        "bond of bdt", "right issue proceeds", "right issue fund",
        "auditor's report regarding", "auditor report regarding",
        "unsecured non-convertible", "irredeemable non-cumulative",
        "mudaraba bond", "mudaraba subordinated", "bsec consent for issuance",
        "bsec's consent for issuance", "bsec consent to issue",
        "bsec's consent to issue", "bsec consent regarding issuance",
        "consent for issuance", "consent to issue",
    ],
    "Regulatory_Legal": [
        "bsec order", "show cause", "fine imposed", "penalty imposed",
        "non-compliance", "trading suspension", "delisting", "category change",
        "trading halt", "writ petition", "litigation", "forensic audit",
        "enforcement action", "legal notice", "court order",
        "bsec declines", "bsec denies", "bsec rejects", "bsec cancelled",
        "bsec cancels", "price limit open", "price limit remove",
        "prohibition on", "suspended from trading",
        "btrc", "regulatory order", "regulatory action",
    ],
    "Asset_Events": [
        "sale of assets", "disposal of property", "lease agreement",
        "asset revaluation", "property sale", "land sale",
        "purchase of land", "purchase of property", "renting out",
        "rental agreement", "land purchase", "building additional",
        "sublease", "sub-lease", "mortgage of property",
        "sale of land", "acquiring land",
    ],
    "Restructuring_Ownership": [
        "merger", "acquisition", "amalgamation", "takeover", "privatization",
        "divestment", "spin-off", "sponsor share", "director purchase",
        "director sale", "pledging of shares", "board reconstitution",
        "management change", "cfo appointment", "company secretary",
        "auditor appointment", "appointment of", "resignation of",
        "managing director", "chief executive", "acting chairman",
        "acting md", "acting ceo", "board of directors",
        "buy confirmation", "sell confirmation", "sale declaration",
        "purchase confirmation", "share transmission",
        "agm date", "egm date", "annual general meeting", "extraordinary general meeting",
        "election of chairman", "election of director", "election of vice",
        "reconstitution of board", "change of director", "new director",
        "change of chairman", "new chairman", "new ceo", "new md",
        "change of auditor", "appointment of auditor",
    ],
    "Operations_Growth": [
        "capacity expansion", "new production line", "commercial operation",
        "export order", "joint venture", "memorandum of understanding",
        "product launch", "machinery purchase", "new machinery",
        "new machine", "new plant", "new equipment",
        "credit rating", "crisl", "surveillance rating", "ecrl", "crab rating",
        "new project", "commissioning", "business expansion",
        "board approval for investment", "board approves investment",
        "board approval for an investment", "board approval to invest",
        "board approval for purchasing", "board approval for acquiring",
        "board decision to import", "board decision to purchase",
        "board approved the proposal", "board approves the proposal",
        "board approves master", "board approval of",
        "bangladesh bank consent for setting up", "bangladesh bank's approval for",
        "bangladesh bank consent for opening", "mfs subsidiary",
        "islamic finance window", "new branch", "spectrum",
        "business agreement", "supply agreement", "manufacturing agreement",
        "mou with", "mou signing", "investment in subsidiary",
    ],
    "Dividends_Earnings": [
        "cash dividend", "stock dividend", "bonus share", "dividend declaration",
        "no dividend", "interim dividend", "final dividend", "record date",
        "earnings per share", "net asset value", "nocfps",
        "financial statements", "quarterly report", "half-yearly", "half yearly",
        "annual report", "annual financials",
        "audited financials", "un-audited", "unaudited",
        "q1 financials", "q2 financials", "q3 financials", "q4 financials",
        "consolidated eps", "eps was tk", "nav was tk", "daily nav",
        "earnings disclosure", "dividend payment",
        "bangladesh bank consent for declaring dividend",
        "applying to bb for permission to declare dividend",
        "profit after tax", "loss after tax", "net profit", "net loss",
        "operating profit", "pre-tax profit",
    ],
}

FAKE_TITLE_PATTERN = re.compile(
    r"announces important updates on", re.IGNORECASE
)
FAKE_TEXT_PATTERN = re.compile(
    r"We are writing to announce that", re.IGNORECASE
)

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Referer": "https://www.dsebd.org/",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def classify_category(title: str, text: str) -> str:
    combined = (title + " " + text).lower()
    for category, keywords in DSE_TAXONOMY.items():
        if any(kw in combined for kw in keywords):
            return category
    return "General"


def parse_value(text: str) -> tuple[str, float]:
    """Extract announced value from news text. Returns (local_str, cr_value)."""
    patterns = [
        (r"Tk\.?\s*([\d,]+(?:\.\d+)?)\s*(?:crore|cr)", 1.0),
        (r"BDT\s*([\d,]+(?:\.\d+)?)\s*(?:crore|cr)", 1.0),
        (r"Tk\.?\s*([\d,]+(?:\.\d+)?)\s*(?:lakh|lac)", 0.01),
    ]
    for pattern, multiplier in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            raw = match.group(1).replace(",", "")
            try:
                value = float(raw) * multiplier
                return match.group(0), round(value, 2)
            except ValueError:
                pass
    return "", 0.0


def normalize_date(date_str: str) -> str | None:
    for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def parse_news_table(html: str, default_ticker: str | None = None) -> list[dict]:
    """
    DSE news pages use a 6-row-per-item format:
      <tr><th>Trading Code:</th><td>TICKER</td></tr>
      <tr><th>News Title:</th><td>TITLE</td></tr>
      <tr><th>News:</th>       <td>TEXT</td></tr>
      <tr><th>Post Date:</th>  <td>DATE</td></tr>
      <tr><th colspan=2><hr></th></tr>
      <tr><th colspan=2>&nbsp;</th></tr>
    """
    soup = BeautifulSoup(html, "html.parser")
    items = []

    table = soup.find("table", class_="table-news") or soup.find("table")
    if not table:
        return []

    current: dict[str, str] = {}
    for row in table.find_all("tr"):
        th = row.find("th")
        td = row.find("td")
        if not th or not td:
            # separator / spacer row — flush current item
            if current.get("ticker") and current.get("title"):
                date = normalize_date(current.get("date", ""))
                if date:
                    title = current["title"]
                    text = current.get("text", "")
                    if not (FAKE_TITLE_PATTERN.search(title) or FAKE_TEXT_PATTERN.search(text)):
                        items.append({
                            "ticker": current["ticker"].strip().upper(),
                            "title": title,
                            "text": text,
                            "date": date,
                        })
                current = {}
            continue

        label = th.get_text(strip=True).rstrip(":")
        value = td.get_text(strip=True)

        if "Trading Code" in label:
            current["ticker"] = value or default_ticker or ""
        elif "News Title" in label:
            current["title"] = value
        elif label == "News":
            current["text"] = value
        elif "Post Date" in label:
            current["date"] = value

    # flush last item if file ends without a separator
    if current.get("ticker") and current.get("title"):
        date = normalize_date(current.get("date", ""))
        if date:
            title = current["title"]
            text = current.get("text", "")
            if not (FAKE_TITLE_PATTERN.search(title) or FAKE_TEXT_PATTERN.search(text)):
                items.append({
                    "ticker": current["ticker"].strip().upper(),
                    "title": title,
                    "text": text,
                    "date": date,
                })

    return items


# ---------------------------------------------------------------------------
# Fetchers
# ---------------------------------------------------------------------------

def fetch_by_date_range(start_date: str, end_date: str) -> list[dict]:
    """Try the AJAX date-range endpoint (no ticker filter)."""
    url = "https://www.dsebd.org/ajax/load-news.php"
    data = {
        "criteria": "4",
        "startDate": start_date,
        "endDate": end_date,
    }
    try:
        resp = requests.post(url, data=data, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        items = parse_news_table(resp.text)
        if items:
            print(f"  Date-range fetch returned {len(items)} items")
            return items
    except Exception as exc:
        print(f"  Date-range AJAX failed: {exc}")

    # Fallback: GET request with query params
    get_url = (
        f"https://www.dsebd.org/old_news.php"
        f"?criteria=4&startDate={start_date}&endDate={end_date}&archive=news"
    )
    try:
        resp = requests.get(get_url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        items = parse_news_table(resp.text)
        print(f"  GET date-range fetch returned {len(items)} items")
        return items
    except Exception as exc:
        print(f"  GET date-range fetch also failed: {exc}")
        return []


def fetch_by_ticker(ticker: str) -> list[dict]:
    url = (
        f"https://www.dsebd.org/old_news.php"
        f"?inst={ticker}&criteria=3&archive=news"
    )
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        return parse_news_table(resp.text, default_ticker=ticker)
    except Exception as exc:
        print(f"  [{ticker}] fetch failed: {exc}")
        return []


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    full_sync = "--full" in sys.argv

    data_path = Path(__file__).parent.parent / "public" / "newsData.json"
    with open(data_path, encoding="utf-8") as f:
        data = json.load(f)

    tickers_list: list[dict] = data["tickersList"]
    existing: list[dict] = data["newsList"]

    # Drop any fake/template items from existing data
    real_existing = [
        item for item in existing
        if not (
            FAKE_TITLE_PATTERN.search(item.get("News_Title", ""))
            or FAKE_TEXT_PATTERN.search(item.get("News_Text", ""))
        )
    ]
    dropped = len(existing) - len(real_existing)
    if dropped:
        print(f"Dropped {dropped} fabricated items from existing data")

    industry_lookup = {t["ticker"]: t["industry"] for t in tickers_list}

    # Build dedup key set
    existing_keys: set[tuple] = {
        (item["Ticker"], item["Date"], item["News_Title"][:60])
        for item in real_existing
    }

    # Date window
    days_back = 730 if full_sync else 7
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")

    print(f"Fetching news: {start_date} → {end_date} ({'full sync' if full_sync else 'incremental'})")

    # Try efficient date-range fetch first
    raw_items = fetch_by_date_range(start_date, end_date)

    # Fallback to per-ticker if the date-range endpoint returns nothing
    if not raw_items:
        print("Falling back to per-ticker fetch…")
        tickers = list(industry_lookup.keys())
        for i, ticker in enumerate(tickers, 1):
            print(f"  [{i}/{len(tickers)}] {ticker}")
            raw_items.extend(fetch_by_ticker(ticker))
            time.sleep(0.4)

    # Build new items
    new_items: list[dict] = []
    max_id = max((item["id"] for item in real_existing), default=0)

    for raw in raw_items:
        # Only include listed tickers
        if raw["ticker"] not in industry_lookup:
            continue

        key = (raw["ticker"], raw["date"], raw["title"][:60])
        if key in existing_keys:
            continue

        local_val, cr_val = parse_value(raw["text"])
        max_id += 1

        new_items.append({
            "id": max_id,
            "Date": raw["date"],
            "Ticker": raw["ticker"],
            "Industry": industry_lookup[raw["ticker"]],
            "Category": classify_category(raw["title"], raw["text"]),
            "Announced_Value_Local": local_val,
            "Standardized_Value_Tk_Cr": cr_val,
            "News_Title": raw["title"],
            "News_Text": raw["text"],
            "Source_URL": (
                f"https://www.dsebd.org/old_news.php"
                f"?inst={raw['ticker']}&criteria=3&archive=news"
            ),
        })
        existing_keys.add(key)

    print(f"New items: {len(new_items)}")

    data["newsList"] = new_items + real_existing

    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

    print(f"Done — {len(data['newsList'])} total items in newsData.json")


if __name__ == "__main__":
    main()
