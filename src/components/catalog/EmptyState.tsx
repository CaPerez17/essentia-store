import Link from "next/link";

interface EmptyStateProps {
  query?: string | null;
}

export function EmptyState({ query }: EmptyStateProps) {
  return (
    <div className="py-24 text-center max-w-md mx-auto">
      {/* Bottle SVG */}
      <svg
        viewBox="0 0 64 80"
        width="72"
        height="90"
        fill="none"
        stroke="#C9A96E"
        strokeWidth="1.2"
        className="mx-auto mb-8 opacity-70"
        aria-hidden="true"
      >
        <rect x="26" y="6" width="12" height="6" rx="1.5" />
        <path d="M24 14 h16 v4 h-16 z" />
        <rect x="12" y="20" width="40" height="54" rx="3" />
        <rect x="18" y="40" width="28" height="18" stroke="#C9A96E" strokeOpacity="0.4" />
        <circle cx="32" cy="50" r="3" fill="#C9A96E" fillOpacity="0.2" />
      </svg>

      <h2 className="font-serif text-2xl text-[#0D0D0D] mb-3">
        {query
          ? `Sin resultados para "${query}"`
          : "No encontramos fragancias con estos filtros"}
      </h2>
      <p className="text-sm text-[#6B6B6B] leading-relaxed mb-8">
        Prueba quitando algún filtro o busca otra marca. Nuestro catálogo tiene más de 450 fragancias — seguro hay una perfecta para ti.
      </p>
      <Link
        href="/catalogo"
        className="btn-primary inline-block bg-[#0D0D0D] text-white px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-normal hover:bg-[#C9A96E] hover:text-[#0D0D0D] transition-colors"
      >
        Ver todo el catálogo
      </Link>
    </div>
  );
}
