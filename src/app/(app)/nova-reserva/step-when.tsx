"use client";

/**
 * Passo 2 — Quando (CA01/CA02/CA03 + CA17): data, horário, recorrência e
 * finalidade. A validação do slot é exibida inline com role="alert" e bloqueia
 * o avanço (o controle de navegação vive no wizard, que lê `validateSlot`).
 */
import { useId } from "react";
import {
  SLOT_ERROR_MESSAGE,
  validateSlot,
  type RecurrenceType,
} from "@/lib/reservation";
import type { WizardState } from "./types";

interface StepWhenProps {
  state: WizardState;
  patch: (partial: Partial<WizardState>) => void;
  /** Mostra erros somente após tentativa de avançar (evita ruído inicial). */
  showErrors: boolean;
  todayIso: string;
}

const RECURRENCES: { value: RecurrenceType; label: string }[] = [
  { value: "none", label: "Não" },
  { value: "daily", label: "Diária" },
  { value: "weekly", label: "Semanal" },
  { value: "custom", label: "Personalizada" },
];

const WEEKDAYS = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

export function StepWhen({
  state,
  patch,
  showErrors,
  todayIso,
}: StepWhenProps) {
  const ids = useId();
  const error = validateSlot({
    date: state.date,
    start: state.start,
    end: state.end,
  });
  const showError = showErrors && error;

  const toggleWeekday = (wd: number) => {
    const set = new Set(state.recurrenceWeekdays);
    if (set.has(wd)) set.delete(wd);
    else set.add(wd);
    patch({ recurrenceWeekdays: [...set] });
  };

  return (
    <div className="gap-md flex flex-col">
      <div className="gap-md grid grid-cols-1 md:grid-cols-3">
        <div className="gap-xs flex flex-col">
          <label
            htmlFor={`${ids}-date`}
            className="text-label-sm text-on-surface"
          >
            Data
          </label>
          <input
            id={`${ids}-date`}
            type="date"
            min={todayIso}
            value={state.date}
            onChange={(e) => patch({ date: e.target.value })}
            aria-invalid={
              showError && error?.startsWith("date") ? true : undefined
            }
            className="px-md border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-md rounded-lg border py-2 outline-none focus:ring-2"
          />
        </div>
        <div className="gap-xs flex flex-col">
          <label
            htmlFor={`${ids}-start`}
            className="text-label-sm text-on-surface"
          >
            Horário inicial
          </label>
          <input
            id={`${ids}-start`}
            type="time"
            value={state.start}
            onChange={(e) => patch({ start: e.target.value })}
            className="px-md border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-md rounded-lg border py-2 outline-none focus:ring-2"
          />
        </div>
        <div className="gap-xs flex flex-col">
          <label
            htmlFor={`${ids}-end`}
            className="text-label-sm text-on-surface"
          >
            Horário final
          </label>
          <input
            id={`${ids}-end`}
            type="time"
            value={state.end}
            onChange={(e) => patch({ end: e.target.value })}
            className="px-md border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-md rounded-lg border py-2 outline-none focus:ring-2"
          />
        </div>
      </div>

      {showError && (
        <p
          role="alert"
          className="text-body-sm text-on-error-container bg-error-container px-md gap-xs flex items-center rounded-lg py-2"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18 }}
            aria-hidden="true"
          >
            error
          </span>
          {SLOT_ERROR_MESSAGE[error]}
        </p>
      )}

      {/* Recorrência (CA17) */}
      <div className="bg-surface-container-low p-md gap-sm flex flex-col rounded-lg">
        <span className="text-label-md text-on-surface" id={`${ids}-rec`}>
          Recorrência
        </span>
        <div
          role="radiogroup"
          aria-labelledby={`${ids}-rec`}
          className="gap-xs flex flex-wrap"
        >
          {RECURRENCES.map((r) => {
            const selected = state.recurrenceType === r.value;
            return (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => patch({ recurrenceType: r.value })}
                className={`px-md text-label-md rounded-full py-1.5 transition-colors ${
                  selected
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {state.recurrenceType !== "none" && (
          <div className="gap-md mt-1 flex flex-col">
            {state.recurrenceType === "custom" ? (
              <fieldset className="gap-xs flex flex-col">
                <legend className="text-label-sm text-on-surface-variant">
                  Dias da semana
                </legend>
                <div className="gap-xs flex flex-wrap">
                  {WEEKDAYS.map((d) => {
                    const on = state.recurrenceWeekdays.includes(d.value);
                    return (
                      <button
                        key={d.value}
                        type="button"
                        role="checkbox"
                        aria-checked={on}
                        onClick={() => toggleWeekday(d.value)}
                        className={`text-label-md h-9 w-12 rounded-full transition-colors ${
                          on
                            ? "bg-secondary text-on-secondary"
                            : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}

            <div className="gap-xs flex flex-col">
              <label
                htmlFor={`${ids}-count`}
                className="text-label-sm text-on-surface-variant"
              >
                {state.recurrenceType === "weekly" ||
                state.recurrenceType === "custom"
                  ? "Por quantas semanas"
                  : "Por quantos dias"}
              </label>
              <input
                id={`${ids}-count`}
                type="number"
                min={1}
                max={60}
                value={state.recurrenceCount}
                onChange={(e) =>
                  patch({
                    recurrenceCount: Math.max(
                      1,
                      Math.min(60, Number(e.target.value) || 1),
                    ),
                  })
                }
                className="px-md border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-md w-28 rounded-lg border py-2 outline-none focus:ring-2"
              />
            </div>
          </div>
        )}
      </div>

      <div className="gap-xs flex flex-col">
        <label
          htmlFor={`${ids}-purpose`}
          className="text-label-sm text-on-surface"
        >
          Finalidade
        </label>
        <input
          id={`${ids}-purpose`}
          type="text"
          value={state.purpose}
          onChange={(e) => patch({ purpose: e.target.value })}
          placeholder="Ex.: Aula POO — Turma 2024.2"
          className="px-md border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-variant/60 focus:ring-primary text-body-md rounded-lg border py-2 outline-none focus:ring-2"
        />
      </div>
    </div>
  );
}
