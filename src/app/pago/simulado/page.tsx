import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SimuladoContent } from "./SimuladoContent";

export default function PagoSimuladoPage() {
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 text-center text-[var(--text-muted)]">
          Cargando...
        </div>
      }
    >
      <SimuladoContent />
    </Suspense>
  );
}
