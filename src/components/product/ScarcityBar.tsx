interface ScarcityBarProps {
  stock: number;
}

/**
 * Urgency indicator for the product detail page.
 * - Stock 0: agotado
 * - Stock 1-3: urgente (casi agotado)
 * - Stock 4-8: pocas unidades
 * - Stock 9+: disponible
 *
 * Shows a pulsing dot + copy + stock progress bar.
 */
export function ScarcityBar({ stock }: ScarcityBarProps) {
  if (stock <= 0) {
    return (
      <div className="mt-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden />
        <p className="text-[10px] uppercase tracking-[0.2em] text-red-400">
          Agotado
        </p>
      </div>
    );
  }

  const level: "urgent" | "low" | "normal" =
    stock <= 3 ? "urgent" : stock <= 8 ? "low" : "normal";

  const copy =
    level === "urgent"
      ? `¡Últimas ${stock} ${stock === 1 ? "unidad" : "unidades"}!`
      : level === "low"
        ? `Pocas unidades disponibles (${stock})`
        : `En stock · Envío inmediato`;

  const dotColor =
    level === "urgent"
      ? "bg-red-500"
      : level === "low"
        ? "bg-[#C9A96E]"
        : "bg-green-500";

  const copyColor =
    level === "urgent"
      ? "text-red-400"
      : level === "low"
        ? "text-[#C9A96E]"
        : "text-green-400";

  // Progress bar: how close to "selling out"
  // 0 units = 0%, 10+ units = 100%. Inverted for "urgency" bar.
  const filledPct =
    level === "urgent"
      ? Math.round((stock / 3) * 100)
      : level === "low"
        ? 50 + Math.round(((stock - 3) / 5) * 30)
        : 100;

  const barColor =
    level === "urgent" ? "bg-red-500" : level === "low" ? "bg-[#C9A96E]" : "bg-green-500";

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${dotColor}`}
          style={{ animation: "scarcity-pulse 1.4s ease-in-out infinite" }}
          aria-hidden
        />
        <p className={`text-[10px] uppercase tracking-[0.2em] ${copyColor}`}>
          {copy}
        </p>
      </div>
      {level !== "normal" && (
        <div
          className="h-[3px] w-full max-w-[240px] bg-[var(--gold)]/15"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={filledPct}
          aria-label="Nivel de stock"
        >
          <div
            className={`h-full ${barColor} transition-all duration-500`}
            style={{ width: `${filledPct}%` }}
          />
        </div>
      )}
    </div>
  );
}
