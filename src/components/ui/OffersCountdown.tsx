"use client";

import { useEffect, useState } from "react";

/**
 * Visual-only 72-hour countdown that resets on page refresh.
 * Not persisted — purely for urgency UX.
 */
export function OffersCountdown() {
  const [remaining, setRemaining] = useState(72 * 3600); // 72h in seconds

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 72 * 3600));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(remaining / 3600);
  const m = Math.floor((remaining % 3600) / 60);
  const s = remaining % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="inline-flex items-center gap-3 font-serif text-2xl sm:text-3xl text-[#C9A96E] tabular-nums">
      <span>{pad(h)}</span>
      <span className="text-[#C9A96E]/40">:</span>
      <span>{pad(m)}</span>
      <span className="text-[#C9A96E]/40">:</span>
      <span>{pad(s)}</span>
    </div>
  );
}
