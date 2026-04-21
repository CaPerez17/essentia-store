import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product/ProductCard";
import { FadeIn } from "@/components/ui/FadeIn";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

export default async function HomePage() {
  const [featured, newProducts, brandsRaw] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true },
      include: { images: true },
      take: 4,
    }),
    prisma.product.findMany({
      where: { isNew: true },
      include: { images: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
      take: 20,
    }),
  ]);

  const brands = brandsRaw.map((b) => b.brand);

  return (
    <div className="bg-[var(--dark)]">
      {/* ═══ HERO ═══ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[85vh] items-center">
          {/* Left — editorial text */}
          <FadeIn direction="up" duration={0.6} className="py-20 lg:py-0 lg:pr-16">
            <p className="text-[9px] uppercase tracking-[0.3em] text-[var(--gold)] mb-6">
              Perfumería de autor
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-[var(--cream)] leading-[1.05] mb-6">
              Fragancias que
              <br />
              cuentan historias
            </h1>
            <p className="font-serif text-lg italic text-[var(--gold)]/80 mb-10 max-w-md">
              Catálogo curado de nicho y diseñador. Descubre esencias únicas de todo el mundo.
            </p>
            <div className="flex gap-4">
              <Link
                href="/catalogo"
                className="btn-primary inline-block border border-[var(--gold)] bg-[var(--gold)] text-[var(--dark)] px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-normal hover:bg-transparent hover:text-[var(--gold)]"
              >
                Ver catálogo
              </Link>
              <Link
                href="/novedades"
                className="btn-primary inline-block border border-[var(--gold-border)] text-[var(--gold)] px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-normal hover:border-[var(--gold)]"
              >
                Novedades
              </Link>
            </div>
          </FadeIn>

          {/* Right — abstract fragrance visual */}
          <FadeIn
            direction="right"
            delay={0.2}
            duration={0.8}
            distance={40}
            className="hidden lg:flex items-center justify-center relative"
          >
            <div className="relative w-full h-[500px]">
              <div className="absolute top-[10%] left-[20%] w-16 h-48 bg-gradient-to-b from-[var(--gold)]/8 to-transparent border border-[var(--gold)]/10 rounded-t-full" />
              <div className="absolute top-[25%] left-[45%] w-20 h-56 bg-gradient-to-b from-[var(--gold)]/12 to-transparent border border-[var(--gold)]/15 rounded-t-[40%]" />
              <div className="absolute top-[15%] right-[15%] w-14 h-44 bg-gradient-to-b from-[var(--gold)]/6 to-transparent border border-[var(--gold)]/8 rounded-t-full" />
              <div className="absolute top-[8%] left-[35%] w-1.5 h-1.5 rounded-full bg-[var(--gold)]/30" />
              <div className="absolute top-[60%] left-[15%] w-1 h-1 rounded-full bg-[var(--gold)]/20" />
              <div className="absolute top-[40%] right-[25%] w-2 h-2 rounded-full bg-[var(--gold)]/15" />
              <div className="absolute bottom-[20%] left-[55%] w-1 h-1 rounded-full bg-[var(--gold)]/25" />
              <div className="absolute top-[70%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)]/20 to-transparent" />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ TICKER ═══ */}
      <FadeIn
        as="section"
        duration={0.7}
        distance={0}
        className="py-4 overflow-hidden"
      >
        <div
          className="py-4"
          style={{
            borderTop: "0.5px solid rgba(201,169,110,0.1)",
            borderBottom: "0.5px solid rgba(201,169,110,0.1)",
          }}
        >
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-8 mr-8">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">Envío a todo Colombia</span>
                <span className="text-[var(--gold)]/30">·</span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">+150 marcas</span>
                <span className="text-[var(--gold)]/30">·</span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">Pago seguro con Wompi</span>
                <span className="text-[var(--gold)]/30">·</span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">Originales garantizados</span>
                <span className="text-[var(--gold)]/30">·</span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">Envío a todo Colombia</span>
                <span className="text-[var(--gold)]/30">·</span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">+150 marcas</span>
                <span className="text-[var(--gold)]/30">·</span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">Pago seguro con Wompi</span>
                <span className="text-[var(--gold)]/30">·</span>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[var(--muted)]">Originales garantizados</span>
                <span className="text-[var(--gold)]/30">·</span>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* ═══ DESTACADOS ═══ */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <FadeIn delay={0.1} className="flex items-center justify-between mb-10">
            <h2 className="text-[9px] uppercase tracking-[0.3em] text-[var(--gold)]">
              Destacados
            </h2>
            <Link href="/catalogo" className="nav-link text-[9px] uppercase tracking-[0.2em] text-[var(--muted)] hover:text-[var(--gold)]">
              Ver todos &rarr;
            </Link>
          </FadeIn>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {featured.map((p, i) => (
              <FadeIn key={p.id} delay={i * 0.08} direction="up">
                <ProductCard product={p} />
              </FadeIn>
            ))}
          </div>
        </section>
      )}

      {/* ═══ EDITORIAL ═══ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <FadeIn direction="up" className="flex gap-6">
            <AnimatedCounter to={1} className="font-serif text-6xl text-[var(--gold)]/15 leading-none select-none" />
            <div>
              <h3 className="font-serif text-2xl text-[var(--cream)] mb-3">Curación artesanal</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Cada fragancia es seleccionada por su singularidad, calidad de ingredientes y capacidad de contar una historia. No vendemos todo — vendemos lo que amamos.
              </p>
            </div>
          </FadeIn>
          <FadeIn direction="up" delay={0.15} className="flex gap-6">
            <AnimatedCounter to={2} duration={1100} className="font-serif text-6xl text-[var(--gold)]/15 leading-none select-none" />
            <div>
              <h3 className="font-serif text-2xl text-[var(--cream)] mb-3">Originales garantizados</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Trabajamos directamente con distribuidores autorizados. Cada frasco viene con certificado de autenticidad y garantía de procedencia.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ POR GÉNERO ═══ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" style={{ borderTop: "0.5px solid rgba(201,169,110,0.1)" }}>
        <FadeIn>
          <h2 className="text-[9px] uppercase tracking-[0.3em] text-[var(--gold)] mb-10">
            Explorar por género
          </h2>
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Masculino", query: "masculine", desc: "Amaderados, especiados, frescos" },
            { label: "Femenino", query: "feminine", desc: "Florales, orientales, gourmand" },
            { label: "Unisex", query: "unisex", desc: "Sin fronteras, para todos" },
          ].map((g, i) => (
            <FadeIn key={g.query} direction="up" delay={i * 0.12}>
              <Link
                href={`/catalogo?genero=${g.query}`}
                className="pcard group block border border-[var(--gold-border)] p-8 transition-all duration-300 hover:border-[var(--gold)] hover:bg-[var(--dark-3)]"
              >
                <h3 className="font-serif text-xl text-[var(--cream)] group-hover:text-[var(--gold)] transition-colors duration-300 mb-2">
                  {g.label}
                </h3>
                <p className="text-[10px] text-[var(--muted)] tracking-wide">{g.desc}</p>
              </Link>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ═══ MARCAS ═══ */}
      {brands.length > 0 && (
        <section className="py-12 overflow-hidden" style={{ borderTop: "0.5px solid rgba(201,169,110,0.1)", borderBottom: "0.5px solid rgba(201,169,110,0.1)" }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn direction="up" distance={12}>
              <h2 className="text-[9px] uppercase tracking-[0.3em] text-[var(--gold)] mb-8 text-center">
                Marcas
              </h2>
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
                {brands.map((b) => (
                  <Link
                    key={b}
                    href={`/catalogo?marca=${encodeURIComponent(b)}`}
                    className="nav-link text-[10px] uppercase tracking-[0.15em] text-[var(--muted)] hover:text-[var(--gold)]"
                  >
                    {b}
                  </Link>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>
      )}

      {/* ═══ NUEVOS ═══ */}
      {newProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <FadeIn className="flex items-center justify-between mb-10">
            <h2 className="text-[9px] uppercase tracking-[0.3em] text-[var(--gold)]">
              Recién llegados
            </h2>
            <Link href="/catalogo" className="nav-link text-[9px] uppercase tracking-[0.2em] text-[var(--muted)] hover:text-[var(--gold)]">
              Ver todos &rarr;
            </Link>
          </FadeIn>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {newProducts.slice(0, 4).map((p, i) => (
              <FadeIn key={p.id} delay={i * 0.08} direction="up">
                <ProductCard product={p} />
              </FadeIn>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
