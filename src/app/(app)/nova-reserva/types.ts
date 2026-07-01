import type { RecurrenceType, ResourceKind } from "@/lib/reservation";
import type { RoomResult, EquipmentResult } from "./actions";

/** Estado completo do wizard (preservado ao voltar — CA13). */
export interface WizardState {
  kind: ResourceKind | null; // passo 1
  date: string; // passo 2 (quando)
  start: string;
  end: string;
  purpose: string;
  recurrenceType: RecurrenceType;
  recurrenceCount: number;
  recurrenceWeekdays: number[];
  resourceId: string | null; // passo 3
  /** Snapshot do recurso escolhido, para o resumo (passo 4) sem refetch. */
  resourceLabel: string | null;
}

export type { RoomResult, EquipmentResult };

export const INITIAL_STATE: WizardState = {
  kind: null,
  date: "",
  start: "",
  end: "",
  purpose: "",
  recurrenceType: "none",
  recurrenceCount: 4,
  recurrenceWeekdays: [],
  resourceId: null,
  resourceLabel: null,
};
