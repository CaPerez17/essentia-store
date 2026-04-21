"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

type Direction = "up" | "down" | "left" | "right";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  direction?: Direction;
  className?: string;
  /** Distance in px the element travels during the animation */
  distance?: number;
  /** If true, re-triggers when re-entering viewport. Default: one-shot. */
  repeat?: boolean;
  /** threshold 0-1, default 0.15 */
  threshold?: number;
  as?: "div" | "section" | "article" | "header" | "footer" | "span" | "li";
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  direction = "up",
  className = "",
  distance = 24,
  repeat = false,
  threshold = 0.15,
  as = "div",
}: FadeInProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion: immediately visible
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          if (!repeat) observer.disconnect();
        } else if (repeat) {
          setVisible(false);
        }
      },
      { threshold, rootMargin: "0px 0px -50px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [repeat, threshold]);

  const axis = direction === "up" || direction === "down" ? "y" : "x";
  const sign = direction === "up" || direction === "left" ? 1 : -1;

  const hidden = { opacity: 0, [axis]: distance * sign };
  const shown = { opacity: 1, [axis]: 0 };

  const MotionTag = motion[as] as typeof motion.div;

  return (
    <MotionTag
      ref={ref}
      initial={hidden}
      animate={visible ? shown : hidden}
      transition={{ duration, delay, ease: EASE }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
