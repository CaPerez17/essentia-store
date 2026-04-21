"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resolveImageUrl } from "@/lib/image-url";

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  images: { key: string }[];
}

interface SearchBarProps {
  open: boolean;
  onClose: () => void;
}

const fmt = (n: number) =>
  "$\u00A0" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

export function SearchBar({ open, onClose }: SearchBarProps) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus when opened
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    } else {
      setQ("");
      setResults([]);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open || q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products/search?q=${encodeURIComponent(q.trim())}`,
          { signal: controller.signal }
        );
        const json = await res.json();
        setResults(json.items || []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [q, open]);

  // ESC + click outside
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      router.push(`/catalogo?q=${encodeURIComponent(q.trim())}`);
      handleClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleClose}
      />

      {/* Slide-down panel */}
      <div
        ref={containerRef}
        className={`fixed top-0 left-0 right-0 z-50 bg-[#0f0e0b] transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "-translate-y-full"
        }`}
        style={{ borderBottom: "0.5px solid rgba(201,169,110,0.25)" }}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
          {/* Input row */}
          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c9a96e" strokeWidth="1.5" className="shrink-0">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Busca tu fragancia..."
              className="flex-1 bg-transparent text-[var(--cream)] text-lg font-serif placeholder:text-[var(--muted)]/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleClose}
              aria-label="Cerrar búsqueda"
              className="text-[var(--muted)] hover:text-[var(--gold)] transition-colors text-[10px] uppercase tracking-[0.2em]"
            >
              Cerrar [ESC]
            </button>
          </form>

          {/* Results */}
          {q.trim().length >= 2 && (
            <div className="mt-6 pt-6" style={{ borderTop: "0.5px solid rgba(201,169,110,0.15)" }}>
              {loading ? (
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Buscando...</p>
              ) : results.length === 0 ? (
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                  No encontramos resultados para &ldquo;{q}&rdquo;
                </p>
              ) : (
                <>
                  <p className="text-[9px] uppercase tracking-[0.25em] text-[var(--gold)] mb-4">
                    {results.length} {results.length === 1 ? "resultado" : "resultados"}
                  </p>
                  <ul className="space-y-1">
                    {results.map((r) => {
                      const imgKey = r.images?.[0]?.key;
                      const imgUrl = imgKey ? resolveImageUrl(imgKey) : null;
                      return (
                        <li key={r.id}>
                          <Link
                            href={`/p/${r.slug}`}
                            onClick={handleClose}
                            className="flex items-center gap-4 p-3 hover:bg-[var(--gold)]/5 transition-colors duration-200 border border-transparent hover:border-[var(--gold-border)]"
                          >
                            <div className="h-14 w-12 shrink-0 bg-[#1a1710] overflow-hidden">
                              {imgUrl ? (
                                <img src={imgUrl} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-[8px] uppercase tracking-widest text-[var(--muted)]">
                                  {r.brand}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--gold)] mb-0.5">
                                {r.brand}
                              </p>
                              <p className="font-serif text-sm text-[var(--cream)] truncate">
                                {r.name}
                              </p>
                            </div>
                            <p className="shrink-0 text-xs text-[var(--muted)]">
                              {fmt(r.price)}
                            </p>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
