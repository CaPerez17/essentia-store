"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export interface HeroSlide {
  eyebrow: string;
  title: string;
  titleItalic?: string;
  subtitle: string;
  priceLabel?: string;
  ctaText: string;
  ctaHref: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  imageUrl: string | null;
  brand: string;
  productName: string;
  bg: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
  /** Interval in ms, default 5000 */
  intervalMs?: number;
}

export function HeroSlider({ slides, intervalMs = 5000 }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0 → 100 within current slide
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Drive both slide index and progress bar
  useEffect(() => {
    if (paused || slides.length <= 1) return;
    setProgress(0);
    const step = 50;
    const totalTicks = Math.max(1, Math.floor(intervalMs / step));
    let tick = 0;
    timerRef.current = setInterval(() => {
      tick += 1;
      setProgress((tick / totalTicks) * 100);
      if (tick >= totalTicks) {
        setIndex((i) => (i + 1) % slides.length);
        tick = 0;
        setProgress(0);
      }
    }, step);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, slides.length, intervalMs, index]);

  // Respect reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) setPaused(true);
  }, []);

  if (slides.length === 0) return null;

  const jumpTo = (i: number) => {
    setIndex(i);
    setProgress(0);
  };

  return (
    <section
      className="relative overflow-hidden min-h-[90vh]"
      style={{ backgroundColor: slides[index]?.bg ?? "#0D0D0D" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Destacados"
    >
      {/* Slides (crossfade) */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            i === index ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          style={{ backgroundColor: slide.bg }}
          aria-hidden={i !== index}
        >
          <div className="mx-auto max-w-7xl h-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24 min-h-[90vh] flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center w-full">
              {/* Left: copy */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-6">
                  {slide.eyebrow}
                </p>
                <h1 className="font-serif text-5xl sm:text-6xl lg:text-[68px] font-light text-white leading-[1.02] mb-5">
                  {slide.title}
                  {slide.titleItalic && (
                    <>
                      <br />
                      <span className="italic text-[#C9A96E]">
                        {slide.titleItalic}
                      </span>
                    </>
                  )}
                </h1>
                <p className="text-sm text-[#C9A96E]/80 leading-relaxed mb-6 max-w-md font-serif italic">
                  {slide.subtitle}
                </p>
                {slide.priceLabel && (
                  <p className="inline-block text-[10px] uppercase tracking-[0.25em] text-[#C9A96E] border border-[#C9A96E]/40 px-3 py-1.5 mb-8">
                    {slide.priceLabel}
                  </p>
                )}
                <div className="flex gap-3 flex-wrap">
                  <Link
                    href={slide.ctaHref}
                    className="btn-primary inline-block bg-[#C9A96E] text-[#0D0D0D] px-8 py-3.5 text-[10px] uppercase tracking-[0.2em] font-normal hover:bg-white"
                  >
                    {slide.ctaText}
                  </Link>
                  {slide.secondaryCtaText && slide.secondaryCtaHref && (
                    <Link
                      href={slide.secondaryCtaHref}
                      className="btn-primary inline-block border border-white/50 text-white px-8 py-3.5 text-[10px] uppercase tracking-[0.2em] font-normal hover:border-white hover:bg-white/5"
                    >
                      {slide.secondaryCtaText}
                    </Link>
                  )}
                </div>
              </div>

              {/* Right: product image card (bounded, label stays inside) */}
              <div className="relative hidden lg:flex items-center justify-center">
                <div className="relative w-full max-w-[420px] aspect-[3/4] group">
                  {/* Gold corner accents */}
                  <span className="pointer-events-none absolute top-0 left-0 w-6 h-6 border-t border-l border-[#C9A96E]/40" />
                  <span className="pointer-events-none absolute top-0 right-0 w-6 h-6 border-t border-r border-[#C9A96E]/40" />
                  <span className="pointer-events-none absolute bottom-0 left-0 w-6 h-6 border-b border-l border-[#C9A96E]/40" />
                  <span className="pointer-events-none absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[#C9A96E]/40" />

                  {/* Image */}
                  <div className="absolute inset-6 flex items-center justify-center">
                    {slide.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={slide.imageUrl}
                        alt={`${slide.brand} ${slide.productName}`}
                        className="max-h-[80%] max-w-[85%] object-contain transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <span className="font-serif text-6xl text-[#C9A96E]/30">
                        {slide.brand}
                      </span>
                    )}
                  </div>

                  {/* Brand + product label — INSIDE the card, bottom center */}
                  <div className="absolute inset-x-6 bottom-3 text-center">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-[#C9A96E] mb-1 truncate">
                      {slide.brand}
                    </p>
                    <p className="font-serif text-sm sm:text-base text-white italic truncate">
                      {slide.productName}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Dots with animated progress */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
          {slides.map((_, i) => {
            const isActive = i === index;
            return (
              <button
                key={i}
                type="button"
                onClick={() => jumpTo(i)}
                aria-label={`Ir al slide ${i + 1}`}
                className={`relative h-[2px] overflow-hidden transition-all duration-300 ${
                  isActive
                    ? "w-16 bg-white/15"
                    : "w-5 bg-white/20 hover:bg-white/40"
                }`}
              >
                {isActive && (
                  <span
                    className="absolute inset-y-0 left-0 bg-[#C9A96E]"
                    style={{
                      width: `${progress}%`,
                      transition: "width 50ms linear",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Floating gold particles (decorative) */}
      <div
        className="pointer-events-none absolute top-1/4 right-[8%] w-1.5 h-1.5 rounded-full bg-[#C9A96E]/50"
        style={{ animation: "float 6s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute bottom-1/3 left-[12%] w-1 h-1 rounded-full bg-[#C9A96E]/30"
        style={{ animation: "float 7s ease-in-out -2s infinite" }}
      />
      <div
        className="pointer-events-none absolute top-2/3 right-[18%] w-1 h-1 rounded-full bg-[#C9A96E]/40"
        style={{ animation: "float 8s ease-in-out -4s infinite" }}
      />
    </section>
  );
}
