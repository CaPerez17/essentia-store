import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { resolveImageUrl } from "@/lib/image-url";

// OG image needs to be served at runtime: every product slug has a unique image.
export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Essentia — Perfumería de Nicho";

const fmtPrice = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Per-product OpenGraph image (1200×630), rendered at the edge.
 * Used by Next.js automatically for `<meta property="og:image">` on /p/[slug].
 */
export default async function ProductOG({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });

  // Fallback: generic ESSENTIA card when product or its image is missing.
  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#0D0D0D",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "serif",
            color: "#C9A96E",
            fontSize: 96,
            letterSpacing: 12,
          }}
        >
          ESSENTIA
        </div>
      ),
      { ...size },
    );
  }

  const imageKey = product.images[0]?.key;
  const imageUrl = imageKey ? resolveImageUrl(imageKey) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#0D0D0D",
          display: "flex",
          flexDirection: "row",
        }}
      >
        {/* Left — product image */}
        <div
          style={{
            width: 540,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0D0D0D",
            backgroundImage:
              "linear-gradient(135deg, rgba(201,169,110,0.08) 0%, rgba(13,13,13,1) 70%)",
          }}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              width={420}
              height={500}
              style={{ objectFit: "contain", maxHeight: 500, maxWidth: 420 }}
            />
          ) : (
            <div
              style={{
                fontFamily: "serif",
                color: "#C9A96E",
                fontSize: 80,
                letterSpacing: 8,
              }}
            >
              ESSENTIA
            </div>
          )}
        </div>

        {/* Right — copy */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 80px",
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
            {product.brand}
          </div>
          <div
            style={{
              fontFamily: "serif",
              color: "#F5F0E8",
              fontSize: 64,
              fontWeight: 300,
              lineHeight: 1.05,
              marginBottom: 32,
              maxWidth: 560,
              display: "flex",
            }}
          >
            {product.name}
          </div>
          <div
            style={{
              color: "#C9A96E",
              fontSize: 36,
              fontFamily: "serif",
              marginBottom: 48,
              display: "flex",
            }}
          >
            {fmtPrice(product.price)}
          </div>
          <div
            style={{
              color: "#6B6B6B",
              fontSize: 18,
              letterSpacing: 4,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            ESSENTIA · Colombia
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
