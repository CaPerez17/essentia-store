"use client";

import { useQuickViewStore } from "@/stores/quick-view-store";

export function QuickViewButton({ slug }: { slug: string }) {
  const open = useQuickViewStore((s) => s.open);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        open(slug);
      }}
      aria-label="Vista rápida"
      className="bg-[#0D0D0D]/80 backdrop-blur-sm text-white text-[10px] uppercase tracking-[0.2em] px-4 py-2 border border-[#C9A96E]/40 hover:bg-[#C9A96E] hover:text-[#0D0D0D] hover:border-[#C9A96E] transition-colors"
    >
      Vista rápida
    </button>
  );
}
