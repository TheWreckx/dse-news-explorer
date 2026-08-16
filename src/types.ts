export interface TickerInfo {
  ticker: string;
  industry: string;
}

export interface NewsItem {
  id: number;
  Date: string;
  Ticker: string;
  Industry: string;
  Category: string;
  /** Mechanical posting (NAV, meeting schedule, trading flag), hidden by default. */
  Is_Routine: boolean;
  Announced_Value_Local: string;
  Standardized_Value_Tk_Cr: number;
  News_Title: string;
  News_Text: string;
  Source_URL: string;
  /** When this project captured the record. Null for pre-provenance records. */
  Fetched_At: string | null;
  /** Fingerprint of the announcement as published, for tamper checking. */
  Content_Hash: string;
}

export interface ArchiveMeta {
  schemaVersion: number;
  generatedAt: string;
  totalCount: number;
  materialCount: number;
  routineCount: number;
  earliestDate: string | null;
  latestDate: string | null;
}

export interface NewsDataPayload {
  meta: ArchiveMeta;
  tickersList: TickerInfo[];
  newsList: NewsItem[];
}

/** How recently the scraper last checked DSE, ready for display. */
export interface Freshness {
  label: string;
  isStale: boolean;
}
