"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  to: number;
  /** Duration in ms, default 1000 */
  duration?: number;
  /** Padding (e.g. 2 → "01", "02") */
  pad?: number;
  className?: string;
}

/**
 * Counts from 0 up to `to` once when it enters the viewport.
 * Uses CSS-style tabular numbers so widths don't jump.
 */
export function AnimatedCounter({
  to,
  duration = 1000,
  pad = 2,
  className = "",
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(to);
      return;
    }

    let started = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !started) {
          started = true;
          observer.disconnect();
          const startTime = performance.now();
          const step = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * to));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [to, duration]);

  return (
    <span ref={ref} className={`counter-num ${className}`}>
      {String(value).padStart(pad, "0")}
    </span>
  );
}
