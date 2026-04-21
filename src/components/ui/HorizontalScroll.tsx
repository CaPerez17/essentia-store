"use client";

import { useEffect, useRef, useState } from "react";

interface HorizontalScrollProps {
  children: React.ReactNode;
  label?: string;
  /** Show scroll hint text, auto-dismisses after 3s */
  hint?: boolean;
}

/**
 * Mobile-only horizontal scroll with snap + dots indicator + "desliza →" hint.
 * On desktop, children render normally (no wrapping behavior change).
 * Parent must provide a grid/flex layout for desktop fallback.
 */
export function HorizontalScroll({
  children,
  label,
  hint = true,
}: HorizontalScrollProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showHint, setShowHint] = useState(hint);
  const [activeDot, setActiveDot] = useState(0);
  const [dotCount, setDotCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Media query
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  // Auto-dismiss hint
  useEffect(() => {
    if (!hint || !isMobile) return;
    const t = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(t);
  }, [hint, isMobile]);

  // Count children to build dots
  useEffect(() => {
    if (!isMobile) return;
    const el = scrollRef.current;
    if (!el) return;
    setDotCount(el.children.length);
  }, [isMobile, children]);

  // Track active dot on scroll
  useEffect(() => {
    if (!isMobile) return;
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const slideWidth = el.clientWidth * 0.82; // approx snap width
      const i = Math.round(el.scrollLeft / slideWidth);
      setActiveDot(i);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [isMobile]);

  if (!isMobile) {
    // Desktop passthrough — children render as parent layout dictates
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {label && (
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B] mb-3 px-4">
          {label}
        </p>
      )}

      <div
        ref={scrollRef}
        className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Wrap each child with a snap-start container */}
        {Array.isArray(children)
          ? children.map((c, i) => (
              <div
                key={i}
                className="snap-start shrink-0"
                style={{ width: "78vw", marginRight: "12px" }}
              >
                {c}
              </div>
            ))
          : (
              <div
                className="snap-start shrink-0"
                style={{ width: "78vw", marginRight: "12px" }}
              >
                {children}
              </div>
            )}
      </div>

      {/* Hint */}
      {showHint && (
        <p
          className="absolute top-3 right-4 text-[10px] uppercase tracking-[0.2em] text-[#C9A96E] transition-opacity duration-500 pointer-events-none"
          style={{ opacity: showHint ? 1 : 0 }}
        >
          desliza →
        </p>
      )}

      {/* Dots */}
      {dotCount > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: dotCount }).map((_, i) => (
            <span
              key={i}
              className={`h-1 transition-all duration-300 ${
                i === activeDot ? "w-6 bg-[#C9A96E]" : "w-1.5 bg-[#C9A96E]/20"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
