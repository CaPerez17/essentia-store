"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/stores/cart-store";
import { useMiniCartStore } from "@/stores/mini-cart-store";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

// ------------------------------------------------------------------
// Quiz data
// ------------------------------------------------------------------

type Answers = {
  style: string;
  moment: string;
  ambience: string;
  intensity: number;
  target: string;
  budget: string;
};

const EMPTY_ANSWERS: Answers = {
  style: "",
  moment: "",
  ambience: "",
  intensity: 5,
  target: "",
  budget: "",
};

const STYLE_OPTIONS = [
  { key: "misterioso", icon: "🖤", label: "Misterioso y oscuro" },
  { key: "fresco", icon: "☀️", label: "Fresco y natural" },
  { key: "elegante", icon: "👔", label: "Elegante y clásico" },
  { key: "atrevido", icon: "🔥", label: "Atrevido y sensual" },
];

const MOMENT_OPTIONS = [
  { key: "dia", icon: "🌅", label: "Día a día, trabajo" },
  { key: "noche", icon: "🌙", label: "Noches especiales" },
  { key: "aventura", icon: "🏖", label: "Aventuras y viajes" },
  { key: "romance", icon: "💑", label: "Citas y romance" },
];

const AMBIENCE_OPTIONS = [
  { key: "biblioteca", bg: "#2C1810", label: "Biblioteca antigua · Cuero y madera" },
  { key: "bosque", bg: "#1A2415", label: "Bosque después de la lluvia" },
  { key: "jardin", bg: "#2A1525", label: "Jardín en flor · Primavera" },
  { key: "playa", bg: "#101E2A", label: "Playa al amanecer · Brisa marina" },
  { key: "zoco", bg: "#251508", label: "Zoco árabe · Especias e incienso" },
];

const TARGET_OPTIONS = [
  { key: "hombre", label: "Para mí — hombre" },
  { key: "mujer", label: "Para mí — mujer" },
  { key: "regalo-hombre", label: "Regalo para él" },
  { key: "regalo-mujer", label: "Regalo para ella" },
  { key: "sin-definir", label: "Sin definir" },
];

const BUDGET_OPTIONS = [
  { key: "<200", icon: "🌱", label: "Hasta $200.000" },
  { key: "200-400", icon: "⭐", label: "$200k – $400k" },
  { key: ">400", icon: "💎", label: "+ de $400.000" },
  { key: "sin-limite", icon: "✨", label: "Sin límite" },
];

const INTENSITY_DESCRIPTIONS = [
  "Muy suave — casi imperceptible",
  "Suave — discreto y elegante",
  "Ligero — presente sin abrumar",
  "Balanceado — lo justo",
  "Moderado — presente y sofisticado",
  "Presente — quienes te rodean lo notarán",
  "Intenso — hace declaración",
  "Muy intenso — imposible no notarlo",
  "Abrumador — para momentos épicos",
  "Extremo — persistente todo el día",
];

const LOADING_MESSAGES = [
  "Analizando tu perfil olfativo...",
  "Explorando 451 fragancias...",
  "Encontrando tu match perfecto...",
];

interface Recommendation {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  compareAt: number | null;
  imageUrl: string | null;
  matchScore: number;
  personalizedReason: string;
}

interface QuizResult {
  olfactoryProfile: string;
  profileDescription: string;
  recommendations: Recommendation[];
}

// ------------------------------------------------------------------
// Quiz component
// ------------------------------------------------------------------

