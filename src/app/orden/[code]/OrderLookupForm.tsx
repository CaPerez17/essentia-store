"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface OrderLookupFormProps {
  code: string;
}

export function OrderLookupForm({ code }: OrderLookupFormProps) {
  const router = useRouter();
  const [formCode, setFormCode] = useState(code);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const telefono = formData.get("telefono") as string;
    const c = (formData.get("code") as string) || formCode;
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    if (telefono) params.set("telefono", telefono);
    router.push(`/orden/${encodeURIComponent(c.trim())}?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-sm mx-auto space-y-4">
      <div>
        <input
          type="text"
          name="code"
          value={formCode}
          onChange={(e) => setFormCode(e.target.value)}
          placeholder="Código (ej. ESS-1234)"
          className="w-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </div>
      <div>
        <input
          type="text"
          name="email"
          placeholder="Email"
          className="w-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </div>
      <div>
        <input
          type="text"
          name="telefono"
          placeholder="Teléfono"
          className="w-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />
      </div>
      <button
        type="submit"
        className="w-full py-2 border border-[var(--accent)] bg-[var(--accent)] text-white text-sm font-medium hover:bg-[var(--accent-hover)]"
      >
        Consultar
      </button>
    </form>
  );
}
