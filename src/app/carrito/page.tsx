import { CartContent } from "./CartContent";

export default function CartPage() {
  return (
    <div className="bg-[var(--dark)] min-h-screen">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-serif text-4xl sm:text-5xl font-light text-[var(--cream)] mb-2">
            Tu carrito
          </h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--gold)]/60">
            Revisa tus fragancias antes de continuar
          </p>
        </div>
        <CartContent />
      </div>
    </div>
  );
}