export function PerfumeQuiz() {
  const [step, setStep] = useState(0); // 0 = intro, 1-6 = questions, 7 = loading, 8 = result
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [loading, setLoading] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [shareDownloading, setShareDownloading] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const addItem = useCartStore((s) => s.addItem);
  const openMiniCart = useMiniCartStore((s) => s.open);

  const goNext = () => setStep((s) => s + 1);
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const canAdvance = (() => {
    switch (step) {
      case 1:
        return answers.style !== "";
      case 2:
        return answers.moment !== "";
      case 3:
        return answers.ambience !== "";
      case 4:
        return true; // intensity slider always has value
      case 5:
        return answers.target !== "";
      case 6:
        return answers.budget !== "";
      default:
        return true;
    }
  })();

  const submit = async () => {
    setLoading(true);
    setError(null);
    setStep(7); // loading view

    const msgTimer = setInterval(() => {
      setLoadingIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1800);

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No pudimos procesar tu quiz.");
        setStep(6);
      } else {
        setResult(json as QuizResult);
        setStep(8);
      }
    } catch {
      setError("No pudimos conectar con el servidor.");
      setStep(6);
    } finally {
      clearInterval(msgTimer);
      setLoading(false);
    }
  };

  const handleAddToCart = (r: Recommendation) => {
    addItem({
      productId: r.id,
      slug: r.slug,
      name: r.name,
      brand: r.brand,
      price: r.price,
      image: r.imageUrl ?? undefined,
      quantity: 1,
    });
    openMiniCart();
  };

  const restart = () => {
    setAnswers(EMPTY_ANSWERS);
    setResult(null);
    setError(null);
    setStep(0);
  };

  const downloadShareCard = async () => {
    if (!shareCardRef.current || !result) return;
    setShareDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: "#0D0D0D",
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `essentia-perfil-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("share error", err);
    } finally {
      setShareDownloading(false);
    }
  };

  const shareToWhatsApp = () => {
    if (!result) return;
    const topPick = result.recommendations[0];
    const text = encodeURIComponent(
      `Descubrí mi perfil olfativo en Essentia: ${result.olfactoryProfile}.\n\nMi fragancia recomendada: ${topPick?.brand ?? ""} ${topPick?.name ?? ""}\n\nHaz el quiz en https://www.essentiaperfumes.co/quiz`,
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  // Progress bar (0-7, skip intro/loading/result)
  const progressPct = step >= 1 && step <= 6 ? (step / 6) * 100 : 0;

  return (
    <div className="bg-[#0D0D0D] min-h-screen">
      {/* Progress bar */}
      {step >= 1 && step <= 6 && (
        <div className="sticky top-0 z-10 bg-[#0D0D0D] border-b border-[#1A1A1A]">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={goBack}
                className="text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B] hover:text-[#C9A96E] transition-colors"
              >
                ← Atrás
              </button>
              <div className="flex-1 h-px bg-[#1A1A1A] relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[#C9A96E] transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#C9A96E] tabular-nums">
                {step} / 6
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        {/* STEP 0 — Intro */}
        {step === 0 && (
          <div className="text-center py-20">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-6">
              Quiz olfativo · Essentia
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-white leading-[1.05] mb-6">
              ¿Cuál es tu
              <br />
              <span className="italic text-[#C9A96E]">fragancia ideal?</span>
            </h1>
            <p className="text-sm text-[#6B6B6B] max-w-md mx-auto mb-10">
              6 preguntas. 3 minutos. Una recomendación personalizada basada en IA.
            </p>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-primary bg-[#C9A96E] text-[#0D0D0D] px-10 py-4 text-[11px] uppercase tracking-[0.25em] font-normal hover:bg-white transition-colors"
            >
              Empezar →
            </button>
          </div>
        )}

        {/* STEP 1 — Style */}
        {step === 1 && (
          <QuestionBlock title="¿Cómo describes tu estilo?">
            <div className="grid grid-cols-2 gap-4">
              {STYLE_OPTIONS.map((o) => (
                <ChoiceCard
                  key={o.key}
                  icon={o.icon}
                  label={o.label}
                  active={answers.style === o.key}
                  onClick={() => setAnswers({ ...answers, style: o.key })}
                />
              ))}
            </div>
          </QuestionBlock>
        )}

        {/* STEP 2 — Moment */}
        {step === 2 && (
          <QuestionBlock title="¿En qué momento usarías tu fragancia?">
            <div className="grid grid-cols-2 gap-4">
              {MOMENT_OPTIONS.map((o) => (
                <ChoiceCard
                  key={o.key}
                  icon={o.icon}
                  label={o.label}
                  active={answers.moment === o.key}
                  onClick={() => setAnswers({ ...answers, moment: o.key })}
                />
              ))}
            </div>
          </QuestionBlock>
        )}

        {/* STEP 3 — Ambience */}
        {step === 3 && (
          <QuestionBlock title="¿Qué ambiente te inspira más?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AMBIENCE_OPTIONS.map((o) => {
                const active = answers.ambience === o.key;
                return (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setAnswers({ ...answers, ambience: o.key })}
                    className={`relative aspect-[2/1] overflow-hidden border transition-all duration-300 ${
                      active
                        ? "border-[#C9A96E] ring-2 ring-[#C9A96E]/40"
                        : "border-[#1A1A1A] hover:border-[#C9A96E]/50"
                    }`}
                    style={{ backgroundColor: o.bg }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center px-4">
                      <p className="font-serif text-sm sm:text-base text-white text-center leading-snug">
                        {o.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </QuestionBlock>
        )}

        {/* STEP 4 — Intensity slider */}
        {step === 4 && (
          <QuestionBlock title="¿Qué intensidad prefieres?">
            <div className="max-w-xl mx-auto">
              <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B] mb-4">
                <span>Suave</span>
                <span>Intenso</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={answers.intensity}
                onChange={(e) =>
                  setAnswers({ ...answers, intensity: parseInt(e.target.value, 10) })
                }
                className="w-full accent-[#C9A96E]"
              />
              <div className="mt-6 text-center">
                <p className="text-3xl font-serif text-[#C9A96E] mb-2">
                  {answers.intensity} / 10
                </p>
                <p className="text-sm text-[#6B6B6B] italic">
                  {INTENSITY_DESCRIPTIONS[answers.intensity - 1]}
                </p>
              </div>
            </div>
          </QuestionBlock>
        )}

        {/* STEP 5 — Target */}
        {step === 5 && (
          <QuestionBlock title="¿Para quién es?">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
              {TARGET_OPTIONS.map((o) => (
                <ChoiceCard
                  key={o.key}
                  label={o.label}
                  active={answers.target === o.key}
                  onClick={() => setAnswers({ ...answers, target: o.key })}
                />
              ))}
            </div>
          </QuestionBlock>
        )}

        {/* STEP 6 — Budget */}
        {step === 6 && (
          <QuestionBlock title="¿Cuál es tu rango de presupuesto?">
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              {BUDGET_OPTIONS.map((o) => (
                <ChoiceCard
                  key={o.key}
                  icon={o.icon}
                  label={o.label}
                  active={answers.budget === o.key}
                  onClick={() => setAnswers({ ...answers, budget: o.key })}
                />
              ))}
            </div>
            {error && (
              <p className="mt-6 text-center text-sm text-red-400">{error}</p>
            )}
          </QuestionBlock>
        )}

        {/* Nav buttons for steps 1-6 */}
        {step >= 1 && step <= 6 && (
          <div className="mt-12 flex justify-center">
            {step < 6 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvance}
                className="btn-primary bg-[#C9A96E] text-[#0D0D0D] px-10 py-3.5 text-[10px] uppercase tracking-[0.25em] font-normal hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente →
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!canAdvance || loading}
                className="btn-primary bg-[#C9A96E] text-[#0D0D0D] px-10 py-3.5 text-[10px] uppercase tracking-[0.25em] font-normal hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Ver mi match →
              </button>
            )}
          </div>
        )}

        {/* STEP 7 — Loading */}
        {step === 7 && (
          <div className="text-center py-32">
            <div className="flex justify-center gap-3 mb-10">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="w-3 h-3 rounded-full bg-[#C9A96E]"
                  style={{
                    animation: "pulse 1.4s ease-in-out infinite",
                    animationDelay: `${i * 0.18}s`,
                  }}
                />
              ))}
            </div>
            <p className="font-serif italic text-xl text-white mb-2">
              {LOADING_MESSAGES[loadingIdx]}
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">
              Esto toma unos segundos
            </p>
          </div>
        )}

        {/* STEP 8 — Result */}
        {step === 8 && result && (
          <div>
            {/* Profile header */}
            <div className="text-center mb-14">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-4">
                Tu perfil olfativo
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-tight mb-5">
                {result.olfactoryProfile}
              </h2>
              <p className="font-serif italic text-base text-[#C9A96E]/80 max-w-2xl mx-auto leading-relaxed">
                {result.profileDescription}
              </p>
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-16">
                {result.recommendations.map((r, i) => {
                  const isBest = i === 0;
                  return (
                    <div
                      key={r.slug}
                      className={`relative bg-[#1A1A1A] p-5 ${
                        isBest
                          ? "border-2 border-[#C9A96E] lg:-mt-4"
                          : "border border-[#2A2A2A]"
                      }`}
                    >
                      {isBest && (
                        <span className="absolute -top-3 left-5 text-[9px] uppercase tracking-[0.25em] text-[#0D0D0D] bg-[#C9A96E] px-3 py-1">
                          Match perfecto
                        </span>
                      )}

                      {/* Image */}
                      <Link
                        href={`/p/${r.slug}`}
                        className="block aspect-[3/4] bg-[#0D0D0D] overflow-hidden mb-4"
                      >
                        {r.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.imageUrl}
                            alt={r.name}
                            className="h-full w-full object-contain p-4"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] uppercase tracking-widest text-[#6B6B6B]">
                            {r.brand}
                          </div>
                        )}
                      </Link>

                      <p className="text-[9px] uppercase tracking-[0.2em] text-[#C9A96E] mb-1">
                        {r.brand}
                      </p>
                      <h3 className="font-serif text-lg text-white mb-3 leading-tight">
                        {r.name}
                      </h3>

                      {/* Match score circle */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="relative w-10 h-10">
                          <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                            <circle cx="18" cy="18" r="15" fill="none" stroke="#2A2A2A" strokeWidth="3" />
                            <circle
                              cx="18"
                              cy="18"
                              r="15"
                              fill="none"
                              stroke="#C9A96E"
                              strokeWidth="3"
                              strokeDasharray={`${(r.matchScore / 100) * 94} 94`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[10px] text-[#C9A96E] tabular-nums">
                            {r.matchScore}
                          </span>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-[0.2em] text-[#6B6B6B]">
                            Tu match
                          </p>
                          <p className="text-xs text-[#C9A96E]">{r.matchScore}%</p>
                        </div>
                      </div>

                      <p className="text-xs text-[#6B6B6B] leading-relaxed mb-4 italic min-h-[48px]">
                        &ldquo;{r.personalizedReason}&rdquo;
                      </p>

                      <p className="text-sm text-white mb-4">{fmt(r.price)}</p>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(r)}
                          className="btn-primary flex-1 bg-[#C9A96E] text-[#0D0D0D] px-3 py-2 text-[10px] uppercase tracking-[0.2em] hover:bg-white transition-colors"
                        >
                          Agregar
                        </button>
                        <Link
                          href={`/p/${r.slug}`}
                          className="border border-[#2A2A2A] px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[#C9A96E] hover:border-[#C9A96E] transition-colors"
                        >
                          Ver más
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Share section */}
            <div className="border-t border-[#1A1A1A] pt-12">
              <div className="text-center mb-8">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-3">
                  Compártelo
                </p>
                <h3 className="font-serif text-2xl text-white mb-2">
                  Tu tarjeta olfativa
                </h3>
                <p className="text-xs text-[#6B6B6B]">
                  Guárdala como imagen o compártela por WhatsApp
                </p>
              </div>

              {/* Shareable card (rendered, canvas captures this node) */}
              <div
                ref={shareCardRef}
                className="mx-auto max-w-sm bg-[#0D0D0D] border border-[#C9A96E] p-8"
              >
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-4 text-center">
                  Essentia · Quiz olfativo
                </p>
                <p className="text-xs text-[#6B6B6B] uppercase tracking-[0.15em] text-center mb-2">
                  Mi fragancia ideal es
                </p>
                <h4 className="font-serif text-2xl text-white leading-tight text-center mb-1">
                  {result.recommendations[0]?.brand}
                </h4>
                <p className="font-serif text-xl italic text-[#C9A96E] text-center mb-6">
                  {result.recommendations[0]?.name}
                </p>
                <div className="border-t border-[#1A1A1A] my-5" />
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B] text-center mb-1">
                  Perfil olfativo
                </p>
                <p className="font-serif text-lg text-white text-center mb-6">
                  {result.olfactoryProfile}
                </p>
                <p className="text-[9px] uppercase tracking-[0.25em] text-[#C9A96E] text-center">
                  essentiaperfumes.co/quiz
                </p>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={downloadShareCard}
                  disabled={shareDownloading}
                  className="btn-primary bg-[#C9A96E] text-[#0D0D0D] px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:bg-white disabled:opacity-60 transition-colors"
                >
                  {shareDownloading ? "Generando..." : "Descargar tarjeta ↓"}
                </button>
                <button
                  type="button"
                  onClick={shareToWhatsApp}
                  className="btn-primary bg-[#25D366] text-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:brightness-110 transition"
                >
                  Compartir por WhatsApp
                </button>
                <button
                  type="button"
                  onClick={restart}
                  className="border border-[#2A2A2A] text-[#C9A96E] px-6 py-3 text-[10px] uppercase tracking-[0.2em] hover:border-[#C9A96E] transition-colors"
                >
                  Hacer quiz de nuevo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------

function QuestionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-serif text-3xl sm:text-4xl font-light text-white text-center mb-12 max-w-xl mx-auto leading-tight">
        {title}
      </h2>
      {children}
    </div>
  );
}

function ChoiceCard({
  icon,
  label,
  active,
  onClick,
}: {
  icon?: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center text-center gap-3 p-6 border transition-colors duration-200 ${
        active
          ? "bg-[#C9A96E]/10 border-[#C9A96E] text-white"
          : "bg-[#1A1A1A] border-[#2A2A2A] text-[#6B6B6B] hover:border-[#C9A96E]/40 hover:text-white"
      }`}
    >
      {icon && <span className="text-3xl" aria-hidden>{icon}</span>}
      <span className="text-sm">{label}</span>
    </button>
  );
}
