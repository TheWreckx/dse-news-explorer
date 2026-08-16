#!/usr/bin/env python3
"""
Classification for DSE announcements.

Two decisions are made about every announcement:

  1. Is it routine?  DSE's feed is dominated by mechanical postings — funds
     publishing their daily NAV, boards announcing meeting dates, trading
     status flags around record dates. Roughly 45% of all announcements are
     these. They are legitimate records worth keeping, but burying a dividend
     declaration under 5,000 "Daily NAV" postings makes the feed useless.

  2. What is it about?  Material announcements get a subject category.

Titles on DSE are highly standardised ("ACI: Dividend Declaration"), so title
rules are checked before falling back to body-text keywords. The previous
keyword-only approach classified on title+text together, which let a passing
mention in a long body override an unambiguous title.
"""

import re

# ---------------------------------------------------------------------------
# Routine notices — matched on title, most specific first
# ---------------------------------------------------------------------------
# Each entry is (compiled title pattern, category). Anything matching here is
# flagged routine and hidden from the default feed.
ROUTINE_RULES: list[tuple[re.Pattern, str]] = [
    # Funds reporting unit value. By far the largest single group.
    (re.compile(r"\b(daily|weekly|monthly)\s+nav\b", re.I), "Fund_NAV"),
    (re.compile(r"^\s*nav\b", re.I), "Fund_NAV"),

    # Board / trustee meeting scheduling, plus its postponements and reschedules.
    (re.compile(
        r"(board|trustee)\s+(committee\s+)?meeting\s+schedule"
        r"|(postponement|reschedule|rescheduling)\s+of\s+(board|trustee)"
        r"|meeting\s+(schedule\s+)?under\s+lr",
        re.I,
    ), "Meeting_Schedule"),

    # Mechanical trading-status flags published around corporate actions.
    (re.compile(
        r"spot\s+news"
        r"|price\s+limit\s+(open|remove|removal)"
        r"|(suspension\s+for|resumption\s+after)\s+record\s+date"
        r"|resumption\s+of\s+trading|suspension\s+of\s+trading",
        re.I,
    ), "Trading_Status"),
]

# ---------------------------------------------------------------------------
# Material announcements — title rules, checked before body keywords
# ---------------------------------------------------------------------------
TITLE_RULES: list[tuple[re.Pattern, str]] = [
    (re.compile(
        r"dividend\s+(declaration|disbursement|payment|entitlement)"
        r"|(cash|stock|interim|final|no)\s+dividend"
        r"|bonus\s+share"
        # "Declaration of Record Date" is the corporate action itself, unlike
        # the "Suspension for Record Date" trading flag handled as routine.
        r"|declaration\s+of\s+record\s+date|record\s+date\s+declaration"
        # Bond and sukuk income distributions are the fixed-income analogue
        # of a dividend and belong in the same subject.
        r"|coupon\s+(amount|rate)?\s*(disbursement|declaration|payment)"
        r"|profit\s+disbursement|coupon\s+rate",
        re.I,
    ), "Dividends_Earnings"),

    (re.compile(
        r"\bq[1-4]\s+financials?\b|half[\s-]?yearly|annual\s+financials?"
        r"|(un)?audited\s+financials?|financial\s+statements?"
        r"|earnings\s+disclosure|\beps\b",
        re.I,
    ), "Dividends_Earnings"),

    (re.compile(
        r"qualified\s+opinion|adverse\s+opinion|disclaimer\s+of\s+opinion"
        r"|emphasis\s+of\s+matter|going\s+concern"
        r"|winding\s+up|liquidation|insolvency|bankruptcy"
        r"|cease\s+of\s+operation|closure\s+of\s+(factory|plant|operation|production)"
        r"|(joining|appointment)\s+of\s+administrator|administrator\s+and\s+associate",
        re.I,
    ), "Distress_Bankruptcy"),

    (re.compile(
        r"category\s+change|query\s+response|clarification\s+on"
        r"|prohibition\s+on|show\s+cause|penalty|delisting"
        r"|inspection\s+(of|to)\s+.*(factory|premises|office)"
        r"|bsec\s+(order|decline|denies|rejects|cancel)"
        r"|halt\s+of\s+trading|trading\s+halt"
        r"|non[\s-]?response\s+to|query\s+on\s+(hike|price|volume)",
        re.I,
    ), "Regulatory_Legal"),

    (re.compile(
        r"rights?\s+(issue|share)|stock\s+split|reverse\s+split|share\s+buyback"
        r"|paid[\s-]?up\s+capital|authorized\s+capital|subordinated\s+bond"
        r"|convertible\s+bond|preference\s+share|issuance\s+of\s+bond"
        r"|ipo\s+proceeds|consent\s+(for\s+issuance|to\s+issue)"
        r"|capital\s+raising\s+proceeds|proceeds\s+utilizations?",
        re.I,
    ), "Capital_Structure"),

    (re.compile(
        r"(sale|purchase|lease|revaluation|disposal)\s+of\s+(land|asset|propert)"
        r"|land\s+(sale|purchase|lease)|renting\s+out|asset\s+revaluation"
        r"|sub[\s-]?lease|mortgage\s+of|valuation\s+report"
        r"|purchas\w+\s+.*\b(plot|bigha|katha|decimal\s+land)\b",
        re.I,
    ), "Asset_Events"),

    (re.compile(
        r"appointment\s+of|resignation\s+of|election\s+of|name\s+change"
        r"|reconstitution|merger|acquisition|amalgamation|takeover"
        r"|managing\s+director|company\s+secretary|chief\s+executive"
        r"|annual\s+general\s+meeting|extraordinary\s+general\s+meeting"
        r"|\bagm\b|\begm\b"
        r"|transmission\s+of.*share|share\s+transmission"
        r"|share\s+(transfer|receipt)|transfer\s+of\s+share"
        r"|by\s+a\s+(sponsor|director)|sponsor\s+director"
        r"|(buy|sell|sale|purchase|transfer)\s+(confirmation|declaration|intimation)",
        re.I,
    ), "Restructuring_Ownership"),

    (re.compile(
        r"credit\s+rating|surveillance\s+rating|\bcrisl\b|\becrl\b|crab\s+rating"
        r"|capacity\s+expansion|commercial\s+operation|new\s+(project|plant|branch)"
        r"|joint\s+venture|memorandum\s+of\s+understanding|\bmou\b"
        r"|export\s+order|business\s+expansion|machinery"
        r"|(supply|manufacturing|business|distribution)\s+agreement"
        r"|(set(ting)?\s+up|establishment)\s+of|new\s+unit|expansion\s+of"
        r"|\bmachine\b|procurement\s+of|power\s+purchase|purchase\s+contract",
        re.I,
    ), "Operations_Growth"),
]

