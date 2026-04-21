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
  /** Desktop interval (ms), default 3000 */
  intervalMs?: number;
  /** Mobile interval (ms), default 4000 */
  mobileIntervalMs?: number;
}

export function HeroSlider({
  slides,
  intervalMs = 3000,
  mobileIntervalMs = 4000,
}: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imageRef = useRef<HTMLDivElement | null>(null);
  const textRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  // Detect mobile + reduced-motion
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

  // Auto-rotate with progress
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

  // Parallax on scroll (desktop only, respects reduced-motion)
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
        imageRef.current.style.transform = `translateY(${scrollPast * 0.25}px)`;
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
      {/* Slides with clip-path reveal */}
      {slides.map((slide, i) => {
        const isActive = i === index;
        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              backgroundColor: slide.bg,
              clipPath: isActive ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
              transition: "clip-path 0.4s ease-in-out",
              zIndex: isActive ? 2 : 1,
              pointerEvents: isActive ? "auto" : "none",
            }}
            aria-hidden={!isActive}
          >
            <div className="mx-auto max-w-7xl h-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24 min-h-[90vh] flex items-center">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center w-full">
                {/* Left: copy with staggered animation */}
                <div ref={isActive ? textRef : null}>
                  <p
                    className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-6"
                    key={`eyebrow-${i}-${index}`}
                    style={{
                      animation: isActive ? "slide-text-in 0.3s ease-out 0s both" : undefined,
                    }}
                  >
                    {slide.eyebrow}
                  </p>
                  <h1
                    className="font-serif text-5xl sm:text-6xl lg:text-[68px] font-light text-white leading-[1.02] mb-5"
                    key={`title-${i}-${index}`}
                    style={{
                      animation: isActive ? "slide-text-in 0.4s ease-out 0.1s both" : undefined,
                    }}
                  >
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
                  <p
                    className="text-sm text-[#C9A96E]/80 leading-relaxed mb-6 max-w-md font-serif italic"
                    key={`sub-${i}-${index}`}
                    style={{
                      animation: isActive ? "slide-text-in 0.4s ease-out 0.2s both" : undefined,
                    }}
                  >
                    {slide.subtitle}
                  </p>
                  {slide.priceLabel && (
                    <p
                      className="inline-block text-[10px] uppercase tracking-[0.25em] text-[#C9A96E] border border-[#C9A96E]/40 px-3 py-1.5 mb-8"
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
                </div>

                {/* Right: product card */}
                <div
                  ref={isActive ? imageRef : null}
                  className="relative hidden lg:flex items-center justify-center"
                >
                  <div className="relative w-full max-w-[420px] aspect-[3/4] group">
                    <span className="pointer-events-none absolute top-0 left-0 w-6 h-6 border-t border-l border-[#C9A96E]/40" />
                    <span className="pointer-events-none absolute top-0 right-0 w-6 h-6 border-t border-r border-[#C9A96E]/40" />
                    <span className="pointer-events-none absolute bottom-0 left-0 w-6 h-6 border-b border-l border-[#C9A96E]/40" />
                    <span className="pointer-events-none absolute bottom-0 right-0 w-6 h-6 border-b border-r border-[#C9A96E]/40" />

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
        );
      })}

      {/* Arrows (desktop) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Slide anterior"
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center text-white/60 hover:text-[#C9A96E] border border-white/20 hover:border-[#C9A96E] transition-colors bg-black/20 backdrop-blur-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Slide siguiente"
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 items-center justify-center text-white/60 hover:text-[#C9A96E] border border-white/20 hover:border-[#C9A96E] transition-colors bg-black/20 backdrop-blur-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

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

      {/* Floating particles */}
      <div
        className="pointer-events-none absolute top-1/4 right-[8%] w-1.5 h-1.5 rounded-full bg-[#C9A96E]/50 z-[3]"
        style={{ animation: "float 6s ease-in-out infinite" }}
      />
      <div
        className="pointer-events-none absolute bottom-1/3 left-[12%] w-1 h-1 rounded-full bg-[#C9A96E]/30 z-[3]"
        style={{ animation: "float 7s ease-in-out -2s infinite" }}
      />
      <div
        className="pointer-events-none absolute top-2/3 right-[18%] w-1 h-1 rounded-full bg-[#C9A96E]/40 z-[3]"
        style={{ animation: "float 8s ease-in-out -4s infinite" }}
      />
    </section>
  );
}
