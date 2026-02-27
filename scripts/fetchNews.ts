/**
 * News ingestor script.
 * Loads news from configured adapters (currently JSON file) and upserts into DB.
 *
 * Usage: npx tsx scripts/fetchNews.ts
 *
 * To add new sources: implement NewsSourceAdapter and add to adapters array.
 */

import { PrismaClient } from "@prisma/client";
import { JsonFileAdapter } from "../src/lib/news/adapters";

const prisma = new PrismaClient();

const adapters = [
  new JsonFileAdapter("data/news.seed.json"),
  // Add more adapters here: new FragranticaAdapter(), etc.
];

async function main() {
  console.log("Fetching news from adapters...");

  const allItems: Array<{
    title: string;
    brand?: string;
    category?: string;
    sourceName?: string;
    sourceUrl?: string;
    publishedAt: Date;
    imageUrl?: string;
    excerpt?: string;
  }> = [];

  for (const adapter of adapters) {
    try {
      const items = await adapter.fetchItems(20);
      for (const item of items) {
        allItems.push({
          title: item.title,
          brand: item.brand ?? undefined,
          category: item.category ?? undefined,
          sourceName: item.sourceName ?? undefined,
          sourceUrl: item.sourceUrl ?? undefined,
          publishedAt: new Date(item.publishedAt),
          imageUrl: item.imageUrl ?? undefined,
          excerpt: item.excerpt ?? undefined,
        });
      }
      console.log(`  ${adapter.name}: ${items.length} items`);
    } catch (err) {
      console.error(`  ${adapter.name}: error`, err);
    }
  }

  let created = 0;
  for (const item of allItems) {
    const existing = await prisma.newsItem.findFirst({
      where: {
        title: item.title,
        publishedAt: item.publishedAt,
      },
    });
    if (!existing) {
      await prisma.newsItem.create({ data: item });
      created++;
    }
  }

  console.log(`Done. ${created} new items created, ${allItems.length - created} already existed.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
