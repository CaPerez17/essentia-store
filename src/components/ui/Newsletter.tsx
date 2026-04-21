"use client";

import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      setStatus("success");
      setMessage("¡Listo! Te avisamos cuando llegue algo especial.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage((err as Error).message || "No pudimos procesar tu suscripción. Intenta de nuevo.");
    }
  };

  return (
    <section className="bg-[#0D0D0D] py-24">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-[9px] uppercase tracking-[0.3em] text-[#C9A96E] mb-6">
          Newsletter Essentia
        </p>
        <h2 className="font-serif text-4xl sm:text-5xl font-light text-white leading-tight mb-5">
          Sé el primero en saberlo
        </h2>
        <p className="text-sm text-[#6B6B6B] leading-relaxed mb-10 max-w-md mx-auto">
          Nuevas llegadas, ofertas exclusivas y guías de fragancia. Directo a tu correo.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            disabled={status === "loading" || status === "success"}
            className="flex-1 bg-transparent border border-white/30 px-4 py-3 text-sm text-white placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#C9A96E] transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === "loading" || status === "success"}
            className="btn-primary bg-[#C9A96E] text-[#0D0D0D] px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-normal disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "loading" ? "Enviando..." : "Suscribirse"}
          </button>
        </form>

        {status === "success" && (
          <p className="mt-6 text-sm text-[#C9A96E] font-serif italic">{message}</p>
        )}
        {status === "error" && (
          <p className="mt-6 text-sm text-red-400">{message}</p>
        )}
      </div>
    </section>
  );
}
