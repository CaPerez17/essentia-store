import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--border)] bg-[var(--bg-card)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <p className="text-lg font-medium text-[var(--text)]">ESSENTIA</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Perfumería de autor. Catálogo curado de nicho y diseñador.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Enlaces
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/catalogo" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
                  Catálogo
                </Link>
              </li>
              <li>
                <Link href="/novedades" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
                  Novedades
                </Link>
              </li>
              <li>
                <Link href="/carrito" className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">
                  Carrito
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-3">
              Contacto
            </h4>
            <p className="text-sm text-[var(--text-muted)]">
              info@essentia.es
            </p>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)]">
            © {new Date().getFullYear()} Essentia. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
