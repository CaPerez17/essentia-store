"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/stores/cart-store";
import { useMiniCartStore } from "@/stores/mini-cart-store";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const EXAMPLES = [
  "Dior Sauvage",
  "YSL Black Opium",
  "Chanel Bleu",
  "Creed Aventus",
  "Tom Ford Oud Wood",
];

const LOADING_MESSAGES = [
  "Analizando notas olfativas...",
  "Comparando con el catálogo...",
  "Buscando tu alternativa perfecta...",
];

interface Alternative {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  compareAt: number | null;
  imageUrl: string | null;
  similarityScore: number;
  reason: string;
  matchingNotes: string[];
}

interface Result {
  searched: string;
  searchedBrand: string | null;
  searchedFamily: string | null;
  searchedNotes: string[];
  alternatives: Alternative[];
}

export function DupeFinder() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const openMiniCart = useMiniCartStore((s) => s.open);

  const search = async (perfume: string) => {
    const p = perfume.trim();
    if (p.length < 3) return;
    setQuery(p);
    setError(null);
    setResult(null);
    setLoading(true);
    setLoadingIdx(0);

    // rotate loading messages
    const msgTimer = setInterval(() => {
      setLoadingIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1800);

    try {
      const res = await fetch("/api/dupe-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfume: p }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Error inesperado");
      } else {
        setResult(json as Result);
      }
    } catch {
      setError("No pudimos conectar con el servidor.");
    } finally {
      clearInterval(msgTimer);
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  const handleAddToCart = (a: Alternative) => {
    addItem({
      productId: a.id,
      slug: a.slug,
      name: a.name,
      brand: a.brand,
      price: a.price,
      image: a.imageUrl ?? undefined,
      quantity: 1,
    });
    openMiniCart();
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header oscuro */}
      <section className="bg-[#0D0D0D] py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-6">
            Exclusivo Essentia · Powered by IA ✨
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-[1.05] mb-6">
            Encuentra tu
            <br />
            <span className="italic text-[#C9A96E]">dupe perfecto</span>
          </h1>
          <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-xl mx-auto mb-10">
            Dinos qué perfume de diseñador te gusta y te encontramos la mejor alternativa en nuestro catálogo.
          </p>

          <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej: Dior Sauvage, Chanel No. 5, Creed Aventus..."
                disabled={loading}
                className="flex-1 bg-transparent border border-white/30 px-4 py-3 text-sm text-white placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#C9A96E] transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || query.trim().length < 3}
                className="btn-primary bg-[#C9A96E] text-[#0D0D0D] px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-normal hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buscar alternativas →
              </button>
            </div>
          </form>

          {/* Examples */}
          <div className="mt-8 flex flex-wrap gap-2 justify-center">
            <span className="text-[10px] uppercase tracking-[0.15em] text-[#6B6B6B] mr-2">
              Ejemplos:
            </span>
            {EXAMPLES.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => search(e)}
                disabled={loading}
                className="text-[11px] text-[#C9A96E] hover:text-white transition-colors underline underline-offset-4 decoration-[#C9A96E]/30 hover:decoration-white disabled:opacity-50"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Loading / error / results */}
      <section className="py-16 min-h-[500px]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="text-center py-20">
              {/* Pulsing dot */}
              <div className="flex justify-center gap-2 mb-8">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-[#C9A96E]"
                    style={{
                      animation: "pulse 1.4s ease-in-out infinite",
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
              <p className="font-serif text-xl text-[#0D0D0D] italic">
                {LOADING_MESSAGES[loadingIdx]}
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-20">
              <p className="font-serif text-xl text-[#0D0D0D] mb-3">Algo salió mal</p>
              <p className="text-sm text-[#6B6B6B]">{error}</p>
            </div>
          )}

          {result && !loading && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16">
              {/* Left: searched */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#6B6B6B] mb-3">
                  Buscaste
                </p>
                <h2 className="font-serif text-3xl text-[#0D0D0D] leading-tight mb-2">
                  {result.searched}
                </h2>
                {result.searchedBrand && (
                  <p className="text-sm text-[#6B6B6B] mb-5">{result.searchedBrand}</p>
                )}
                {result.searchedFamily && (
                  <div className="mb-5">
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#C9A96E] mb-1">
                      Familia olfativa
                    </p>
                    <p className="text-sm text-[#0D0D0D] capitalize">{result.searchedFamily}</p>
                  </div>
                )}
                {result.searchedNotes && result.searchedNotes.length > 0 && (
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#C9A96E] mb-2">
                      Notas principales
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.searchedNotes.map((n) => (
                        <span
                          key={n}
                          className="text-[11px] px-3 py-1 bg-[#F5F0E8] border border-[#C9A96E]/30 text-[#0D0D0D]"
                        >
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: alternatives */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-[#C9A96E] mb-5">
                  Tu alternativa en Essentia
                </p>
                {result.alternatives.length === 0 ? (
                  <div className="border border-[#E5E5E5] p-8 text-center">
                    <p className="font-serif text-lg text-[#0D0D0D] mb-2">
                      No encontramos dupes exactos
                    </p>
                    <p className="text-sm text-[#6B6B6B]">
                      Prueba con otro nombre de perfume o explora el catálogo completo.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {result.alternatives.map((a, i) => (
                      <div
                        key={a.slug}
                        className={`flex flex-col sm:flex-row gap-5 p-5 border bg-white ${
                          i === 0 ? "border-[#C9A96E]" : "border-[#E5E5E5]"
                        }`}
                      >
                        {/* Image */}
                        <Link
                          href={`/p/${a.slug}`}
                          className="shrink-0 w-full sm:w-32 h-40 sm:h-40 bg-[#F5F0E8] flex items-center justify-center overflow-hidden"
                        >
                          {a.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={a.imageUrl}
                              alt={a.name}
                              className="h-full w-full object-contain p-3"
                            />
                          ) : (
                            <span className="text-[9px] uppercase tracking-widest text-[#6B6B6B]">
                              {a.brand}
                            </span>
                          )}
                        </Link>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[9px] uppercase tracking-[0.2em] text-[#C9A96E]">
                              {a.brand}
                            </p>
                            {i === 0 && (
                              <span className="text-[8px] uppercase tracking-[0.2em] text-[#0D0D0D] bg-[#C9A96E] px-2 py-0.5">
                                Mejor match
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/p/${a.slug}`}
                            className="block font-serif text-lg text-[#0D0D0D] hover:text-[#C9A96E] transition-colors leading-tight mb-3"
                          >
                            {a.name}
                          </Link>

                          {/* Similarity bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B]">
                                Similitud
                              </span>
                              <span className="text-xs text-[#0D0D0D] font-medium">
                                {a.similarityScore}%
                              </span>
                            </div>
                            <div className="h-1 bg-[#F5F0E8] overflow-hidden">
                              <div
                                className="h-full bg-[#C9A96E] transition-all duration-1000"
                                style={{ width: `${a.similarityScore}%` }}
                              />
                            </div>
                          </div>

                          <p className="text-xs text-[#6B6B6B] leading-relaxed mb-4 italic">
                            &ldquo;{a.reason}&rdquo;
                          </p>

                          {a.matchingNotes.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-4">
                              {a.matchingNotes.map((n) => (
                                <span
                                  key={n}
                                  className="text-[10px] px-2 py-0.5 bg-[#F5F0E8] text-[#6B6B6B]"
                                >
                                  {n}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-4 flex-wrap">
                            <span className="text-sm text-[#0D0D0D]">
                              {fmt(a.price)}
                            </span>
                            <div className="flex gap-2 ml-auto">
                              <button
                                type="button"
                                onClick={() => handleAddToCart(a)}
                                className="btn-primary bg-[#0D0D0D] text-white px-4 py-2 text-[10px] uppercase tracking-[0.2em] hover:bg-[#C9A96E] hover:text-[#0D0D0D] transition-colors"
                              >
                                Agregar
                              </button>
                              <Link
                                href={`/p/${a.slug}`}
                                className="border border-[#E5E5E5] px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-[#0D0D0D] hover:border-[#C9A96E] transition-colors"
                              >
                                Ver más
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
