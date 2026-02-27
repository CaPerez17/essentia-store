import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AdminProductsClient } from "./AdminProductsClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { slug: "asc" },
    select: { id: true, slug: true, name: true, brand: true, price: true, stock: true },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-8 text-sm">
        <Link href="/" className="text-[var(--text-muted)] hover:text-[var(--text)]">
          ← Inicio
        </Link>
      </nav>
      <h1 className="text-xl font-medium mb-6">Admin — Productos</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Edita stock y precio inline. Guarda cada fila individualmente.
      </p>
      <AdminProductsClient initialProducts={products} />
    </div>
  );
}
