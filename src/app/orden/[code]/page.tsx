import { OrderConfirmation } from "./OrderConfirmation";
import { OrderLookupForm } from "./OrderLookupForm";
import { prisma } from "@/lib/prisma";

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ email?: string; telefono?: string }>;
}) {
  const { code } = await params;
  const { email, telefono } = await searchParams;

  const order = await prisma.order.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { items: { include: { product: true } } },
  });

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-medium text-[var(--text)] mb-4">
          Pedido no encontrado
        </h1>
        <p className="text-[var(--text-muted)]">
          Introduce tu código y email o teléfono para consultar tu pedido.
        </p>
        <OrderLookupForm code={code || ""} />
      </div>
    );
  }

  const verifyEmail = email && order.email.toLowerCase() === email.toLowerCase();
  const verifyPhone = telefono && order.phone?.replace(/\s/g, "") === telefono.replace(/\s/g, "");

  if (!verifyEmail && !verifyPhone) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <h1 className="text-2xl font-medium text-[var(--text)] mb-4">
          Verificación requerida
        </h1>
        <p className="text-[var(--text-muted)] mb-6">
          Introduce el email o teléfono con el que realizaste el pedido para ver los detalles.
        </p>
        <OrderLookupForm code={code || ""} />
      </div>
    );
  }

  return <OrderConfirmation order={order} />;
}
