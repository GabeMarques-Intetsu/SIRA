"use client";

/**
 * Passo 4 — Revisar e confirmar (CA14): resumo de tudo o que foi escolhido +
 * aviso de que a reserva vai para aprovação. Mostra a quantidade de ocorrências
 * geradas pela recorrência (CA18 — o conflito por ocorrência é reportado após
 * a confirmação, pois depende de re-checagem no servidor).
 */
import { expandReservationDates } from "@/lib/reservation";
import type { WizardState } from "./types";

interface StepConfirmProps {
  state: WizardState;
}

const RECURRENCE_LABEL: Record<string, string> = {
  none: "Sem recorrência (reserva única)",
  daily: "Diária",
  weekly: "Semanal",
  custom: "Personalizada",
};

function formatPtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

export function StepConfirm({ state }: StepConfirmProps) {
  const dates = expandReservationDates({
    type: state.recurrenceType,
    startDate: state.date,
    count: state.recurrenceCount,
    weekdays: state.recurrenceWeekdays,
  });

  const recurrenceText =
    state.recurrenceType === "none"
      ? RECURRENCE_LABEL.none
      : `${RECURRENCE_LABEL[state.recurrenceType]} · ${dates.length} ocorrência${dates.length === 1 ? "" : "s"}`;

  return (
    <div className="gap-md flex flex-col">
      <dl className="divide-outline-variant divide-y">
        <Row label="Tipo">
          {state.kind === "equipment" ? "Equipamento" : "Sala / Auditório"}
        </Row>
        <Row label="Recurso">{state.resourceLabel ?? "—"}</Row>
        <Row label="Data inicial">
          {state.date ? formatPtDate(state.date) : "—"}
        </Row>
        <Row label="Horário">
          {state.start} – {state.end}
        </Row>
        <Row label="Finalidade">{state.purpose || "—"}</Row>
        <Row label="Recorrência">{recurrenceText}</Row>
      </dl>

      {state.recurrenceType !== "none" && dates.length > 1 && (
        <details className="bg-surface-container-low p-md rounded-lg">
          <summary className="text-label-md text-on-surface cursor-pointer">
            Ver as {dates.length} datas
          </summary>
          <ul className="mt-sm gap-xs text-body-sm text-on-surface-variant flex flex-col">
            {dates.map((d) => (
              <li key={d}>{formatPtDate(d)}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="bg-tertiary-fixed/40 border-tertiary/30 p-md gap-sm flex items-start rounded-md border">
        <span
          className="material-symbols-outlined text-tertiary"
          style={{ fontSize: 18 }}
          aria-hidden="true"
        >
          info
        </span>
        <span className="text-body-sm text-on-surface">
          Esta reserva será enviada para aprovação do coordenador antes de
          aparecer no calendário.
        </span>
      </div>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-sm gap-md flex justify-between">
      <dt className="text-on-surface-variant text-body-sm">{label}</dt>
      <dd className="text-on-surface text-body-sm text-right font-medium">
        {children}
      </dd>
    </div>
  );
}
