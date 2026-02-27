import * as fs from "fs";
import * as path from "path";
import type { NewsSourceAdapter, RawNewsItem } from "./types";

/**
 * Adapter that loads news from a local JSON file.
 * Used for development and seeding without scraping.
 */
export class JsonFileAdapter implements NewsSourceAdapter {
  name = "json-file";
  private filePath: string;

  constructor(filePath: string = "data/news.seed.json") {
    this.filePath = path.resolve(process.cwd(), filePath);
  }

  async fetchItems(limit = 20): Promise<RawNewsItem[]> {
    const content = fs.readFileSync(this.filePath, "utf-8");
    const items = JSON.parse(content) as RawNewsItem[];
    return items.slice(0, limit);
  }
}
