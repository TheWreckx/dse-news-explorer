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
  Announced_Value_Local: string;
  Standardized_Value_Tk_Cr: number;
  News_Title: string;
  News_Text: string;
  Source_URL: string;
}

export interface NewsDataPayload {
  tickersList: TickerInfo[];
  newsList: NewsItem[];
}
