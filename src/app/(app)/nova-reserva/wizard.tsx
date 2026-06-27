"use client";

/**
 * Orquestrador do wizard de Nova Reserva (F-14 — CA12..CA19).
 *
 * - Estado único e preservado ao voltar (CA13).
 * - Cada passo só libera o próximo quando válido (CA13).
 * - Renderiza APENAS o passo atual (performance: não monta os 4 de uma vez,
 *   evitando trabalho/JS desnecessário; o passo "Escolher" só busca quando ativo).
 * - Foco movido para o título do passo a cada transição (a11y).
 */
import { useCallback, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  expandReservationDates,
  todayIso,
  validateSlot,
} from "@/lib/reservation";
import {
  createHoldAction,
  createReservationAction,
  releaseHoldAction,
  type HoldInput,
} from "./actions";
import { Stepper } from "./stepper";
import { StepType } from "./step-type";
import { StepWhen } from "./step-when";
import { StepChoose } from "./step-choose";
import { StepConfirm } from "./step-confirm";
import { INITIAL_STATE, type WizardState } from "./types";

const STEPS = [
  { label: "Tipo" },
  { label: "Quando" },
  { label: "Escolher" },
  { label: "Confirmar" },
];

const STEP_TITLES = [
  "Tipo de recurso",
  "Quando",
  "Escolha o recurso",
  "Confirmar reserva",
];

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; message: string }
  | { status: "success"; created: number; conflicts: string[] };

export function NovaReservaWizard() {
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [showWhenErrors, setShowWhenErrors] = useState(false);
  const [state, setState] = useState<WizardState>(INITIAL_STATE);
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });
  // F-49 — reserva temporária (hold): true quando o recurso está bloqueado
  // para o solicitante enquanto ele revisa a confirmação.
  const [holdActive, setHoldActive] = useState(false);
  const [holdPending, startHoldTransition] = useTransition();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const today = todayIso();

  const CONFIRM_STEP = STEPS.length - 1; // passo final (revisão)

  /**
   * Monta o input do hold a partir do estado atual: cobre todas as datas
   * expandidas pela recorrência (F-49 — recorrência). Retorna null se faltar
   * recurso/tipo (não há o que bloquear).
   */
  const buildHoldInput = useCallback((s: WizardState): HoldInput | null => {
    if (!s.kind || !s.resourceId) return null;
    const dates = expandReservationDates({
      type: s.recurrenceType,
      startDate: s.date,
      count: s.recurrenceCount,
      weekdays: s.recurrenceWeekdays,
    });
    if (dates.length === 0) return null;
    return {
      kind: s.kind,
      resourceId: s.resourceId,
      dates,
      start: s.start,
      end: s.end,
    };
  }, []);

  const releaseHold = useCallback(() => {
    if (!holdActive) return;
    const input = buildHoldInput(state);
    setHoldActive(false);
    if (input) void releaseHoldAction(input);
  }, [holdActive, buildHoldInput, state]);

  const patch = useCallback(
    (partial: Partial<WizardState>) =>
      setState((prev) => ({ ...prev, ...partial })),
    [],
  );

  // Validade do passo atual (controla o botão "Continuar" — CA13).
  const slotError = validateSlot({
    date: state.date,
    start: state.start,
    end: state.end,
  });
  const stepValid = [
    state.kind !== null, // passo 1
    slotError === null, // passo 2
    state.resourceId !== null, // passo 3
    true, // passo 4
  ][step];

  const focusHeading = () =>
    requestAnimationFrame(() => headingRef.current?.focus());

  const goTo = (next: number) => {
    setStep(next);
    setMaxReached((m) => Math.max(m, next));
    focusHeading();
  };

  const handleNext = () => {
    if (step === 1 && slotError) {
      setShowWhenErrors(true); // revela o aviso e bloqueia (CA13)
      return;
    }
    if (!stepValid) return;
    if (step < STEPS.length - 1) {
      const next = step + 1;
      // Ao entrar na confirmação (passo final) com um recurso escolhido,
      // cria o hold temporário (F-49 — ADR-009). Não bloqueia a navegação:
      // a transição roda em background e o aviso reflete o estado.
      if (next === CONFIRM_STEP) {
        const input = buildHoldInput(state);
        if (input) {
          startHoldTransition(async () => {
            const res = await createHoldAction(input);
            setHoldActive(res.ok);
          });
        }
      }
      goTo(next);
    }
  };

  const handleBack = () => {
    if (step === 0) return;
    // Sair da confirmação sem enviar libera o recurso já (não espera o TTL).
    if (step === CONFIRM_STEP) releaseHold();
    goTo(step - 1); // dados preservados (CA13)
  };

  const handleConfirm = async () => {
    if (!state.kind || !state.resourceId) return;
    setSubmit({ status: "submitting" });
    const res = await createReservationAction({
      kind: state.kind,
      resourceId: state.resourceId,
      start: state.start,
      end: state.end,
      purpose: state.purpose,
      recurrence: {
        type: state.recurrenceType,
        startDate: state.date,
        count: state.recurrenceCount,
        weekdays: state.recurrenceWeekdays,
      },
    });
    if (!res.ok) {
      setSubmit({
        status: "error",
        message: res.error ?? "Não foi possível criar a reserva.",
      });
      return;
    }
    // O envio já removeu o hold no servidor (a reserva pending passa a
    // bloquear). Limpamos o estado local para não re-liberar à toa.
    setHoldActive(false);
    setSubmit({
      status: "success",
      created: res.created,
      conflicts: res.conflicts,
    });
    focusHeading();
  };

  if (submit.status === "success") {
    return (
      <SuccessPanel created={submit.created} conflicts={submit.conflicts} />
    );
  }

  return (
    <div className="gap-lg flex flex-col">
      <Stepper steps={STEPS} current={step} maxReached={maxReached} />

      <section
        aria-label={`Etapa ${step + 1} de 4 — ${STEP_TITLES[step]}`}
        className="bg-surface-container-lowest border-primary p-md md:p-lg gap-md flex flex-col rounded-xl border-2 shadow-sm"
      >
        <div className="gap-sm flex items-center">
          <span className="bg-primary text-on-primary text-label-sm rounded-full px-2 py-0.5">
            Etapa {step + 1} de 4
          </span>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-headline-sm text-on-surface outline-none"
          >
            {STEP_TITLES[step]}
          </h2>
        </div>

        {step === 0 && (
          <StepType value={state.kind} onChange={(kind) => patch({ kind })} />
        )}
        {step === 1 && (
          <StepWhen
            state={state}
            patch={patch}
            showErrors={showWhenErrors}
            todayIso={today}
          />
        )}
        {step === 2 && <StepChoose state={state} patch={patch} />}
        {step === 3 && (
          <>
            <StepConfirm state={state} />
            {/* F-49 — aviso da reserva temporária (a11y: role="status",
                anunciado de forma não-intrusiva; aria-busy enquanto cria). */}
            <p
              role="status"
              aria-busy={holdPending}
              className="text-body-sm text-on-tertiary-container bg-tertiary-container px-md gap-xs flex items-center rounded-lg py-2"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18 }}
                aria-hidden="true"
              >
                {holdPending ? "hourglass_top" : "lock_clock"}
              </span>
              {holdPending
                ? "Reservando o recurso temporariamente para você…"
                : "Recurso reservado temporariamente para você por 10 minutos enquanto conclui a solicitação."}
            </p>
          </>
        )}

        {submit.status === "error" && (
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
            {submit.message}
          </p>
        )}
      </section>

      <div className="gap-sm border-outline-variant bg-surface/95 -mx-md p-md sticky bottom-0 flex flex-col-reverse justify-between border-t backdrop-blur sm:flex-row md:mx-0 md:border-0 md:p-0">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0}
          className="px-lg border-outline-variant text-on-surface hover:bg-surface-container text-label-md gap-xs flex items-center justify-center rounded-lg border py-2.5 disabled:opacity-40"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18 }}
            aria-hidden="true"
          >
            arrow_back
          </span>
          Voltar
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={handleNext}
            disabled={!stepValid && step !== 1}
            className="px-lg bg-primary text-on-primary hover:bg-surface-tint text-label-md gap-xs flex items-center justify-center rounded-lg py-2.5 transition-all active:scale-[0.98] disabled:opacity-40"
          >
            Continuar
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18 }}
              aria-hidden="true"
            >
              arrow_forward
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submit.status === "submitting"}
            className="px-lg bg-primary text-on-primary hover:bg-surface-tint text-label-md gap-xs flex items-center justify-center rounded-lg py-2.5 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {submit.status === "submitting" ? "Enviando…" : "Confirmar reserva"}
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18 }}
              aria-hidden="true"
            >
              check
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

