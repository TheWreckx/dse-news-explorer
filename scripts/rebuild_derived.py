#!/usr/bin/env python3
"""
Recompute every derived field on the stored archive.

Scraped fields (ticker, date, title, text) are never touched — only the values
this project derives from them: category, routine flag, extracted value, and
content hash. Run this after changing classification rules so historical
records get the same treatment as new ones, instead of the archive carrying
whatever taxonomy happened to be in force the day each item was scraped.

Usage:
  python scripts/rebuild_derived.py            # show what would change
  python scripts/rebuild_derived.py --write    # apply
"""

import sys
from collections import Counter
from pathlib import Path

from classify import classify
from scrape_dse import content_hash, parse_value
from store import load_archive, save_archive


def rebuild(item: dict) -> dict:
    """Return a copy of item with all derived fields recomputed."""
    title = item["News_Title"]
    text = item["News_Text"]
    category, routine = classify(title, text)
    local_value, cr_value = parse_value(text)

    return {
        **item,
        "Category": category,
        "Is_Routine": routine,
        "Announced_Value_Local": local_value,
        "Standardized_Value_Tk_Cr": cr_value,
        # Legacy records predate provenance capture; their fetch time is
        # genuinely unknown and is recorded as such rather than invented.
        "Fetched_At": item.get("Fetched_At"),
        "Content_Hash": content_hash(item["Ticker"], item["Date"], title, text),
    }


def main() -> None:
    write = "--write" in sys.argv
    public_dir = Path(__file__).parent.parent / "public"

    tickers, items = load_archive(public_dir)
    rebuilt = [rebuild(item) for item in items]

    moved = sum(
        1 for before, after in zip(items, rebuilt)
        if before.get("Category") != after["Category"]
    )
    categories = Counter(item["Category"] for item in rebuilt)
    routine_count = sum(1 for item in rebuilt if item["Is_Routine"])

    print(f"Records:            {len(rebuilt):,}")
    print(f"Recategorised:      {moved:,}")
    print(f"Routine / material: {routine_count:,} / {len(rebuilt) - routine_count:,}")
    print("\nCategory distribution:")
    for category, count in categories.most_common():
        print(f"  {category:26} {count:6,}")

    if not write:
        print("\nDry run. Pass --write to apply.")
        return

    meta = save_archive(public_dir, tickers, rebuilt)
    print(f"\nWritten — {meta['materialCount']:,} material, {meta['routineCount']:,} routine")


if __name__ == "__main__":
    main()
