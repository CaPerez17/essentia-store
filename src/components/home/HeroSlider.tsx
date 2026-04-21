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
  /** Interval in ms, default 4000 */
  intervalMs?: number;
}

export function HeroSlider({ slides, intervalMs = 4000 }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, slides.length, intervalMs]);

  // Respect reduced-motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) setPaused(true);
  }, []);

  if (slides.length === 0) return null;

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

              {/* Right: product image */}
              <div className="relative hidden lg:block h-[520px]">
                {slide.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.imageUrl}
                    alt={`${slide.brand} ${slide.productName}`}
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <span className="font-serif text-6xl text-[#C9A96E]/30">
                      {slide.brand}
                    </span>
                  </div>
                )}
                {/* Brand + product label bottom right */}
                <div className="absolute bottom-0 right-0 text-right">
                  <p className="text-[9px] uppercase tracking-[0.25em] text-[#C9A96E] mb-1">
                    {slide.brand}
                  </p>
                  <p className="font-serif text-base text-white">
                    {slide.productName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ir al slide ${i + 1}`}
              className={`h-[2px] transition-all duration-300 ${
                i === index
                  ? "w-10 bg-[#C9A96E]"
                  : "w-5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
