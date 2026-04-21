"use client";

import { useEffect, useRef, useState } from "react";

type CursorState = "default" | "link" | "image" | "click";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const ring = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);
  const [active, setActive] = useState(false);
  const [state, setState] = useState<CursorState>("default");

  // Activate only on fine pointer devices
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const apply = () => setActive(mql.matches && !reduced);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  // Hide native cursor while active
  useEffect(() => {
    if (!active) return;
    document.documentElement.classList.add("cursor-none");
    return () => document.documentElement.classList.remove("cursor-none");
  }, [active]);

  // Mouse + RAF lerp
  useEffect(() => {
    if (!active) return;

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      }
    };

    const tick = () => {
      // Lerp ring toward mouse
      ring.current.x += (mouse.current.x - ring.current.x) * 0.18;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%)`;
      }
      rafId.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [active]);

  // Hover state detection + click feedback (delegated to document)
  useEffect(() => {
    if (!active) return;

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest("img")) {
        setState("image");
        return;
      }
      if (
        target.closest(
          "a, button, [role='button'], input, textarea, select, label, .pcard",
        )
      ) {
        setState("link");
        return;
      }
      setState("default");
    };

    const onDown = () => setState((s) => (s === "click" ? s : "click"));
    const onUp = (e: MouseEvent) => {
      // Return to the state matching current target
      onOver(e);
    };

    document.addEventListener("mouseover", onOver);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mouseup", onUp);
    };
  }, [active]);

  if (!active) return null;

  const showDot = state === "default";
  const ringClass = [
    "fixed top-0 left-0 pointer-events-none z-[100] border border-[var(--gold)] rounded-full transition-[width,height,background-color,opacity] duration-200 ease-out flex items-center justify-center",
    state === "default" ? "w-8 h-8 bg-transparent" : "",
    state === "link" ? "w-12 h-12 bg-[var(--gold)]/15" : "",
    state === "image" ? "w-14 h-14 bg-[var(--gold)]/20" : "",
    state === "click" ? "w-8 h-8 bg-[var(--gold)]/10 scale-75" : "",
  ].join(" ");

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        aria-hidden
        className={`fixed top-0 left-0 pointer-events-none z-[101] w-2 h-2 rounded-full bg-[var(--gold)] transition-opacity duration-150 ${
          showDot ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* Ring (with optional VER label) */}
      <div ref={ringRef} aria-hidden className={ringClass}>
        {state === "image" && (
          <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--gold)] font-medium select-none">
            Ver
          </span>
        )}
      </div>
    </>
  );
}
