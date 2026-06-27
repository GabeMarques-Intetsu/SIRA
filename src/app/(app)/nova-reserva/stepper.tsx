"use client";

/**
 * Stepper acessível do wizard (CA12). Renderiza os 4 passos como uma lista
 * ordenada; o passo atual recebe `aria-current="step"`. Passos ainda não
 * alcançáveis ficam `aria-disabled` (CA13 — só avança quando o atual é válido).
 * Concluídos mostram o ícone "check" (Material Symbols — sem emoji).
 */

export interface StepMeta {
  label: string;
}

interface StepperProps {
  steps: StepMeta[];
  /** Índice 0-based do passo atual. */
  current: number;
  /** Maior índice já alcançado (para marcar futuros como desabilitados). */
  maxReached: number;
}

export function Stepper({ steps, current, maxReached }: StepperProps) {
  return (
    <ol aria-label="Progresso do wizard" className="gap-xs flex items-start">
      {steps.map((step, i) => {
        const isCurrent = i === current;
        const isDone = i < current;
        const isReachable = i <= maxReached;

        const circle = isDone
          ? "bg-secondary text-on-secondary"
          : isCurrent
            ? "bg-primary text-on-primary"
            : "bg-surface-container-high text-on-surface-variant";

        const labelClass = isCurrent
          ? "text-primary font-bold"
          : isDone
            ? "text-on-surface"
            : "text-on-surface-variant";

        return (
          <li
            key={step.label}
            className="gap-xs flex flex-1 flex-col items-center text-center"
            aria-current={isCurrent ? "step" : undefined}
            aria-disabled={!isReachable || undefined}
          >
            <div className="flex w-full items-center">
              <span
                className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : isDone || isCurrent ? "bg-secondary" : "bg-outline-variant"}`}
                aria-hidden="true"
              />
              <span
                className={`text-label-md flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-bold ${circle}`}
              >
                {isDone ? (
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 20 }}
                    aria-hidden="true"
                  >
                    check
                  </span>
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`h-0.5 flex-1 ${i === steps.length - 1 ? "bg-transparent" : isDone ? "bg-secondary" : "bg-outline-variant"}`}
                aria-hidden="true"
              />
            </div>
            <span className={`text-label-sm ${labelClass}`}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
