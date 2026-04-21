"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
  brand: string;
  /** Background color derived from olfactive family */
  familyBg?: string;
}

export function ProductGallery({
  images,
  productName,
  brand,
  familyBg = "#F8F5EF",
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Zoom state
  const [zooming, setZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const mainRef = useRef<HTMLDivElement | null>(null);

  // Detect media
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(reduced.matches);

    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Real + placeholder slots (up to 4 total)
  const realImages = images.filter(Boolean);
  const placeholderCount = Math.max(0, 4 - realImages.length);
  const allSlots: Array<{ src: string | null }> = [
    ...realImages.map((src) => ({ src })),
    ...Array.from({ length: placeholderCount }, () => ({ src: null })),
  ];

  const active = allSlots[activeIndex];
  const canZoom = isDesktop && !reducedMotion && active?.src != null;

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!canZoom) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomPos({ x, y });
    },
    [canZoom],
  );

  // ESC closes fullscreen
  useEffect(() => {
    if (!fullscreen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
      if (e.key === "ArrowLeft")
        setActiveIndex((i) => (i - 1 + allSlots.length) % allSlots.length);
      if (e.key === "ArrowRight")
        setActiveIndex((i) => (i + 1) % allSlots.length);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [fullscreen, allSlots.length]);

  // ─── MOBILE scroll-snap carousel ───
  if (!isDesktop) {
    return (
      <div className="space-y-3">
        <div
          className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 sm:mx-0"
          style={{ scrollBehavior: "smooth" }}
          aria-label="Galería de imágenes"
        >
          {allSlots.map((slot, i) => (
            <div
              key={i}
              className="snap-start shrink-0 w-full px-4 sm:px-0"
              style={{ touchAction: "pinch-zoom" }}
            >
              <div
                className="aspect-[3/4] overflow-hidden flex items-center justify-center relative"
                style={{ backgroundColor: familyBg }}
              >
                {slot.src ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slot.src}
                      alt={productName}
                      className="max-h-full max-w-full object-contain p-6"
                      onClick={() => {
                        setActiveIndex(i);
                        setFullscreen(true);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setActiveIndex(i);
                        setFullscreen(true);
                      }}
                      aria-label="Ampliar"
                      className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-sm text-white"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-[#C9A96E]/40 text-2xl">•••</span>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B]">
                      {brand}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile fullscreen modal */}
        {fullscreen && (
          <MobileFullscreen
            images={allSlots}
            index={activeIndex}
            onIndex={setActiveIndex}
            onClose={() => setFullscreen(false)}
            productName={productName}
          />
        )}
      </div>
    );
  }

  // ─── DESKTOP: thumbs column + main image with magnetic zoom ───
  return (
    <div className="flex gap-4 lg:sticky lg:top-24 self-start">
      {/* Thumbnails column */}
      <div className="flex flex-col gap-2">
        {allSlots.map((slot, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
            aria-label={`Imagen ${i + 1}`}
            className={`w-20 h-20 overflow-hidden border transition-colors ${
              activeIndex === i
                ? "border-[#C9A96E]"
                : "border-[#E5E5E5] hover:border-[#C9A96E]/60"
            }`}
            style={{ backgroundColor: familyBg }}
          >
            {slot.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={slot.src} alt="" className="w-full h-full object-contain p-1" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-[#C9A96E]/30 text-base">•••</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Main image with magnetic zoom */}
      <div className="relative flex-1">
        <div
          ref={mainRef}
          onMouseEnter={() => canZoom && setZooming(true)}
          onMouseLeave={() => setZooming(false)}
          onMouseMove={onMouseMove}
          className="aspect-[4/5] overflow-hidden relative transition-colors duration-500 select-none"
          style={{
            backgroundColor: familyBg,
            cursor: canZoom ? "none" : "default",
          }}
        >
          {active?.src ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.src}
                alt={productName}
                className="absolute inset-0 w-full h-full object-contain p-10 transition-opacity duration-300"
                key={activeIndex}
              />
              <button
                type="button"
                onClick={() => setFullscreen(true)}
                aria-label="Ver en pantalla completa"
                className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center bg-[#0D0D0D]/20 backdrop-blur-sm text-[#0D0D0D] hover:bg-[#0D0D0D] hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5" strokeLinecap="round" />
                </svg>
              </button>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 border border-[#C9A96E]/40 rounded-full flex items-center justify-center">
                <span className="text-[#C9A96E]/40 text-2xl">📷</span>
              </div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B] text-center px-6">
                Más fotos próximamente
              </p>
              <p className="text-[8px] uppercase tracking-[0.15em] text-[#6B6B6B]">{brand}</p>
            </div>
          )}
        </div>

        {/* Magnetic zoom lens — follows cursor, floats to the right */}
        {canZoom && active?.src && (
          <div
            className={`pointer-events-none absolute top-0 -right-[200px] w-[180px] h-[180px] rounded-full overflow-hidden border border-[#C9A96E]/40 bg-white transition-opacity duration-200 ${
              zooming ? "opacity-100" : "opacity-0"
            }`}
            style={{
              transform: `translate(calc(${zoomPos.x}% - 0px), calc(${zoomPos.y}% - 0px))`,
              top: `calc(${zoomPos.y}% - 90px)`,
              left: `calc(100% + 20px)`,
              backgroundImage: `url(${active.src})`,
              backgroundSize: "250%",
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
              backgroundRepeat: "no-repeat",
              backgroundColor: familyBg,
            }}
            aria-hidden
          />
        )}

        {/* Desktop fullscreen modal */}
        {fullscreen && (
          <DesktopFullscreen
            images={allSlots}
            index={activeIndex}
            onIndex={setActiveIndex}
            onClose={() => setFullscreen(false)}
            productName={productName}
            familyBg={familyBg}
          />
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────
// Mobile fullscreen modal
// ───────────────────────────────────────────────
function MobileFullscreen({
  images,
  index,
  onIndex,
  onClose,
  productName,
}: {
  images: Array<{ src: string | null }>;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  productName: string;
}) {
  const current = images[index];
  return (
    <div
      className="fixed inset-0 z-[90] bg-[#0D0D0D] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white text-2xl z-10"
      >
        ×
      </button>
      {current?.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current.src}
          alt={productName}
          className="max-h-[90vh] max-w-[90vw] object-contain"
          style={{ touchAction: "pinch-zoom" }}
        />
      ) : null}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onIndex(i)}
              aria-label={`Imagen ${i + 1}`}
              className={`w-2 h-2 rounded-full ${i === index ? "bg-[#C9A96E]" : "bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────
// Desktop fullscreen modal with arrows
// ───────────────────────────────────────────────
function DesktopFullscreen({
  images,
  index,
  onIndex,
  onClose,
  productName,
  familyBg,
}: {
  images: Array<{ src: string | null }>;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  productName: string;
  familyBg: string;
}) {
  const current = images[index];
  const canNavigate = images.filter((i) => i.src).length > 1;
  const goPrev = () => onIndex((index - 1 + images.length) % images.length);
  const goNext = () => onIndex((index + 1) % images.length);
  return (
    <div
      className="fixed inset-0 z-[90] bg-[#0D0D0D]/95 flex items-center justify-center backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-white text-2xl z-10 border border-white/20 hover:border-white/60 transition-colors"
      >
        ×
      </button>

      {canNavigate && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Anterior"
            className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white border border-white/20 hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Siguiente"
            className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white border border-white/20 hover:border-[#C9A96E] hover:text-[#C9A96E] transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}

      <div
        className="w-[90vw] h-[90vh] flex items-center justify-center"
        style={{ backgroundColor: familyBg }}
        onClick={(e) => e.stopPropagation()}
      >
        {current?.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.src}
            alt={productName}
            className="max-h-full max-w-full object-contain p-8"
          />
        ) : null}
      </div>
    </div>
  );
}
