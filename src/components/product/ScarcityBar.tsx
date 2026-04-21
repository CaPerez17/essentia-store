"use client";

import { useEffect, useState } from "react";

interface ScarcityBarProps {
  stock: number;
}

/**
 * Stock-based urgency bar with animated digit + pulsing dot + viewer count.
 *
 * Rules:
 *  - stock <= 0           → red "Agotado" badge
 *  - stock 1-5            → exact number + flip animation + urgency bar
 *  - stock 6-9            → "Pocas unidades" + subtle bar
 *  - stock >= 10          → hidden (return null)
 */
export function ScarcityBar({ stock }: ScarcityBarProps) {
  const [viewers, setViewers] = useState<number | null>(null);

  // Random 5-12 viewers, refreshed every 8s
  useEffect(() => {
    const roll = () => 5 + Math.floor(Math.random() * 8);
    setViewers(roll());
    const id = setInterval(() => setViewers(roll()), 8000);
    return () => clearInterval(id);
  }, []);

  if (stock <= 0) {
    return (
      <div className="mt-4 flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full bg-red-500"
          style={{ animation: "scarcity-pulse 1.4s ease-in-out infinite" }}
          aria-hidden
        />
        <p className="text-[10px] uppercase tracking-[0.2em] text-red-400">
          Agotado
        </p>
      </div>
    );
  }

  if (stock >= 10) {
    // Still show viewers for social proof
    return viewers ? (
      <div className="mt-4 flex items-center gap-2">
        <span
          className="w-2 h-2 rounded-full bg-green-500"
          style={{ animation: "scarcity-pulse 2s ease-in-out infinite" }}
          aria-hidden
        />
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
          {viewers} personas mirando ahora
        </p>
      </div>
    ) : null;
  }

  const isUrgent = stock <= 5;
  const isLow = stock >= 6 && stock <= 9;

  const dotColor = isUrgent ? "bg-[#C9A96E]" : "bg-[#C9A96E]/70";
  const barColor =
    stock <= 1 ? "bg-red-500" : stock <= 3 ? "bg-orange-400" : "bg-[#C9A96E]";
  const filledPct = Math.min(100, (stock / 10) * 100);

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${dotColor}`}
          style={{ animation: "scarcity-pulse 1.4s ease-in-out infinite" }}
          aria-hidden
        />
        {isUrgent ? (
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#C9A96E] flex items-center gap-1.5">
            <span>¡Últimas</span>
            <AnimatedDigit value={stock} />
            <span>{stock === 1 ? "unidad" : "unidades"}!</span>
          </p>
        ) : isLow ? (
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#C9A96E]/80">
            Pocas unidades disponibles
          </p>
        ) : null}
      </div>

      {/* Urgency bar */}
      <div
        className="h-[3px] w-full max-w-[260px] bg-[#C9A96E]/15 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={stock}
        aria-label="Nivel de stock"
      >
        <div
          className={`h-full ${barColor} transition-all duration-700 ease-out`}
          style={{ width: `${filledPct}%` }}
        />
      </div>

      {/* Viewer social proof */}
      {viewers && (
        <p className="text-[9px] uppercase tracking-[0.15em] text-[var(--muted)]/80">
          👁 {viewers} personas mirando ahora
        </p>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────
// AnimatedDigit: flips from old value to new with slide animation
// ───────────────────────────────────────────────
function AnimatedDigit({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const [flipKey, setFlipKey] = useState(0);

  useEffect(() => {
    if (value === display) return;
    setDisplay(value);
    setFlipKey((k) => k + 1);
  }, [value, display]);

  return (
    <span
      className="inline-block overflow-hidden align-baseline relative"
      style={{ height: "1em", minWidth: "0.8em" }}
    >
      <span
        key={flipKey}
        className="inline-block tabular-nums text-[#C9A96E] font-medium"
        style={{ animation: "flip-in 0.4s ease-out both" }}
      >
        {display}
      </span>
    </span>
  );
}
