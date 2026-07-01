"use client";

/**
 * Menu do usuário no header (BUG 1 — mockup 02, header). Botão com avatar
 * (iniciais) + nome que abre um dropdown acessível com:
 *  - "Configurações" → /configuracoes (torna a tela alcançável — antes não
 *    havia entrada para ela em lugar nenhum);
 *  - "Sair" (logout — reusa `signOutAction`).
 *
 * Usa o `DropdownMenu` via portal (mesmo padrão do BUG 2): sobrepõe o header e
 * o conteúdo, fecha com Esc/clique-fora, gerencia foco e tem role=menu/menuitem
 * (WCAG 2.2 AA).
 */
import { signOutAction } from "./logout-action";
import {
  DropdownItemLink,
  DropdownMenu,
  DropdownSeparator,
} from "@/components/ui/dropdown-menu";

interface UserMenuProps {
  fullName: string;
  initials: string;
}

export function UserMenu({ fullName, initials }: UserMenuProps) {
  return (
    <DropdownMenu
      align="end"
      menuClassName="w-[14rem]"
      triggerLabel={`Menu do usuário ${fullName}`}
      menuLabel={`Menu do usuário ${fullName}`}
      triggerClassName="gap-sm hover:bg-surface-container ml-sm flex items-center rounded-full px-sm py-1 transition-colors"
      trigger={
        <>
          <span
            className="bg-primary text-on-primary text-label-md flex h-9 w-9 items-center justify-center rounded-full font-bold"
            aria-hidden="true"
          >
            {initials}
          </span>
          <span className="text-body-sm text-on-surface hidden sm:inline">
            {fullName}
          </span>
          <span
            className="material-symbols-outlined text-on-surface-variant hidden sm:inline"
            aria-hidden="true"
          >
            arrow_drop_down
          </span>
        </>
      }
    >
      <DropdownItemLink href="/configuracoes" icon="settings">
        Configurações
      </DropdownItemLink>
      <DropdownSeparator />
      <LogoutMenuItem />
    </DropdownMenu>
  );
}

/** "Sair" como `menuitem` que submete a server action de logout (F-04). */
function LogoutMenuItem() {
  // NÃO fechar o dropdown aqui: `close()` faz `setOpen(false)`, que DESMONTA o
  // painel (portal) — e com ele este `<form>` — ANTES do React despachar a
  // server action, abortando o logout (BUG: "Sair" não funcionava). O
  // `redirect("/login")` da action já desmonta tudo ao navegar.
  return (
    <form action={signOutAction}>
      <button
        role="menuitem"
        type="submit"
        className="px-md py-sm text-body-sm text-on-surface hover:bg-surface-container-highest gap-sm flex w-full items-center text-left"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18 }}
          aria-hidden="true"
        >
          logout
        </span>
        Sair
      </button>
    </form>
  );
}
