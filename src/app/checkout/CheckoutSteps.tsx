interface CheckoutStepsProps {
  current: "cart" | "data" | "payment" | "confirmation";
}

const STEPS = [
  { key: "cart", label: "Carrito" },
  { key: "data", label: "Datos" },
  { key: "payment", label: "Pago" },
  { key: "confirmation", label: "Confirmación" },
] as const;

export function CheckoutSteps({ current }: CheckoutStepsProps) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-between mb-10 overflow-x-auto">
      {STEPS.map((step, i) => {
        const isCurrent = i === currentIdx;
        const isPast = i < currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-3">
              <span
                className={`w-6 h-6 flex items-center justify-center text-[10px] border ${
                  isCurrent
                    ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--dark)]"
                    : isPast
                      ? "border-[var(--gold)] text-[var(--gold)]"
                      : "border-[var(--gold-border)] text-[var(--muted)]"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={`text-[10px] uppercase tracking-[0.2em] ${
                  isCurrent
                    ? "text-[var(--gold)]"
                    : isPast
                      ? "text-[var(--cream)]"
                      : "text-[var(--muted)]"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mx-4 ${
                  isPast ? "bg-[var(--gold)]" : "bg-[var(--gold-border)]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
