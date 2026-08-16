#!/usr/bin/env python3
"""
Reading and writing the announcement archive.

The archive is split across two files so the site stays usable on a mobile
connection. Roughly 62% of all announcements are routine machine postings
(fund NAVs, meeting schedules, trading-status flags). Shipping them in the
initial payload tripled the download for content the default view hides, so
they live in a second file the browser only fetches if the reader asks for it.

  newsData.json     tickers, material announcements, archive metadata
  newsRoutine.json  routine announcements only
"""

import json
from datetime import datetime, timezone
from pathlib import Path

from classify import ROUTINE_CATEGORIES

MATERIAL_FILE = "newsData.json"
ROUTINE_FILE = "newsRoutine.json"

# Bumped when the record shape changes, so a stale cached payload is detectable.
SCHEMA_VERSION = 2


def load_archive(public_dir: Path) -> tuple[list[dict], list[dict]]:
    """Return (tickers, every stored announcement) across both files."""
    with open(public_dir / MATERIAL_FILE, encoding="utf-8") as f:
        material = json.load(f)

    items = list(material["newsList"])

    routine_path = public_dir / ROUTINE_FILE
    if routine_path.exists():
        with open(routine_path, encoding="utf-8") as f:
            items.extend(json.load(f)["newsList"])

    return material["tickersList"], items


def save_archive(public_dir: Path, tickers: list[dict], items: list[dict]) -> dict:
    """Split items by routine flag, write both files, return a summary."""
    ordered = sorted(items, key=lambda item: (item["Date"], item["id"]), reverse=True)

    routine = [i for i in ordered if i.get("Category") in ROUTINE_CATEGORIES]
    material = [i for i in ordered if i.get("Category") not in ROUTINE_CATEGORIES]

    dates = [i["Date"] for i in ordered]
    meta = {
        "schemaVersion": SCHEMA_VERSION,
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "totalCount": len(ordered),
        "materialCount": len(material),
        "routineCount": len(routine),
        "earliestDate": min(dates) if dates else None,
        "latestDate": max(dates) if dates else None,
    }

    _write_json(public_dir / MATERIAL_FILE, {
        "meta": meta,
        "tickersList": tickers,
        "newsList": material,
    })
    _write_json(public_dir / ROUTINE_FILE, {
        "meta": meta,
        "newsList": routine,
    })

    return meta


def _write_json(path: Path, payload: dict) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
