import Link from "next/link";

/**
 * "Virtual showroom" section that positions Essentia's advisors as the first
 * point of contact: AI-powered quiz, dupe finder, and human WhatsApp support.
 *
 * Goal: increase conversion by guiding the user to the right fragrance before
 * they even hit the catalog.
 */
export function AdvisorShowroom() {
  return (
    <section className="relative bg-[#F5F0E8] py-20 overflow-hidden">
      {/* Decorative accent */}
      <div className="pointer-events-none absolute top-8 left-1/2 -translate-x-1/2 w-px h-12 bg-[#C9A96E]/40" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14 max-w-2xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-4">
            Showroom virtual · Bienvenido
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-[#0D0D0D] leading-[1.05] mb-5">
            Antes de comprar,
            <br />
            <span className="italic text-[#C9A96E]">déjanos asesorarte.</span>
          </h2>
          <p className="text-sm text-[#6B6B6B] leading-relaxed">
            Como en una boutique física, nuestros asesores virtuales están listos para recomendarte la fragancia perfecta según tu personalidad, el perfume que ya te gusta, o conversando con nosotros directamente.
          </p>
        </div>

        {/* 3 advisor cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
          {/* 1. Quiz */}
          <Link
            href="/quiz"
            className="advisor-card group relative bg-[#0D0D0D] p-8 flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1"
            style={{ border: "1px solid rgba(201,169,110,0.2)" }}
          >
            {/* Hover gold background accent */}
            <span className="pointer-events-none absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#C9A96E]/5 group-hover:bg-[#C9A96E]/10 transition-colors duration-500" />

            <div className="relative">
              {/* Badge */}
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#C9A96E]" style={{ animation: "pulse 2s ease-in-out infinite" }} />
                <span className="text-[9px] uppercase tracking-[0.25em] text-[#C9A96E]">
                  Asesor 01 · IA
                </span>
              </div>

              <h3 className="font-serif text-3xl text-white leading-tight mb-3">
                Quiz olfativo
              </h3>
              <p className="text-[12px] text-[#6B6B6B] leading-relaxed mb-6 min-h-[3.5em]">
                6 preguntas, 3 minutos. Analizamos tu personalidad y recomendamos tu match perfecto entre +450 fragancias.
              </p>

              {/* Feature bullets */}
              <ul className="space-y-2 mb-8">
                {["Personalidad olfativa", "Match score personalizado", "Tarjeta compartible"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[11px] text-[#C9A96E]/80">
                    <span className="text-[#C9A96E]">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#C9A96E] mt-auto">
                Empezar quiz
                <span className="arrow-nudge">→</span>
              </span>
            </div>
          </Link>

          {/* 2. Dupe Finder */}
          <Link
            href="/dupe-finder"
            className="advisor-card group relative bg-[#C9A96E] p-8 flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1"
          >
            <span className="pointer-events-none absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-[#0D0D0D]/5 group-hover:bg-[#0D0D0D]/10 transition-colors duration-500" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#0D0D0D]" style={{ animation: "pulse 2s ease-in-out infinite" }} />
                <span className="text-[9px] uppercase tracking-[0.25em] text-[#0D0D0D]">
                  Asesor 02 · IA ✨
                </span>
              </div>

              <h3 className="font-serif text-3xl text-[#0D0D0D] leading-tight mb-3">
                Dupe Finder
              </h3>
              <p className="text-[12px] text-[#0D0D0D]/70 leading-relaxed mb-6 min-h-[3.5em]">
                ¿Te gusta Dior Sauvage pero no el precio? Encuentra la alternativa árabe perfecta en nuestro catálogo con IA.
              </p>

              <ul className="space-y-2 mb-8">
                {["Similitud 60-95%", "Notas olfativas coincidentes", "Ahorro hasta 85%"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[11px] text-[#0D0D0D]/80">
                    <span className="text-[#0D0D0D]">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#0D0D0D] mt-auto">
                Buscar dupe
                <span className="arrow-nudge">→</span>
              </span>
            </div>
          </Link>

          {/* 3. WhatsApp human advisor */}
          <a
            href="https://wa.me/573001234567?text=Hola%2C%20quiero%20asesor%C3%ADa%20para%20elegir%20una%20fragancia"
            target="_blank"
            rel="noopener noreferrer"
            className="advisor-card group relative bg-white p-8 flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1"
            style={{ border: "1px solid #E5E5E5" }}
          >
            <span className="pointer-events-none absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#25D366]/5 group-hover:bg-[#25D366]/10 transition-colors duration-500" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#25D366]" style={{ animation: "pulse 2s ease-in-out infinite" }} />
                <span className="text-[9px] uppercase tracking-[0.25em] text-[#25D366]">
                  Asesor 03 · Humano
                </span>
              </div>

              <h3 className="font-serif text-3xl text-[#0D0D0D] leading-tight mb-3">
                WhatsApp
              </h3>
              <p className="text-[12px] text-[#6B6B6B] leading-relaxed mb-6 min-h-[3.5em]">
                ¿Prefieres hablar con una persona? Nuestro equipo te atiende directamente para recomendarte, resolver dudas o gestionar tu pedido.
              </p>

              <ul className="space-y-2 mb-8">
                {["Respuesta en minutos", "Asesoría personalizada", "Seguimiento de pedido"].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[11px] text-[#6B6B6B]">
                    <span className="text-[#25D366]">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#0D0D0D] mt-auto">
                Escribir por WhatsApp
                <span className="arrow-nudge">→</span>
              </span>
            </div>
          </a>
        </div>

        {/* Trust strip bottom */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">
          <span className="flex items-center gap-2">
            <span className="text-[#C9A96E]">✓</span> 100% originales
          </span>
          <span className="text-[#C9A96E]/30">·</span>
          <span className="flex items-center gap-2">
            <span className="text-[#C9A96E]">📦</span> Envío a todo Colombia
          </span>
          <span className="text-[#C9A96E]/30">·</span>
          <span className="flex items-center gap-2">
            <span className="text-[#C9A96E]">🔒</span> Pago seguro con Wompi
          </span>
          <span className="text-[#C9A96E]/30">·</span>
          <span className="flex items-center gap-2">
            <span className="text-[#C9A96E]">↩</span> Satisfacción garantizada
          </span>
        </div>
      </div>
    </section>
  );
}
