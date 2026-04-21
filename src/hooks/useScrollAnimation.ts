"use client";

import { useEffect, useRef, useState } from "react";

interface Options {
  threshold?: number;
  rootMargin?: string;
  /** If true, re-triggers on re-entry. Default false (one-shot). */
  repeat?: boolean;
}

/**
 * Hook that returns a ref + isVisible boolean based on IntersectionObserver.
 * Usage:
 *   const { ref, isVisible } = useScrollAnimation();
 *   return <div ref={ref} className={`animate-fade-up ${isVisible ? "visible" : ""}`}>...</div>;
 */
export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>(
  options: Options = {},
) {
  const { threshold = 0.15, rootMargin = "0px 0px -50px 0px", repeat = false } = options;
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced-motion: treat as visible immediately
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          if (!repeat) observer.disconnect();
        } else if (repeat) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, repeat]);

  return { ref, isVisible };
}
