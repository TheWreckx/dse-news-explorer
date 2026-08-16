#!/usr/bin/env python3
"""
Guards against the classifier hiding material announcements.

Routine postings are hidden from the default feed. That makes a false positive
here the most dangerous bug in the project and the hardest to notice: a buried
announcement produces no clicks, no complaints and no analytics event, so the
metrics look identical whether the rule is right or wrong. Nothing else will
catch it, so it is asserted.

The first case is real. On 2025-11-06 DSE suspended five Islamic banks
indefinitely; an earlier rule matched "suspension of trading" as routine and
hid all five behind a toggle nobody had turned on.

Run: python scripts/test_classify.py
"""

import sys

from classify import ROUTINE_CATEGORIES, classify

# Titles that must never be treated as routine, with why they matter.
MUST_BE_MATERIAL = [
    ("SIBL: Suspension of Trading", "indefinite regulatory halt, not a record date"),
    ("FASFIN: Suspension of Trading", "indefinite regulatory halt"),
    ("SONARGAON: Resumption of trading", "end of an indefinite halt"),
    ("ACI: Dividend Declaration", "core corporate action"),
    ("GP: Q2 Financials", "periodic results"),
    ("BEXIMCO: Category Change", "regulatory reclassification"),
    ("IPDC: Asset Revaluation", "balance-sheet event"),
    ("USMANIAGL: Halt of trading of the company", "trading halt"),
    ("SQURPHARMA: Qualified Opinion", "audit qualification"),
    ("RUNNERAUTO: Board approves master supply agreement", "material contract"),
]

# Titles that should be routine, so the toggle keeps earning its place.
MUST_BE_ROUTINE = [
    ("CAPMIBBLMF: Daily NAV", "fund unit value"),
    ("GLDNJMF: Weekly NAV", "fund unit value"),
    ("BGIC: Board Meeting schedule under LR 16(1)", "meeting scheduling"),
    ("PADMALIFE: Postponement of Board Meeting schedule under LR 16(1)", "meeting scheduling"),
    ("DGIC: Resumption after Record Date", "record-date mechanics"),
    ("SEAPEARL: Suspension for Record Date", "record-date mechanics"),
    ("PLFSL: Price Limit Open", "price-limit mechanics"),
    ("SKTRIMS: Spot News", "spot-market flag"),
]


def main() -> None:
    failures: list[str] = []

    for title, reason in MUST_BE_MATERIAL:
        category, routine = classify(title, "")
        if routine:
            failures.append(
                f"HIDDEN but material: {title!r} -> {category} ({reason})"
            )

    for title, reason in MUST_BE_ROUTINE:
        category, routine = classify(title, "")
        if not routine:
            failures.append(
                f"SHOWN but routine: {title!r} -> {category} ({reason})"
            )
        elif category not in ROUTINE_CATEGORIES:
            failures.append(
                f"routine flag set but category {category!r} is not a routine category: {title!r}"
            )

    total = len(MUST_BE_MATERIAL) + len(MUST_BE_ROUTINE)
    if failures:
        print(f"FAILED {len(failures)} of {total} checks\n")
        for failure in failures:
            print(f"  {failure}")
        sys.exit(1)

    print(f"All {total} classification checks passed")


if __name__ == "__main__":
    main()
