import type { ScentNotes } from "@/lib/scent-notes";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface ScentPyramidProps {
  notes: ScentNotes;
}

export function ScentPyramid({ notes }: ScentPyramidProps) {
  const sections = [
    { title: "Notas de salida", label: "Top", items: notes.top },
    { title: "Notas de corazón", label: "Heart", items: notes.heart },
    { title: "Notas de fondo", label: "Base", items: notes.base },
  ];

  const delays = [100, 300, 500] as const;

  return (
    <div className="mt-10 pt-10" style={{ borderTop: "0.5px solid rgba(201,169,110,0.15)" }}>
      <ScrollReveal animation="fade-up">
        <h3 className="text-[10px] uppercase tracking-[0.25em] text-[var(--gold)] mb-8">
          Pirámide olfativa
        </h3>
      </ScrollReveal>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {sections.map((section, i) => (
          <ScrollReveal key={section.label} animation="fade-up" delay={delays[i] ?? 100}>
            <div className="border border-[var(--gold-border)] bg-[#0f0e0b] p-6 h-full">
              <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--gold)] mb-1">
                {section.label}
              </p>
              <h4 className="font-serif text-lg text-[var(--cream)] mb-4">
                {section.title}
              </h4>
              <ul className="space-y-1.5">
                {section.items.map((note) => (
                  <li
                    key={note}
                    className="text-xs text-[var(--muted)] leading-relaxed"
                  >
                    — {note}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  );
}
