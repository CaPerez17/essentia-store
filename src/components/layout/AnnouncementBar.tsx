"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "essentia_bar_shown";

export function AnnouncementBar() {
  const [visible, setVisible] = useState(false);

  // Only show on client if not dismissed; default to hidden to avoid flash
  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  const close = () => {
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      /* noop */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="relative w-full bg-[#C9A96E] text-[#0D0D0D] overflow-hidden"
      role="region"
      aria-label="Anuncio"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-9 relative gap-3">
          {/* Desktop message */}
          <p className="hidden sm:block text-[11px] uppercase tracking-[0.2em] text-center">
            🎁 10% OFF en tu primera compra · Código:{" "}
            <span className="font-medium">ESSENTIA10</span> · Envío gratis a todo Colombia
          </p>
          {/* Mobile short message */}
          <p className="sm:hidden text-[10px] uppercase tracking-[0.15em] text-center">
            10% OFF primera compra · <span className="font-medium">ESSENTIA10</span>
          </p>

          <button
            type="button"
            onClick={close}
            aria-label="Cerrar anuncio"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-[#0D0D0D] hover:text-white text-base leading-none transition-colors px-2"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
