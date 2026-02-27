"use client";

import { useState } from "react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  brand: string;
}

export function ProductGallery({ images, productName, brand }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const displayImages = images.length > 0 ? images : [null];

  return (
    <div className="space-y-4">
      <div className="aspect-[3/4] bg-[var(--bg)] overflow-hidden border border-[var(--border)]">
        {displayImages[activeIndex] ? (
          <img
            src={displayImages[activeIndex]!}
            alt={productName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-[var(--bg)] text-[var(--text-muted)] text-sm">
            {brand}
          </div>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={`h-16 w-16 shrink-0 border transition-colors ${
                activeIndex === i
                  ? "border-[var(--accent)]"
                  : "border-[var(--border)] hover:border-[var(--text-muted)]"
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
