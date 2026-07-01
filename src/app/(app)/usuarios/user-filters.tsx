"use client";

/**
 * Filtros da Gestão de Usuários (F-29 CA02/CA03 · mockup 09). Estado na URL
 * (?tab=&role=&q=) p/ deep-link e voltar/avançar do navegador (F-06). As abas
 * (Ativos/Solicitações/Inativos) e o filtro por perfil/busca convivem; trocar de
 * aba zera a busca/perfil p/ não vazar filtro entre contextos. Busca com debounce
 * curto p/ não empurrar uma entrada de histórico por tecla.
 */
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useState, useTransition } from "react";
import {
  ROLE_FILTERS,
  USER_TABS,
  roleLabel,
  tabLabel,
  type RoleFilter,
  type UserTab,
} from "@/lib/users";

interface Props {
  tab: UserTab;
  role: RoleFilter;
  query: string;
  /** Contadores p/ as abas (mockup 09). */
  counts: { active: number; signups: number; inactive: number };
}

const TAB_ICONS: Record<UserTab, string> = {
  active: "group",
  signups: "how_to_reg",
  inactive: "block",
};

export function UserFilters({ tab, role, query, counts }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchId = useId();
  const roleId = useId();
  const [term, setTerm] = useState(query);

  const setParams = useCallback(
    (entries: Record<string, string>, reset?: boolean) => {
      const next = reset
        ? new URLSearchParams()
        : new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(entries)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      next.delete("page");
      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [params, pathname, router],
  );

  // Debounce da busca textual (F-29 CA02).
  useEffect(() => {
    if (term === query) return;
    const id = setTimeout(() => setParams({ tab, role, q: term.trim() }), 300);
    return () => clearTimeout(id);
  }, [term, query, tab, role, setParams]);

  const onTab = (t: UserTab) => {
    setTerm("");
    // Trocar de aba reseta filtros (perfil/busca) p/ contexto limpo.
    setParams({ tab: t === "active" ? "" : t }, true);
  };

  const showFilters = tab !== "signups";

  return (
    <div className="gap-md flex flex-col">
      {/* Abas (mockup 09) */}
      <section className="gap-md flex flex-wrap items-center justify-between">
        <div
          role="tablist"
          aria-label="Categoria de usuários"
          className="border-outline-variant flex w-full border-b md:w-auto"
        >
          {USER_TABS.map((t) => {
            const active = t === tab;
            const count = counts[t];
            return (
              <button
                key={t}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => onTab(t)}
                className={`px-md gap-sm text-label-md relative -mb-px flex items-center py-2 ${
                  active
                    ? "text-primary border-primary border-b-2"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 18 }}
                  aria-hidden="true"
                >
                  {TAB_ICONS[t]}
                </span>
                {tabLabel(t)}
                {count > 0 && (
                  <span
                    className={`text-label-sm ml-1 rounded-full px-2 py-0.5 ${
                      t === "signups"
                        ? "bg-error text-on-error"
                        : "bg-primary-fixed text-on-primary-fixed-variant"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Busca + filtro por perfil (não na aba de solicitações) */}
      {showFilters && (
        <section className="bg-surface-container-lowest border-outline-variant p-md gap-md flex flex-col rounded-xl border shadow-sm md:flex-row md:items-center">
          <div className="relative flex-1">
            <span
              className="material-symbols-outlined text-on-surface-variant left-md absolute top-1/2 -translate-y-1/2"
              aria-hidden="true"
            >
              search
            </span>
            <label htmlFor={searchId} className="sr-only">
              Buscar por nome, e-mail ou matrícula
            </label>
            <input
              id={searchId}
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar por nome, e-mail ou matrícula…"
              className="border-outline-variant bg-surface text-on-surface placeholder:text-on-surface-variant/60 focus:ring-primary text-body-sm pr-md w-full rounded-lg border py-2 pl-[44px] outline-none focus:ring-2"
            />
            {isPending && (
              <span className="sr-only" role="status">
                Atualizando lista
              </span>
            )}
          </div>
          <div className="gap-xs flex flex-col">
            <label htmlFor={roleId} className="sr-only">
              Filtrar por perfil
            </label>
            <select
              id={roleId}
              value={role}
              onChange={(e) =>
                setParams({
                  tab: tab === "active" ? "" : tab,
                  role: e.target.value === "all" ? "" : e.target.value,
                  q: term.trim(),
                })
              }
              className="border-outline-variant bg-surface text-on-surface focus:ring-primary text-body-sm px-md rounded-lg border py-2 outline-none focus:ring-2"
            >
              {ROLE_FILTERS.map((r) => (
                <option key={r} value={r}>
                  {r === "all" ? "Todos os perfis" : roleLabel(r)}
                </option>
              ))}
            </select>
          </div>
        </section>
      )}
    </div>
  );
}
