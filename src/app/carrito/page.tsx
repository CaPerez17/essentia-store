import { CartContent } from "./CartContent";

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-medium tracking-tight text-[var(--text)] mb-8">
        Carrito
      </h1>
      <CartContent />
    </div>
  );
}