# ---------------------------------------------------------------------------
# Body-text fallback, used only when no title rule matches
# ---------------------------------------------------------------------------
# Deliberately excludes "record date" and "net asset value": those appear in
# mechanical trading-status and NAV notices, and previously swept thousands of
# unrelated announcements into Dividends_Earnings.
BODY_KEYWORDS: dict[str, list[str]] = {
    "Distress_Bankruptcy": [
        "bankruptcy", "insolvency", "liquidation", "winding up", "cib default",
        "production suspension", "factory closure", "layoff",
        "going concern", "qualified opinion", "asset seizure",
        "adverse opinion", "disclaimer of opinion", "loan default",
        "classified loan", "appoints administrator", "financial difficulties",
        "unable to pay", "non-performing loan", "write off", "write-off",
    ],
    "Capital_Structure": [
        "rights issue", "right issue", "right share", "stock split",
        "reverse split", "share buyback", "buy back shares", "par value",
        "paid-up capital", "authorized capital", "renunciation",
        "subscription period", "capitalization of reserve",
        "initial public offering", "ipo proceeds", "subordinated bond",
        "convertible bond", "preference share", "issuance of bond",
        "consent for issuance", "consent to issue",
    ],
    "Asset_Events": [
        "sale of assets", "disposal of property", "lease agreement",
        "asset revaluation", "property sale", "land sale", "purchase of land",
        "purchase of property", "renting out", "rental agreement",
        "land purchase", "sublease", "sub-lease", "mortgage of property",
        "sale of land", "acquiring land",
    ],
    "Regulatory_Legal": [
        "bsec order", "show cause", "fine imposed", "penalty imposed",
        "non-compliance", "delisting", "category change", "writ petition",
        "litigation", "forensic audit", "enforcement action", "legal notice",
        "court order", "bsec declines", "bsec denies", "bsec rejects",
        "prohibition on", "suspended from trading", "regulatory order",
    ],
    "Restructuring_Ownership": [
        "merger", "acquisition", "amalgamation", "takeover", "privatization",
        "divestment", "spin-off", "sponsor share", "director purchase",
        "director sale", "pledging of shares", "board reconstitution",
        "management change", "company secretary", "auditor appointment",
        "appointment of", "resignation of", "managing director",
        "chief executive", "board of directors", "buy confirmation",
        "sell confirmation", "share transmission", "annual general meeting",
        "extraordinary general meeting", "election of chairman",
        "election of director", "change of director", "change of auditor",
    ],
    "Operations_Growth": [
        "capacity expansion", "new production line", "commercial operation",
        "export order", "joint venture", "memorandum of understanding",
        "product launch", "machinery purchase", "new machinery", "new plant",
        "credit rating", "crisl", "surveillance rating", "ecrl", "crab rating",
        "new project", "commissioning", "business expansion", "new branch",
        "business agreement", "supply agreement", "mou with",
    ],
    "Dividends_Earnings": [
        "cash dividend", "stock dividend", "bonus share", "dividend declaration",
        "no dividend", "interim dividend", "final dividend",
        "earnings per share", "nocfps", "financial statements",
        "quarterly report", "half-yearly", "half yearly", "annual report",
        "audited financials", "un-audited", "unaudited", "consolidated eps",
        "eps was tk", "earnings disclosure", "dividend payment",
        "profit after tax", "loss after tax", "net profit", "net loss",
        "operating profit", "pre-tax profit",
    ],
}

# Categories used only for routine postings. The UI groups these separately.
ROUTINE_CATEGORIES = {"Fund_NAV", "Meeting_Schedule", "Trading_Status"}


def is_routine(title: str) -> tuple[bool, str | None]:
    """Return (routine?, category) based on the announcement title."""
    for pattern, category in ROUTINE_RULES:
        if pattern.search(title):
            return True, category
    return False, None


def classify(title: str, text: str) -> tuple[str, bool]:
    """
    Categorise an announcement.

    Returns (category, routine). Routine postings get their own categories and
    are excluded from the default feed.
    """
    routine, routine_category = is_routine(title)
    if routine:
        return routine_category, True

    for pattern, category in TITLE_RULES:
        if pattern.search(title):
            return category, False

    combined = f"{title} {text}".lower()
    for category, keywords in BODY_KEYWORDS.items():
        if any(keyword in combined for keyword in keywords):
            return category, False

    return "General", False
