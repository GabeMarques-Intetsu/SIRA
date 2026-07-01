"use client";

/**
 * Botão "Adicionar usuário" (F-28 · mockup 09). O cadastro DIRETO cria a conta de
 * acesso, o que exige a admin API do Supabase (service-role) — indisponível neste
 * ambiente (ver TODO de provisionamento em actions.ts). Em vez de simular uma
 * criação que não habilita o login, abrimos um diálogo acessível explicando o
 * caminho correto (auto-serviço + aprovação). Mantém a UI fiel ao mockup sem
 * prometer um efeito que o backend ainda não suporta com segurança.
 */
import { useEffect, useRef, useState } from "react";

export function NewUserButton() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-md bg-primary text-on-primary hover:bg-surface-tint text-label-md gap-xs flex items-center rounded-lg py-2"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18 }}
          aria-hidden="true"
        >
          person_add
        </span>
        Adicionar usuário
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Fechar"
            tabIndex={-1}
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-user-title"
            className="bg-surface-container-lowest border-outline-variant p-lg gap-md relative flex w-full max-w-[30rem] flex-col rounded-t-xl border shadow-lg sm:rounded-xl"
          >
            <h2
              id="new-user-title"
              className="text-headline-sm text-on-surface"
            >
              Adicionar usuário
            </h2>
            <p className="text-body-md text-on-surface-variant">
              O cadastro direto cria a conta de acesso e, por segurança, depende
              da API administrativa do Supabase (ainda não configurada neste
              ambiente). Enquanto isso, o caminho recomendado é o auto-serviço
              de cadastro do professor — a solicitação aparece na aba{" "}
              <strong className="text-on-surface">Solicitações</strong> para
              você aprovar.
            </p>
            <div className="flex justify-end">
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                className="px-md bg-primary text-on-primary text-label-md rounded-lg py-2"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
