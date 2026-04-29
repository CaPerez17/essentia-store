import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { brandSlug, categorizeBrand, BRAND_CATEGORY_LABELS } from "@/lib/brands";
import { getBrandLifestyleImage } from "@/lib/image-url";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Essentia — Marca";

/**
 * Per-brand OpenGraph image. Uses the brand's lifestyle banner when available
 * (editorial framing), or falls back to a typographic card.
 */
export default async function BrandOG({ params }: { params: { brand: string } }) {
  // Resolve the brand by slug so the URL param maps back to the canonical name.
  const stats = await prisma.product.groupBy({
    by: ["brand"],
    _count: { brand: true },
  });
  const match = stats.find((s) => brandSlug(s.brand) === params.brand);
  const brandName = match?.brand ?? params.brand;
  const productCount = match?._count.brand ?? 0;
  const category = categorizeBrand(brandName);
  const lifestyleUrl = getBrandLifestyleImage(brandName, 0);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#0D0D0D",
          display: "flex",
          position: "relative",
        }}
      >
        {/* Lifestyle hero image (if available) */}
        {lifestyleUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lifestyleUrl}
            alt=""
            width={1200}
            height={630}
            style={{
              position: "absolute",
              inset: 0,
              objectFit: "cover",
              opacity: 0.45,
            }}
          />
        )}
        {/* Dark overlay for text legibility */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(13,13,13,0.92) 0%, rgba(13,13,13,0.55) 60%, rgba(13,13,13,0.3) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 80px",
            width: "100%",
          }}
        >
          <div
            style={{
              color: "#C9A96E",
              fontSize: 22,
              letterSpacing: 8,
              textTransform: "uppercase",
              marginBottom: 24,
            }}
          >
            ESSENTIA · {BRAND_CATEGORY_LABELS[category]}
          </div>
          <div
            style={{
              fontFamily: "serif",
              color: "#F5F0E8",
              fontSize: 110,
              fontWeight: 300,
              lineHeight: 1.0,
              marginBottom: 32,
              maxWidth: 900,
              display: "flex",
            }}
          >
            {brandName}
          </div>
          {productCount > 0 && (
            <div
              style={{
                color: "#C9A96E",
                fontSize: 28,
                fontFamily: "serif",
                fontStyle: "italic",
                display: "flex",
              }}
            >
              {productCount} fragancias · Envío a Colombia
            </div>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
