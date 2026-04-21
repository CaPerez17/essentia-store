import Link from "next/link";

export function Footer() {
  return (
    <footer
      className="bg-[#0D0D0D]"
      style={{ borderTop: "0.5px solid rgba(201,169,110,0.15)" }}
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Col 1: Logo + description + social */}
          <div>
            <p className="logo-essentia text-[#C9A96E] text-sm font-normal uppercase mb-5 inline-block">
              ESSENTIA
            </p>
            <p className="text-xs text-[#6B6B6B] leading-relaxed mb-6 max-w-[260px]">
              Perfumería de nicho para Colombia. Catálogo curado de fragancias originales con envío a todo el país.
            </p>
            <div className="flex items-center gap-3">
              {/* Instagram */}
              <a
                href="https://instagram.com/essentiaperfumes.co"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 border border-[#C9A96E]/30 flex items-center justify-center text-[#C9A96E]/80 hover:text-[#C9A96E] hover:border-[#C9A96E] transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
                </svg>
              </a>
              {/* TikTok */}
              <a
                href="https://tiktok.com/@essentiaperfumes"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-9 h-9 border border-[#C9A96E]/30 flex items-center justify-center text-[#C9A96E]/80 hover:text-[#C9A96E] hover:border-[#C9A96E] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.5 6.2a5.5 5.5 0 0 1-3.7-1.4V15a5.5 5.5 0 1 1-5.5-5.5v3a2.5 2.5 0 1 0 2.5 2.5V2h3a5.5 5.5 0 0 0 3.7 4.2z" />
                </svg>
              </a>
              {/* WhatsApp */}
              <a
                href="https://wa.me/573001234567"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-9 h-9 border border-[#C9A96E]/30 flex items-center justify-center text-[#C9A96E]/80 hover:text-[#C9A96E] hover:border-[#C9A96E] transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91A9.9 9.9 0 0 0 12.04 2zm5.55 13.92c-.23.65-1.37 1.26-1.9 1.34-.49.07-1.1.1-1.78-.11-.41-.13-.94-.3-1.61-.59-2.84-1.22-4.69-4.07-4.83-4.26-.14-.19-1.15-1.53-1.15-2.92 0-1.39.73-2.07 1-2.36.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.17.01.41-.07.65.49.23.57.79 1.96.86 2.1.07.14.12.3.02.49-.1.19-.14.3-.28.47-.14.17-.3.37-.42.5-.14.14-.29.29-.12.57.17.28.75 1.24 1.61 2c1.11.99 2.05 1.3 2.33 1.44.28.14.45.12.61-.07.17-.19.71-.83.9-1.12.19-.29.38-.24.64-.15.26.1 1.65.78 1.94.92.29.14.48.21.55.33.07.12.07.66-.16 1.31z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Col 2: Tienda */}
          <div>
            <h4 className="text-[9px] font-normal uppercase tracking-[0.25em] text-[#C9A96E] mb-5">
              Tienda
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/catalogo" className="text-xs text-[#6B6B6B] hover:text-[#C9A96E] transition-colors">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/catalogo?ordenar=marca" className="text-xs text-[#6B6B6B] hover:text-[#C9A96E] transition-colors">
                  Marcas
                </Link>
              </li>
              <li>
                <Link href="/novedades" className="text-xs text-[#6B6B6B] hover:text-[#C9A96E] transition-colors">
                  Novedades
                </Link>
              </li>
              <li>
                <Link href="/catalogo?oferta=true" className="text-xs text-[#6B6B6B] hover:text-[#C9A96E] transition-colors">
                  Ofertas
                </Link>
              </li>
              <li>
                <Link href="/dupe-finder" className="text-xs text-[#6B6B6B] hover:text-[#C9A96E] transition-colors">
                  Dupe Finder ✨
                </Link>
              </li>
              <li>
                <Link href="/quiz" className="text-xs text-[#6B6B6B] hover:text-[#C9A96E] transition-colors">
                  Quiz olfativo
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="text-xs text-[#6B6B6B] hover:text-[#C9A96E] transition-colors">
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Ayuda */}
          <div>
            <h4 className="text-[9px] font-normal uppercase tracking-[0.25em] text-[#C9A96E] mb-5">
              Ayuda
            </h4>
            <ul className="space-y-3">
              <li>
                <Link href="/carrito" className="text-xs text-[#6B6B6B] hover:text-[#C9A96E] transition-colors">
                  Mi orden
                </Link>
              </li>
              <li>
                <span className="text-xs text-[#6B6B6B]">Envíos (2-5 días)</span>
              </li>
              <li>
                <a href="mailto:hola@essentiaperfumes.co" className="text-xs text-[#6B6B6B] hover:text-[#C9A96E] transition-colors">
                  Contacto
                </a>
              </li>
              <li>
                <a href="https://wa.me/573001234567" target="_blank" rel="noopener noreferrer" className="text-xs text-[#6B6B6B] hover:text-[#C9A96E] transition-colors">
                  WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Confianza */}
          <div>
            <h4 className="text-[9px] font-normal uppercase tracking-[0.25em] text-[#C9A96E] mb-5">
              Confianza
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                <span className="text-[#C9A96E]">🔒</span>
                <span>Pago seguro</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                <span className="text-[#C9A96E]">✓</span>
                <span>Originales garantizados</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                <span className="text-[#C9A96E]">📦</span>
                <span>Envío a todo Colombia</span>
              </li>
              <li className="flex items-center gap-2 text-xs text-[#6B6B6B]">
                <span className="text-[#C9A96E]">↩</span>
                <span>Garantía de satisfacción</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-14 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ borderTop: "0.5px solid rgba(201,169,110,0.1)" }}
        >
          <p className="text-[10px] text-[#6B6B6B]/60 tracking-wider">
            &copy; {new Date().getFullYear()} Essentia. Todos los derechos reservados. · Hecho con ♥ en Colombia 🇨🇴
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B]/70">
              Wompi · Visa · Mastercard · PSE · Nequi
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
