import { CheckoutForm } from "./CheckoutForm";

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-medium tracking-tight text-[var(--text)] mb-8">
        Checkout
      </h1>
      <CheckoutForm />
    </div>
  );
}
