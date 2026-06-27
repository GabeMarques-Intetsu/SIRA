import type { Metadata } from "next";
import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { NovaReservaWizard } from "./wizard";

export const metadata: Metadata = { title: "Nova Reserva · SIRA" };

/**
 * Nova Reserva (F-14 / RF-006). Server Component: garante a sessão (RBAC) e
 * renderiza o shell do assistente. Todo o estado do wizard e a interação vivem
 * no client (`NovaReservaWizard`); a busca de disponibilidade e a criação são
 * Server Actions RLS-safe (ver `actions.ts`).
 *
 * ESCOPO (v1): cobre F-14 (busca com conflito + assistente 4 passos +
 * recorrência). A reserva express de 1 clique (F-15) fica para depois — esta
 * tela não a implementa, mas também não a impede.
 */
export default async function NovaReservaPage() {
  await requireProfile();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
      <header className="gap-md mb-2 flex items-start justify-between">
        <div>
          <h1 className="text-headline-sm text-on-surface">Nova Reserva</h1>
          <p className="text-body-sm text-on-surface-variant hidden md:block">
            Assistente guiado em 4 etapas
          </p>
        </div>
        <Link
          href="/calendario"
          className="text-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container px-md gap-xs flex items-center rounded-lg py-2"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18 }}
            aria-hidden="true"
          >
            close
          </span>
          Cancelar
        </Link>
      </header>

      <NovaReservaWizard />
    </div>
  );
}
