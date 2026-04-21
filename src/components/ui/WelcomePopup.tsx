"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "essentia_welcome_shown";
const COUPON = "ESSENTIA10";

export function WelcomePopup() {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    // Prevent body scroll while open
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const close = () => {
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch {
      /* private mode, whatever */
    }
    setVisible(false);
  };

  const copyCoupon = async () => {
    try {
      await navigator.clipboard.writeText(COUPON);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-popup-title"
      className="fixed inset-0 z-[110] flex items-center justify-center px-4"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 animate-fade-in visible"
        onClick={close}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-[420px] bg-[#0D0D0D] p-8 sm:p-10"
        style={{
          border: "0.5px solid rgba(201,169,110,0.6)",
          animation: "welcome-in 0.3s cubic-bezier(0.4,0,0.2,1) forwards",
        }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-[#6B6B6B] hover:text-[#C9A96E] text-xl leading-none transition-colors"
        >
          ×
        </button>

        {/* Logo */}
        <p className="text-center logo-essentia text-[#C9A96E] text-sm font-normal uppercase mb-6">
          ESSENTIA
        </p>

        <h2
          id="welcome-popup-title"
          className="font-serif text-[28px] text-white text-center leading-tight mb-2"
        >
          Bienvenido a Essentia
        </h2>
        <p className="text-[11px] uppercase tracking-[0.25em] text-[#6B6B6B] text-center mb-6">
          Perfumería de nicho para Colombia
        </p>

        {/* Gold divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#C9A96E]/40 to-transparent mb-6" />

        {/* Discount badge */}
        <div className="text-center mb-5">
          <span
            className="inline-block font-serif text-5xl text-[#C9A96E] px-8 py-4 bg-[#C9A96E]/10"
            style={{ border: "0.5px solid rgba(201,169,110,0.4)" }}
          >
            10% OFF
          </span>
        </div>

        <p className="text-center text-sm text-[#e2d9c8] mb-4">
          En tu primera compra. Usa el código:
        </p>

        {/* Coupon code + copy */}
        <div
          className="flex items-stretch mb-3"
          style={{ border: "0.5px solid rgba(201,169,110,0.4)" }}
        >
          <div className="flex-1 px-4 py-3 bg-black text-[#C9A96E] font-mono tracking-[0.25em] text-center">
            {COUPON}
          </div>
          <button
            type="button"
            onClick={copyCoupon}
            className="px-4 py-3 text-[10px] uppercase tracking-[0.15em] bg-[#C9A96E] text-[#0D0D0D] hover:bg-white transition-colors"
          >
            {copied ? "✓ Copiado" : "Copiar"}
          </button>
        </div>

        <p className="text-[10px] uppercase tracking-[0.15em] text-[#6B6B6B] text-center mb-8">
          Válido por 24 horas · Solo primera compra
        </p>

        {/* CTA */}
        <Link
          href="/catalogo"
          onClick={close}
          className="btn-primary block w-full text-center bg-[#C9A96E] text-[#0D0D0D] py-3.5 text-[11px] uppercase tracking-[0.25em] font-normal hover:bg-white transition-colors"
        >
          Explorar fragancias →
        </Link>
      </div>

      {/* Scoped keyframe */}
      <style jsx>{`
        @keyframes welcome-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
