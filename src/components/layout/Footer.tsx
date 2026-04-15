import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-0 bg-[var(--dark)]" style={{ borderTop: "0.5px solid rgba(201,169,110,0.15)" }}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Logo + description */}
          <div className="md:col-span-1">
            <p className="text-[var(--gold)] text-sm uppercase tracking-[0.35em] mb-4">
              ESSENTIA
            </p>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Perfumería de autor. Catálogo curado de fragancias de nicho y diseñador para Colombia.
            </p>
          </div>

          {/* Tienda */}
          <div>
            <h4 className="text-[9px] font-normal uppercase tracking-[0.2em] text-[var(--gold)] mb-4">
              Tienda
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/catalogo" className="text-xs text-[var(--muted)] hover:text-[var(--gold)] transition-colors duration-300">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/novedades" className="text-xs text-[var(--muted)] hover:text-[var(--gold)] transition-colors duration-300">
                  Novedades
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="text-xs text-[var(--muted)] hover:text-[var(--gold)] transition-colors duration-300">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/carrito" className="text-xs text-[var(--muted)] hover:text-[var(--gold)] transition-colors duration-300">
                  Carrito
                </Link>
              </li>
            </ul>
          </div>

          {/* Ayuda */}
          <div>
            <h4 className="text-[9px] font-normal uppercase tracking-[0.2em] text-[var(--gold)] mb-4">
              Ayuda
            </h4>
            <ul className="space-y-2.5">
              <li>
                <span className="text-xs text-[var(--muted)]">Envíos a todo Colombia</span>
              </li>
              <li>
                <span className="text-xs text-[var(--muted)]">Pagos seguros con Wompi</span>
              </li>
              <li>
                <span className="text-xs text-[var(--muted)]">Originales garantizados</span>
              </li>
            </ul>
          </div>

          {/* Legal / Contacto */}
          <div>
            <h4 className="text-[9px] font-normal uppercase tracking-[0.2em] text-[var(--gold)] mb-4">
              Contacto
            </h4>
            <ul className="space-y-2.5">
              <li>
                <span className="text-xs text-[var(--muted)]">info@essentia.co</span>
              </li>
              <li>
                <span className="text-xs text-[var(--muted)]">Bogotá, Colombia</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6" style={{ borderTop: "0.5px solid rgba(201,169,110,0.1)" }}>
          <p className="text-[10px] text-[var(--muted)]/60 tracking-wider">
            &copy; {new Date().getFullYear()} Essentia. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
