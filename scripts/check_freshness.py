#!/usr/bin/env python3
"""
Fail the workflow if the archive has stopped advancing.

The scraper already fails when DSE returns nothing at all. This catches the
quieter failure: DSE responds, parsing succeeds, but nothing new has landed for
days because the page structure changed or a filter silently drops everything.
Without this the pipeline reports success while the site slowly goes stale —
which is exactly how two months of data went missing before anyone noticed.

Exit code 1 marks the run failed, which makes GitHub email the repository owner.
"""

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

# DSE does not publish on Fridays, Saturdays or public holidays, and Bangladesh
# has stretches of consecutive holidays. This tolerates a normal quiet run
# without tolerating a broken one.
MAX_QUIET_DAYS = 6


def main() -> None:
    data_path = Path(__file__).parent.parent / "public" / "newsData.json"
    with open(data_path, encoding="utf-8") as f:
        meta = json.load(f).get("meta", {})

    latest = meta.get("latestDate")
    if not latest:
        print("ERROR: archive metadata has no latestDate — the writer is broken.")
        sys.exit(1)

    age_days = (datetime.now(timezone.utc).date() - datetime.strptime(latest, "%Y-%m-%d").date()).days

    print(f"Newest announcement: {latest} ({age_days} days old)")
    print(f"Archive holds {meta.get('totalCount', 0):,} records "
          f"({meta.get('materialCount', 0):,} material, {meta.get('routineCount', 0):,} routine)")

    if age_days > MAX_QUIET_DAYS:
        print(
            f"ERROR: no new announcement in {age_days} days (limit {MAX_QUIET_DAYS}). "
            "DSE's page structure may have changed."
        )
        print("Check https://www.dsebd.org/news_archive.php manually.")
        sys.exit(1)

    print("Freshness OK")


if __name__ == "__main__":
    main()
