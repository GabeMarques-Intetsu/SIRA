"use client";

/**
 * Passo 1 — Tipo de recurso (CA15): sala/auditório ou equipamento.
 * Implementado como radiogroup acessível (cartões selecionáveis por teclado).
 */
import type { ResourceKind } from "@/lib/reservation";

interface StepTypeProps {
  value: ResourceKind | null;
  onChange: (kind: ResourceKind) => void;
}

const OPTIONS: {
  kind: ResourceKind;
  icon: string;
  title: string;
  hint: string;
}[] = [
  {
    kind: "room",
    icon: "meeting_room",
    title: "Sala / Auditório",
    hint: "Espaços físicos",
  },
  {
    kind: "equipment",
    icon: "videocam",
    title: "Equipamento",
    hint: "Projetores, notebooks, etc.",
  },
];

export function StepType({ value, onChange }: StepTypeProps) {
  return (
    <fieldset>
      <legend className="sr-only">Tipo de recurso</legend>
      <div
        role="radiogroup"
        aria-label="Tipo de recurso"
        className="gap-md grid grid-cols-1 sm:grid-cols-2"
      >
        {OPTIONS.map((opt) => {
          const selected = value === opt.kind;
          return (
            <button
              key={opt.kind}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.kind)}
              className={`p-md focus-visible:ring-primary flex flex-col items-center gap-1 rounded-xl border-2 text-center transition-colors outline-none focus-visible:ring-2 ${
                selected
                  ? "border-primary bg-primary-fixed/40"
                  : "border-outline-variant bg-surface hover:bg-surface-container-low"
              }`}
            >
              <span
                className={`material-symbols-outlined ${selected ? "text-primary" : "text-on-surface-variant"}`}
                style={{ fontSize: 32 }}
                aria-hidden="true"
              >
                {opt.icon}
              </span>
              <span className="text-body-md text-on-surface font-medium">
                {opt.title}
              </span>
              <span className="text-body-sm text-on-surface-variant">
                {opt.hint}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
