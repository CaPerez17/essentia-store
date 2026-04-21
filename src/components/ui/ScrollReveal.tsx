"use client";

import { useScrollAnimation } from "@/hooks/useScrollAnimation";

type AnimKind = "fade-up" | "fade-in" | "scale";

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: AnimKind;
  delay?: 100 | 200 | 300 | 400 | 500 | 600 | 0;
  className?: string;
}

export function ScrollReveal({
  children,
  animation = "fade-up",
  delay = 0,
  className = "",
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>();
  const delayClass = delay ? `delay-${delay}` : "";

  return (
    <div
      ref={ref}
      className={`animate-${animation} ${delayClass} ${isVisible ? "visible" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
