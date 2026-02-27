import type { NewsItem } from "@prisma/client";

interface NewsCardProps {
  item: NewsItem;
  variant?: "default" | "featured" | "compact";
}

export function NewsCard({ item, variant = "default" }: NewsCardProps) {
  const date = new Date(item.publishedAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const metaParts: string[] = [];
  if (item.brand) metaParts.push(item.brand);
  if (item.category) metaParts.push(item.category);
  if (item.sourceName) metaParts.push(item.sourceName);

  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";

  return (
    <article
      className={`border border-[var(--border)] bg-[var(--bg-card)] ${
        isFeatured ? "flex flex-col" : ""
      }`}
    >
      {item.imageUrl ? (
        <div
          className={`overflow-hidden ${
            isFeatured ? "aspect-[16/9]" : isCompact ? "aspect-[16/10]" : "aspect-[16/10]"
          }`}
        >
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div
          className={`flex items-center justify-center text-[var(--text-muted)] text-sm ${
            isFeatured ? "aspect-[16/9] bg-[var(--bg)]" : "aspect-[16/10] bg-[var(--bg)]"
          }`}
        >
          {item.brand || "Novedad"}
        </div>
      )}
      <div className={`p-4 ${isFeatured ? "flex flex-1 flex-col" : ""}`}>
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">
          {metaParts.join(" · ")}
        </p>
        <h3
          className={`font-medium text-[var(--text)] mb-2 ${
            isFeatured ? "text-lg" : ""
          }`}
        >
          {item.title}
        </h3>
        {item.excerpt && (
          <p
            className={`text-[var(--text-muted)] mb-3 ${
              isFeatured ? "text-sm flex-1" : "text-sm line-clamp-2"
            }`}
          >
            {item.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between">
          <time className="text-xs text-[var(--text-muted)]">{date}</time>
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-[var(--accent)] hover:underline"
            >
              Ver fuente →
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
