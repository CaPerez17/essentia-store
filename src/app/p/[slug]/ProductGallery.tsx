"use client";

import { useState } from "react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  brand: string;
}

export function ProductGallery({ images, productName, brand }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Real + placeholder slots (up to 4 total)
  const realImages = images.filter(Boolean);
  const placeholderCount = Math.max(0, 4 - realImages.length);
  const allSlots: Array<{ src: string | null; placeholder: boolean }> = [
    ...realImages.map((src) => ({ src, placeholder: false })),
    ...Array.from({ length: placeholderCount }, () => ({ src: null, placeholder: true })),
  ];

  const active = allSlots[activeIndex];

  return (
    <div className="lg:sticky lg:top-24 self-start space-y-3">
      {/* Main image */}
      <div className="aspect-[3/4] bg-[#0f0e0b] border border-[var(--gold-border)] overflow-hidden">
        {active?.src ? (
          <img
            src={active.src}
            alt={productName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 border border-[var(--gold-border)] rounded-full flex items-center justify-center">
              <span className="text-[var(--gold)]/40 text-2xl">📷</span>
            </div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--muted)]/60 text-center px-6">
              Más fotos próximamente
            </p>
            <p className="text-[8px] uppercase tracking-[0.15em] text-[var(--muted)]/40">
              {brand}
            </p>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      <div className="grid grid-cols-4 gap-2">
        {allSlots.map((slot, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={`aspect-square bg-[#0f0e0b] border overflow-hidden transition-colors duration-200 ${
              activeIndex === i
                ? "border-[var(--gold)]"
                : "border-[var(--gold-border)] hover:border-[var(--gold)]/50"
            }`}
          >
            {slot.src ? (
              <img src={slot.src} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <span className="text-[var(--gold)]/20 text-lg">+</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
