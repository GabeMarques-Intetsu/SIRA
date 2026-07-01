import { signOutAction } from "./logout-action";

/** Botão de logout no rodapé da sidebar (F-04). */
export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="text-on-surface-variant hover:bg-surface-container-highest text-label-md gap-md px-md py-sm flex w-full items-center rounded-lg text-left transition-all"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          logout
        </span>
        <span>Sair</span>
      </button>
    </form>
  );
}