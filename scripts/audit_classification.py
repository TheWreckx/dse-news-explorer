#!/usr/bin/env python3
"""
Measure classification accuracy against hand-assigned labels.

The classifier decides what appears in the default feed and what is hidden as
routine, so "it looked fine when I skimmed it" is not a good enough standard —
that standard is what allowed indefinite trading suspensions to sit hidden.
This draws a fixed, reproducible sample, and scores the rules against labels a
human wrote down.

  python scripts/audit_classification.py --sample   # write the blank sample
  python scripts/audit_classification.py            # score it

The sample is deterministic: the same records are drawn every run, so a score
can be compared across rule changes. Labels live in audit_labels.json and are
committed, so anyone can check the grader's judgement rather than trusting the
headline number.
"""

import json
import random
import sys
from collections import Counter, defaultdict
from pathlib import Path

from classify import ROUTINE_CATEGORIES, classify
from store import load_archive

SAMPLE_SIZE_PER_CATEGORY = 15
RANDOM_SEED = 20260816

# A held-out set drawn with a different seed. Rules were tuned after reading the
# first sample, which makes that sample training data — scoring against it again
# measures memorisation, not accuracy. Only the holdout number is reportable.
HOLDOUT_SEED = 77315
HOLDOUT_SIZE_PER_CATEGORY = 5

LABELS_PATH = Path(__file__).parent / "audit_labels.json"
HOLDOUT_PATH = Path(__file__).parent / "audit_labels_holdout.json"


def draw_sample(items: list[dict], seed: int, per_category: int) -> list[dict]:
    """Stratified by predicted category so small categories are still checked."""
    by_category: dict[str, list[dict]] = defaultdict(list)
    for item in items:
        by_category[item["Category"]].append(item)

    rng = random.Random(seed)
    sample: list[dict] = []

    for category in sorted(by_category):
        pool = sorted(by_category[category], key=lambda i: i["id"])
        take = min(per_category, len(pool))
        sample.extend(rng.sample(pool, take))

    return sorted(sample, key=lambda i: i["id"])


def write_blank_sample(items: list[dict], path: Path, seed: int, per_category: int) -> None:
    sample = draw_sample(items, seed, per_category)
    payload = {
        "note": (
            "Set true_category for each record by reading the title and text. "
            "Use the same category names the classifier uses. Leave null to skip."
        ),
        "seed": seed,
        "records": [
            {
                "id": item["id"],
                "ticker": item["Ticker"],
                "date": item["Date"],
                "title": item["News_Title"],
                "text": item["News_Text"][:400],
                "predicted_category": item["Category"],
                "predicted_routine": item["Is_Routine"],
                "true_category": None,
            }
            for item in sample
        ],
    }
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(sample)} records to {path.name}. Fill in true_category.")


def score(path: Path) -> None:
    if not path.exists():
        print("No audit_labels.json. Run with --sample first.")
        sys.exit(1)

    payload = json.loads(path.read_text(encoding="utf-8"))
    labelled = [r for r in payload["records"] if r.get("true_category")]

    if not labelled:
        print("No labels filled in yet.")
        sys.exit(1)

    correct = 0
    # The asymmetric error: material announcement hidden as routine.
    hidden_material: list[dict] = []
    # The tolerable error: routine posting shown in the default feed.
    shown_routine: list[dict] = []
    per_category = defaultdict(lambda: {"n": 0, "correct": 0})
    confusion = Counter()

    for record in labelled:
        # Re-run the live rules rather than trusting the stored prediction, so
        # the score always reflects the current classifier.
        predicted, predicted_routine = classify(record["title"], record["text"])
        truth = record["true_category"]
        truth_routine = truth in ROUTINE_CATEGORIES

        per_category[truth]["n"] += 1
        if predicted == truth:
            correct += 1
            per_category[truth]["correct"] += 1
        else:
            confusion[(truth, predicted)] += 1

        if truth_routine != predicted_routine:
            (hidden_material if predicted_routine else shown_routine).append(record)

    total = len(labelled)
    print(f"Audited {total} records (of {len(payload['records'])} sampled)\n")
    print(f"Category accuracy:      {correct}/{total} = {100 * correct / total:.1f}%")

    routine_errors = len(hidden_material) + len(shown_routine)
    print(f"Routine/material split: {total - routine_errors}/{total} = "
          f"{100 * (total - routine_errors) / total:.1f}%")

    print(f"\nMaterial hidden as routine: {len(hidden_material)}  <- the error that matters")
    for record in hidden_material:
        print(f"  • {record['title'][:70]}  (true: {record['true_category']})")

    print(f"\nRoutine shown as material:  {len(shown_routine)}  <- tolerable")
    for record in shown_routine[:5]:
        print(f"  • {record['title'][:70]}  (true: {record['true_category']})")

    print("\nPer-category (by true label):")
    for category in sorted(per_category):
        stats = per_category[category]
        print(f"  {category:26} {stats['correct']:3}/{stats['n']:<3} "
              f"{100 * stats['correct'] / stats['n']:5.1f}%")

    if confusion:
        print("\nMost common confusions (true -> predicted):")
        for (truth, predicted), count in confusion.most_common(8):
            print(f"  {truth} -> {predicted}: {count}")


def main() -> None:
    holdout = "--holdout" in sys.argv
    path = HOLDOUT_PATH if holdout else LABELS_PATH
    seed = HOLDOUT_SEED if holdout else RANDOM_SEED
    size = HOLDOUT_SIZE_PER_CATEGORY if holdout else SAMPLE_SIZE_PER_CATEGORY

    if "--sample" in sys.argv:
        _, items = load_archive(Path(__file__).parent.parent / "public")
        if holdout:
            # Never re-draw records already used for tuning.
            used = set()
            if LABELS_PATH.exists():
                used = {r["id"] for r in json.loads(LABELS_PATH.read_text())["records"]}
            items = [i for i in items if i["id"] not in used]
        write_blank_sample(items, path, seed, size)
    else:
        print(f"Scoring {path.name}\n")
        score(path)


if __name__ == "__main__":
    main()
