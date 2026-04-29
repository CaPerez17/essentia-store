import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CITIES, findCity } from "@/lib/cities";
import { ProductCard } from "@/components/product/ProductCard";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.essentiaperfumes.co";

interface PageProps {
  params: Promise<{ ciudad: string }>;
}

/** Pre-render every supported city at build time (SSG). */
export function generateStaticParams() {
  return CITIES.map((c) => ({ ciudad: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ciudad } = await params;
  const city = findCity(ciudad);
  if (!city) {
    return { title: "Ciudad no encontrada" };
  }
  const title = `Perfumes Originales en ${city.name} | Essentia Colombia`;
  const description = `Compra perfumes originales en ${city.name}, ${city.department} con envío a domicilio en ${city.deliveryDays} días hábiles. Marcas árabes, nicho y diseñador. Pago seguro.`;
  return {
    title,
    description,
    alternates: { canonical: `/perfumes/${city.slug}` },
    keywords: [
      `perfumes ${city.name}`,
      `perfumes originales ${city.name}`,
      `perfumería ${city.name}`,
      `comprar perfumes ${city.name}`,
      "fragancias originales Colombia",
      "perfumes árabes Colombia",
      "perfumería de nicho",
    ],
    openGraph: {
      type: "website",
      title,
      description,
      url: `/perfumes/${city.slug}`,
      siteName: "Essentia",
    },
  };
}

export default async function CityLandingPage({ params }: PageProps) {
  const { ciudad } = await params;
  const city = findCity(ciudad);
  if (!city) notFound();

  // Popular products = featured-or-cheapest with images, capped at 8.
  const products = await prisma.product.findMany({
    where: { images: { some: {} } },
    orderBy: [{ featured: "desc" }, { price: "asc" }],
    take: 8,
    include: { images: { orderBy: { position: "asc" } } },
  });

  const faqs = [
    {
      q: `¿Cuánto demora el envío a ${city.name}?`,
      a: `El tiempo estimado de entrega a ${city.name}, ${city.department} es de ${city.deliveryDays} días hábiles tras la confirmación del pago. Te enviamos número de guía para que rastrees tu pedido.`,
    },
    {
      q: "¿Los perfumes son originales?",
      a: "Sí, 100% originales. Trabajamos directamente con distribuidores autorizados y cada frasco viene con certificado de autenticidad y garantía de procedencia.",
    },
    {
      q: "¿Cómo puedo pagar?",
      a: "Aceptamos pago seguro a través de Wompi: tarjeta de crédito/débito (Visa, Mastercard, American Express), PSE, Nequi, y Bancolombia Transfer.",
    },
    {
      q: `¿Hacen entrega contraentrega en ${city.name}?`,
      a: `No manejamos contraentrega. El pago se realiza al momento de la compra de forma segura por Wompi y procesamos el envío a ${city.name} dentro del siguiente día hábil.`,
    },
    {
      q: "¿Puedo devolver el producto?",
      a: "Sí. Aceptamos devoluciones dentro de los 5 días posteriores a la entrega siempre que el producto no haya sido usado y mantenga su empaque original.",
    },
  ];

  // FAQ schema markup → richer Google results (FAQ accordion in SERP)
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  // LocalBusiness JSON-LD anchored to the city — helps with local pack signals
  const businessJsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: `Essentia · Perfumes Originales en ${city.name}`,
    url: `${BASE_URL}/perfumes/${city.slug}`,
    image: `${BASE_URL}/og-image.png`,
    areaServed: { "@type": "City", name: city.name },
    priceRange: "$$$",
    paymentAccepted: "Tarjeta de crédito, PSE, Nequi, Bancolombia Transfer",
  };

  return (
    <div className="bg-white min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
      />

      {/* Dark hero */}
      <section className="bg-[#0D0D0D] py-20 lg:py-24 relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-5">
            Envío a {city.department}
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.02] mb-6">
            <span className="text-white">Perfumes originales en</span>{" "}
            <span className="text-[#C9A96E] italic">{city.name}</span>
          </h1>
          <p className="text-base text-[#A09684] max-w-2xl mx-auto leading-relaxed">
            Compra fragancias originales con envío a domicilio en {city.name}.
            Árabes, nicho y diseñador. Entrega en {city.deliveryDays} días
            hábiles · pago seguro con Wompi · garantía de autenticidad.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/catalogo"
              className="inline-block bg-[#C9A96E] text-[#0D0D0D] px-8 py-3.5 text-[10px] uppercase tracking-[0.2em] font-normal hover:bg-white transition-colors"
            >
              Ver catálogo →
            </Link>
            <Link
              href="/marcas"
              className="inline-block border border-white/40 text-white px-8 py-3.5 text-[10px] uppercase tracking-[0.2em] font-normal hover:border-white hover:bg-white/5 transition-colors"
            >
              Marcas
            </Link>
          </div>
        </div>
      </section>

      {/* Why Essentia (3 columns) */}
      <section className="bg-[#F5F0E8] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-[#0D0D0D] text-center mb-14">
            ¿Por qué comprar en Essentia desde {city.name}?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Reason
              icon="🚚"
              title={`Envío en ${city.deliveryDays} días hábiles`}
              body={`Despachamos a ${city.name}, ${city.department} con guía de rastreo. Tu pedido llega seguro a tu puerta.`}
            />
            <Reason
              icon="✓"
              title="100% originales"
              body="Distribuidores autorizados. Certificado de autenticidad incluido en cada frasco. Garantía de procedencia."
            />
            <Reason
              icon="🔒"
              title="Pago seguro con Wompi"
              body="Tarjeta, PSE, Nequi o Bancolombia Transfer. Pasarela certificada PCI-DSS. Tus datos están protegidos."
            />
          </div>
        </div>
      </section>

      {/* Popular products */}
      {products.length > 0 && (
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-4">
                Lo más vendido en {city.name}
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-light text-[#0D0D0D]">
                Fragancias destacadas
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} variant="light" />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link
                href="/catalogo"
                className="inline-block text-[10px] uppercase tracking-[0.25em] text-[#0D0D0D] border-b border-[#0D0D0D] pb-1 hover:text-[#C9A96E] hover:border-[#C9A96E] transition-colors"
              >
                Ver todo el catálogo →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="bg-[#F5F0E8] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-[#0D0D0D] text-center mb-12">
            Preguntas frecuentes
          </h2>
          <div className="space-y-2">
            {faqs.map((f) => (
              <details
                key={f.q}
                className="group bg-white border border-[#C9A96E]/20 px-6 py-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="cursor-pointer flex items-center justify-between gap-4 list-none">
                  <span className="font-serif text-lg text-[#0D0D0D]">{f.q}</span>
                  <span className="text-[#C9A96E] text-2xl leading-none transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 text-sm text-[#6B6B6B] leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Reason({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl mb-4" aria-hidden>
        {icon}
      </div>
      <h3 className="font-serif text-xl text-[#0D0D0D] mb-3">{title}</h3>
      <p className="text-sm text-[#6B6B6B] leading-relaxed">{body}</p>
    </div>
  );
}
