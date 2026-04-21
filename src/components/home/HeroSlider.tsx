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
  /** If "promo", render a discount-table variant over the bg image */
  kind?: "product" | "promo";
  /** Promo-only: array of {color, label, offer} for the discount table */
  promoTiers?: Array<{ color: string; label: string; offer: string }>;
  /** Promo-only: badge text (e.g. "OFERTA ESPECIAL") */
  promoBadge?: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
  intervalMs?: number;
  mobileIntervalMs?: number;
}

export function HeroSlider({
  slides,
  intervalMs = 4000,
  mobileIntervalMs = 5000,
}: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", listener);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) setPaused(true);

    return () => mq.removeEventListener("change", listener);
  }, []);

  const currentInterval = isMobile ? mobileIntervalMs : intervalMs;

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    setProgress(0);
    const step = 50;
    const totalTicks = Math.max(1, Math.floor(currentInterval / step));
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
  }, [paused, slides.length, currentInterval, index]);

  // Parallax (desktop only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || isMobile) return;
    const handleScroll = () => {
      const sec = sectionRef.current;
      if (!sec) return;
      const rect = sec.getBoundingClientRect();
      const heroHeight = rect.height;
      const scrollPast = -rect.top;
      if (scrollPast < 0 || scrollPast > heroHeight) return;
      if (imageRef.current) {
        imageRef.current.style.transform = `translateY(${scrollPast * 0.2}px)`;
      }
      if (textRef.current) {
        textRef.current.style.transform = `translateY(${scrollPast * 0.08}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile]);

  if (slides.length === 0) return null;

  const jumpTo = (i: number) => {
    if (i === index) return;
    setIndex(i);
    setProgress(0);
  };
  const goPrev = () => jumpTo((index - 1 + slides.length) % slides.length);
  const goNext = () => jumpTo((index + 1) % slides.length);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden min-h-[90vh]"
      style={{ backgroundColor: slides[index]?.bg ?? "#0D0D0D" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Destacados"
    >
      {slides.map((slide, i) => {
        const isActive = i === index;
        const isPromo = slide.kind === "promo";
        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              backgroundColor: slide.bg,
              clipPath: isActive ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
              transition: "clip-path 0.5s ease-in-out",
              zIndex: isActive ? 2 : 1,
              pointerEvents: isActive ? "auto" : "none",
            }}
            aria-hidden={!isActive}
          >
            {/* Fullbleed image with Ken Burns on active */}
            {slide.imageUrl && (
              <div ref={isActive ? imageRef : null} className="absolute inset-0">
                <div
                  className={`absolute inset-0 ${isActive ? "animate-ken-burns" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slide.imageUrl}
                    alt={`${slide.brand} ${slide.productName}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Left→right dark gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to right, rgba(13,13,13,0.92) 0%, rgba(13,13,13,0.72) 35%, rgba(13,13,13,0.4) 60%, rgba(13,13,13,0.15) 85%, transparent 100%)",
                  }}
                />
                {/* Bottom fade */}
                <div
                  className="absolute inset-x-0 bottom-0 h-32"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(13,13,13,0.7), transparent)",
                  }}
                />
              </div>
            )}

            {/* Content (left aligned over image) */}
            <div className="relative mx-auto max-w-7xl h-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24 min-h-[90vh] flex items-center z-[3]">
              <div className="max-w-2xl" ref={isActive ? textRef : null}>
                {/* Badge / eyebrow */}
                {isPromo && slide.promoBadge ? (
                  <span
                    className="inline-block bg-red-600 text-white text-[9px] sm:text-[10px] uppercase tracking-[0.3em] px-3 py-1.5 mb-6"
                    style={{
                      animation: isActive ? "slide-text-in 0.3s ease-out 0s both" : undefined,
                    }}
                  >
                    {slide.promoBadge}
                  </span>
                ) : (
                  <p
                    className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-6"
                    key={`eyebrow-${i}-${index}`}
                    style={{
                      animation: isActive ? "slide-text-in 0.3s ease-out 0s both" : undefined,
                    }}
                  >
                    {slide.eyebrow}
                  </p>
                )}

                <h1
                  className={`font-serif font-light text-white leading-[1.02] mb-5 ${
                    isPromo
                      ? "text-5xl sm:text-6xl lg:text-[84px]"
                      : "text-5xl sm:text-6xl lg:text-[68px]"
                  }`}
                  key={`title-${i}-${index}`}
                  style={{
                    animation: isActive ? "slide-text-in 0.4s ease-out 0.1s both" : undefined,
                  }}
                >
                  {slide.title}
                  {slide.titleItalic && (
                    <>
                      <br />
                      <span className="italic text-[#C9A96E]">{slide.titleItalic}</span>
                    </>
                  )}
                </h1>

                {/* Subtitle OR promo tiers */}
                {isPromo && slide.promoTiers?.length ? (
                  <div
                    className="space-y-2.5 mb-8"
                    style={{
                      animation: isActive ? "slide-text-in 0.4s ease-out 0.2s both" : undefined,
                    }}
                  >
                    {slide.promoTiers.map((t, ti) => (
                      <div key={ti} className="flex items-center gap-3">
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0 text-[10px] font-medium text-white"
                          style={{ backgroundColor: t.color }}
                          aria-hidden
                        >
                          {t.label.split(" ")[0]}
                        </span>
                        <span className="font-serif text-base sm:text-lg text-white">
                          <span className="text-white/70">{t.label}</span>{" "}
                          <span className="text-[#C9A96E]">→ {t.offer}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    className="text-sm text-white/85 leading-relaxed mb-6 max-w-md font-serif italic"
                    key={`sub-${i}-${index}`}
                    style={{
                      animation: isActive ? "slide-text-in 0.4s ease-out 0.2s both" : undefined,
                    }}
                  >
                    {slide.subtitle}
                  </p>
                )}

                {slide.priceLabel && !isPromo && (
                  <p
                    className="inline-block text-[10px] uppercase tracking-[0.25em] text-[#C9A96E] border border-[#C9A96E]/40 px-3 py-1.5 mb-8 bg-black/20 backdrop-blur-sm"
                    style={{
                      animation: isActive ? "slide-text-in 0.3s ease-out 0.25s both" : undefined,
                    }}
                  >
                    {slide.priceLabel}
                  </p>
                )}

                <div
                  className="flex gap-3 flex-wrap"
                  key={`cta-${i}-${index}`}
                  style={{
                    animation: isActive ? "slide-text-in 0.3s ease-out 0.3s both" : undefined,
                  }}
                >
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

                {/* Brand + product label bottom, small (product slides only) */}
                {!isPromo && slide.imageUrl && (
                  <div className="mt-10 pt-4 border-t border-white/10 max-w-xs">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-[#C9A96E] mb-1">
                      {slide.brand}
                    </p>
                    <p className="font-serif text-base text-white/80 italic">
                      {slide.productName}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Slide anterior"
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center text-white/60 hover:text-[#C9A96E] border border-white/20 hover:border-[#C9A96E] transition-colors bg-black/30 backdrop-blur-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Slide siguiente"
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center text-white/60 hover:text-[#C9A96E] border border-white/20 hover:border-[#C9A96E] transition-colors bg-black/30 backdrop-blur-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

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
                  isActive ? "w-16 bg-white/15" : "w-5 bg-white/20 hover:bg-white/40"
                }`}
              >
                {isActive && (
                  <span
                    className="absolute inset-y-0 left-0 bg-[#C9A96E]"
                    style={{ width: `${progress}%`, transition: "width 50ms linear" }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Floating particles */}
      <div
        className="pointer-events-none absolute top-1/4 right-[8%] w-1.5 h-1.5 rounded-full bg-[#C9A96E]/50 z-[3]"
        style={{ animation: "float 6s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute bottom-1/3 left-[12%] w-1 h-1 rounded-full bg-[#C9A96E]/30 z-[3]"
        style={{ animation: "float 7s ease-in-out -2s infinite" }}
      />
    </section>
  );
}
