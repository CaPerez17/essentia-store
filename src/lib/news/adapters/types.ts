/**
 * Adapter pattern for news sources.
 * Implement these interfaces to add new sources (Fragrantica, Basenotes, Parfumo, etc.)
 * without breaking the UI or ingestor.
 */

export interface RawNewsItem {
  title: string;
  brand?: string;
  category?: string;
  sourceName?: string;
  sourceUrl?: string;
  publishedAt: string; // ISO date
  imageUrl?: string;
  excerpt?: string;
}

export interface NewsSourceAdapter {
  name: string;
  fetchItems(limit?: number): Promise<RawNewsItem[]>;
}
