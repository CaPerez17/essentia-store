import type { NewsItem } from "@prisma/client";

interface NewsCardProps {
  item: NewsItem;
  variant?: "default" | "featured" | "compact";
}

export function NewsCard({ item, variant = "default" }: NewsCardProps) {
  const date = new Date(item.publishedAt).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";

  const categoryLabels: Record<string, string> = {
    niche: "Nicho",
    nicho: "Nicho",
    designer: "Diseñador",
    disenador: "Diseñador",
    arab: "Árabe",
    arabes: "Árabe",
  };

  return (
    <article className={`group bg-[var(--dark)] border border-transparent hover:border-[var(--gold-border)] transition-colors duration-300 ${isFeatured ? "flex flex-col" : ""}`}>
      {/* Image */}
      {item.imageUrl ? (
        <div className={`overflow-hidden ${isFeatured ? "aspect-[16/9]" : isCompact ? "aspect-[2/1]" : "aspect-[16/10]"}`}>
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] opacity-80 group-hover:opacity-100"
          />
        </div>
      ) : (
        <div className={`flex items-center justify-center bg-[var(--dark-3)] ${isFeatured ? "aspect-[16/9]" : isCompact ? "aspect-[2/1]" : "aspect-[16/10]"}`}>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">
            {item.brand || "Novedad"}
          </span>
        </div>
      )}

      {/* Content */}
      <div className={`p-5 ${isFeatured ? "flex flex-1 flex-col" : ""}`}>
        {/* Meta line */}
        <div className="flex items-center gap-3 mb-3">
          {item.category && (
            <span className="text-[8px] uppercase tracking-[0.2em] text-[var(--dark)] bg-[var(--gold)] px-2 py-0.5">
              {categoryLabels[item.category] || item.category}
            </span>
          )}
          {item.brand && (
            <span className="text-[9px] uppercase tracking-[0.15em] text-[var(--gold)]/70">
              {item.brand}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className={`font-serif text-[var(--cream)] group-hover:text-[var(--gold)] transition-colors duration-300 mb-2 ${isFeatured ? "text-2xl" : "text-base"}`}>
          {item.title}
        </h3>

        {/* Excerpt */}
        {item.excerpt && (
          <p className={`text-xs text-[var(--muted)] leading-relaxed mb-4 ${isFeatured ? "flex-1" : "line-clamp-2"}`}>
            {item.excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto">
          <time className="text-[9px] uppercase tracking-[0.15em] text-[var(--muted)]/60">
            {date}
          </time>
          {item.sourceUrl && (
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] uppercase tracking-[0.15em] text-[var(--gold)]/60 hover:text-[var(--gold)] transition-colors duration-300"
            >
              Leer &rarr;
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
