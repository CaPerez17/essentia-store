"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuickViewStore } from "@/stores/quick-view-store";
import { useCartStore } from "@/stores/cart-store";
import { useMiniCartStore } from "@/stores/mini-cart-store";
import { useToastStore } from "@/stores/toast-store";
import { resolveImageUrl } from "@/lib/image-url";
import { getFamilyBackgroundLight, getScentNotes } from "@/lib/scent-notes";

interface ProductPayload {
  id: string;
  slug: string;
  name: string;
  brand: string;
  description: string | null;
  price: number;
  compareAt: number | null;
  stock: number;
  family: string | null;
  gender: string | null;
  tags: string;
  images: { key: string; position: number }[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const GENDER_LABELS: Record<string, string> = {
  masculine: "Hombre",
  feminine: "Mujer",
  unisex: "Unisex",
};

export function QuickViewDrawer() {
  const { slug, close } = useQuickViewStore();
  const addItem = useCartStore((s) => s.addItem);
  const openMiniCart = useMiniCartStore((s) => s.open);
  const showToast = useToastStore((s) => s.show);

  const [product, setProduct] = useState<ProductPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch when slug changes
  useEffect(() => {
    if (!slug) {
      setProduct(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/products/${slug}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json() as Promise<ProductPayload>;
      })
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch(() => {
        if (!cancelled) setError("No pudimos cargar el producto.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // ESC + body scroll lock
  useEffect(() => {
    if (!slug) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [slug, close]);

  const handleAddToCart = () => {
    if (!product || product.stock < 1) return;
    const imgKey = product.images[0]?.key;
    const imageUrl = imgKey ? resolveImageUrl(imgKey) : undefined;
    addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: imageUrl,
      quantity: 1,
    });
    showToast({
      productName: product.name,
      productBrand: product.brand,
      productImage: imageUrl,
    });
    close();
    setTimeout(() => openMiniCart(), 150);
  };

  const open = slug !== null;

  // Extract a volume chip
  let volumeChip: string | null = null;
  if (product?.tags) {
    try {
      const tags = JSON.parse(product.tags) as string[];
      const vol = tags.find(
        (t) => /^\d+ml$/i.test(t) || t.toLowerCase() === "set",
      );
      if (vol) volumeChip = vol;
    } catch {
      /* noop */
    }
  }

  const firstImgKey = product?.images[0]?.key;
  const imageUrl = firstImgKey ? resolveImageUrl(firstImgKey) : null;
  const familyBg = product
    ? getFamilyBackgroundLight(product.tags, product.gender)
    : "#F8F5EF";

  const notes = product ? getScentNotes(product.family, product.gender) : null;
  const hasDiscount =
    product?.compareAt != null && product.compareAt > product.price;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-[95] bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={close}
        aria-hidden="true"
      />

      {/* Sheet / Modal */}
      <div
        className={`fixed z-[96] bg-white overflow-hidden transition-all duration-300 ease-out
          inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl
          md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-h-none md:w-[820px] md:rounded-none
          ${open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none md:translate-y-0"}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Vista rápida del producto"
      >
        {/* Close */}
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="absolute top-4 right-4 z-10 text-[#6B6B6B] hover:text-[#0D0D0D] text-2xl leading-none transition-colors w-8 h-8 flex items-center justify-center"
        >
          ×
        </button>

        {/* Loading state */}
        {loading && !product && (
          <div className="p-20 text-center text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">
            Cargando...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-20 text-center">
            <p className="font-serif text-xl text-[#0D0D0D] mb-2">Error</p>
            <p className="text-sm text-[#6B6B6B]">{error}</p>
          </div>
        )}

        {/* Content */}
        {product && (
          <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto max-h-[85vh] md:max-h-[80vh]">
            {/* Image */}
            <div
              className="relative aspect-[3/4] md:aspect-auto md:min-h-[480px] transition-colors duration-500"
              style={{ backgroundColor: familyBg }}
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="absolute inset-0 h-full w-full object-contain p-8"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[#6B6B6B] text-sm uppercase tracking-widest">
                  {product.brand}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-8 md:p-10 flex flex-col">
              <p className="text-[9px] uppercase tracking-[0.25em] text-[#C9A96E] mb-2">
                {product.brand}
              </p>
              <h2 className="font-serif text-2xl sm:text-[28px] text-[#0D0D0D] leading-tight mb-4">
                {product.name}
              </h2>

              <div className="flex items-baseline gap-3 mb-5">
                <span className="font-serif text-2xl text-[#0D0D0D]">
                  {fmt(product.price)}
                </span>
                {hasDiscount && (
                  <span className="text-sm text-[#6B6B6B] line-through">
                    {fmt(product.compareAt!)}
                  </span>
                )}
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-2 mb-6">
                {product.gender && (
                  <span className="text-[9px] uppercase tracking-[0.15em] text-[#C9A96E] border border-[#C9A96E]/40 px-3 py-1">
                    {GENDER_LABELS[product.gender] || product.gender}
                  </span>
                )}
                {volumeChip && (
                  <span className="text-[9px] uppercase tracking-[0.15em] text-[#C9A96E] border border-[#C9A96E]/40 px-3 py-1">
                    {volumeChip}
                  </span>
                )}
                {product.family && (
                  <span className="text-[9px] uppercase tracking-[0.15em] text-[#C9A96E] border border-[#C9A96E]/40 px-3 py-1 capitalize">
                    {product.family}
                  </span>
                )}
              </div>

              {/* Scent notes (3 chips from getScentNotes) */}
              {notes && (
                <div className="mb-6">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B] mb-2">
                    Notas principales
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[notes.top[0], notes.heart[0], notes.base[0]]
                      .filter(Boolean)
                      .map((n) => (
                        <span
                          key={n}
                          className="text-[11px] px-3 py-1 bg-[#F5F0E8] text-[#0D0D0D]"
                        >
                          {n}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="mt-auto space-y-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock < 1}
                  className="btn-primary w-full bg-[#0D0D0D] text-white py-3.5 text-[10px] uppercase tracking-[0.25em] hover:bg-[#C9A96E] hover:text-[#0D0D0D] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {product.stock < 1 ? "Agotado" : "Agregar al carrito"}
                </button>
                <Link
                  href={`/p/${product.slug}`}
                  onClick={close}
                  className="block text-center text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B] hover:text-[#C9A96E] transition-colors"
                >
                  Ver página completa →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