function SuccessPanel({
  created,
  conflicts,
}: {
  created: number;
  conflicts: string[];
}) {
  return (
    <section
      aria-label="Reserva enviada"
      className="bg-surface-container-lowest border-outline-variant p-lg gap-md flex flex-col items-center rounded-xl border text-center shadow-sm"
    >
      <span
        className="material-symbols-outlined text-secondary"
        style={{ fontSize: 48 }}
        aria-hidden="true"
      >
        task_alt
      </span>
      <h2
        tabIndex={-1}
        className="text-headline-sm text-on-surface outline-none"
        ref={(el) => el?.focus()}
      >
        {created === 1
          ? "Reserva enviada para aprovação"
          : `${created} reservas enviadas para aprovação`}
      </h2>
      <p className="text-body-md text-on-surface-variant max-w-[28rem]">
        Você será avisado quando o coordenador analisar sua solicitação.
      </p>

      {conflicts.length > 0 && (
        <p
          role="alert"
          className="text-body-sm text-on-error-container bg-error-container px-md max-w-[28rem] rounded-lg py-2"
        >
          {conflicts.length} ocorrência
          {conflicts.length === 1 ? "" : "s"} não{" "}
          {conflicts.length === 1 ? "pôde" : "puderam"} ser criada
          {conflicts.length === 1 ? "" : "s"} por conflito de horário:{" "}
          {conflicts.join(", ")}.
        </p>
      )}

      <div className="gap-sm mt-sm flex flex-wrap justify-center">
        <Link
          href="/minhas-reservas"
          className="px-lg bg-primary text-on-primary hover:bg-surface-tint text-label-md rounded-lg py-2.5"
        >
          Ver minhas reservas
        </Link>
        <Link
          href="/calendario"
          className="px-lg border-outline-variant text-on-surface hover:bg-surface-container text-label-md rounded-lg border py-2.5"
        >
          Ir para o calendário
        </Link>
      </div>
    </section>
  );
}
