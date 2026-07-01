import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  filterByQuery,
  filterByRole,
  initials,
  parseRoleFilter,
  parseTab,
  roleBadge,
  roleLabel,
  statusBadge,
  type Profile,
  type SignupRequest,
  type UserTab,
} from "@/lib/users";
import { UserFilters } from "./user-filters";
import { UserRowActions } from "./user-row-actions";
import { SignupActions } from "./signup-actions";
import { NewUserButton } from "./new-user-button";

export const metadata: Metadata = { title: "Usuários · SIRA" };

interface SearchParams {
  tab?: string;
  role?: string;
  q?: string;
}

/**
 * Gestão de Usuários (EP-10 · RF-010 · mockup 09). Admin-only via `requireAdmin()`
 * (F-28 CA01 · F-32 CA01). Server Component:
 * - lê `profiles` (RLS `is_admin()` libera ver TODOS) e `signup_requests`
 *   pendentes (RLS admin) — uma só ida ao banco por superfície;
 * - separa por aba (Ativos/Solicitações/Inativos) e aplica busca/perfil da URL;
 * - conta reservas por usuário p/ orientar inativar vs excluir (F-31 CA03).
 *
 * A lista é HTML do servidor (LCP bom, sem CLS); só as ações (editar/estado/
 * excluir, aprovar/recusar) e os filtros são client islands. No desktop é tabela
 * semântica; no mobile vira cards (F-08).
 */
export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const me = await requireAdmin();
  const params = await searchParams;
  const tab = parseTab(params.tab);
  const role = parseRoleFilter(params.role);
  const query = params.q ?? "";

  const supabase = await createClient();

  // As três leituras são INDEPENDENTES e o `tab` já é conhecido aqui, então
  // disparamos tudo numa só ida ao banco em paralelo, sem waterfall
  // (react-best-practices → server-parallel-fetching). A contagem de reservas
  // (F-31 CA03) só é necessária fora da aba de solicitações.
  const [profilesRes, signupsRes, reservationCounts] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .order("full_name", { ascending: true }),
    supabase
      .from("signup_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    // Valor síncrono direto (não `Promise.resolve`): o Promise.all resolve
    // não-thenables para si mesmos — promessa só p/ I/O real (as queries acima).
    tab === "signups"
      ? new Map<string, number>()
      : loadReservationCounts(supabase),
  ]);

  const allProfiles = (profilesRes.data ?? []) as Profile[];
  const pendingSignups = (signupsRes.data ?? []) as SignupRequest[];

  const activeUsers = allProfiles.filter((u) => u.status === "active");
  const inactiveUsers = allProfiles.filter((u) => u.status === "inactive");

  const counts = {
    active: activeUsers.length,
    signups: pendingSignups.length,
    inactive: inactiveUsers.length,
  };

  // Lista da aba ativa, já filtrada por perfil + busca (F-29 CA02/CA03).
  const base = tab === "active" ? activeUsers : inactiveUsers;
  const userRows =
    tab === "signups" ? [] : filterByQuery(filterByRole(base, role), query);

  return (
    <div className="gap-lg mx-auto flex w-full max-w-[1280px] flex-col">
      <header className="gap-md flex flex-wrap items-start justify-between">
        <div>
          <h1 className="text-headline-sm text-on-surface">Usuários</h1>
          <p className="text-body-sm text-on-surface-variant hidden md:block">
            {counts.active} ativo{counts.active === 1 ? "" : "s"} ·{" "}
            {counts.signups} solicitaç{counts.signups === 1 ? "ão" : "ões"}{" "}
            pendente{counts.signups === 1 ? "" : "s"}
          </p>
        </div>
        <NewUserButton />
      </header>

      <UserFilters tab={tab} role={role} query={query} counts={counts} />

      {tab === "signups" ? (
        <SignupsSection signups={pendingSignups} />
      ) : (
        <UsersSection
          tab={tab}
          rows={userRows}
          filtered={query.length > 0 || role !== "all"}
          reservationCounts={reservationCounts}
          selfId={me.id}
        />
      )}
    </div>
  );
}

// ═══════════════════════════ Lista de usuários ══════════════════════════════

function UsersSection({
  tab,
  rows,
  filtered,
  reservationCounts,
  selfId,
}: {
  tab: UserTab;
  rows: Profile[];
  filtered: boolean;
  reservationCounts: Map<string, number>;
  selfId: string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon="group_off"
        title={
          filtered
            ? "Nenhum usuário encontrado"
            : tab === "inactive"
              ? "Nenhum usuário inativo"
              : "Nenhum usuário ativo"
        }
        message={
          filtered
            ? "Nenhum usuário corresponde à busca ou ao filtro de perfil."
            : "Quando houver usuários nesta categoria, eles aparecem aqui."
        }
      />
    );
  }

  return (
    <section
      aria-label="Usuários cadastrados"
      className="bg-surface-container-lowest border-outline-variant overflow-hidden rounded-xl border shadow-sm"
    >
      {/* Desktop: tabela semântica (F-29 CA01) */}
      <div className="hidden overflow-x-auto md:block">
        <table className="text-body-sm w-full">
          <caption className="sr-only">
            Lista de usuários com nome, e-mail, perfil, departamento e estado
          </caption>
          <thead className="text-label-sm text-on-surface-variant bg-surface-container-low text-left tracking-wider uppercase">
            <tr>
              <th scope="col" className="px-md py-sm font-medium">
                Usuário
              </th>
              <th scope="col" className="px-md py-sm font-medium">
                Perfil
              </th>
              <th scope="col" className="px-md py-sm font-medium">
                Departamento
              </th>
              <th scope="col" className="px-md py-sm font-medium">
                Status
              </th>
              <th scope="col" className="px-md py-sm text-right font-medium">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-outline-variant divide-y">
            {rows.map((u) => {
              const rb = roleBadge(u.role);
              const sb = statusBadge(u.status);
              return (
                <tr
                  key={u.id}
                  className="hover:bg-surface-container-low transition-colors"
                >
                  <td className="px-md py-md">
                    <div className="gap-sm flex items-center">
                      <span
                        className="bg-primary text-on-primary text-label-md flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full font-bold"
                        aria-hidden="true"
                      >
                        {initials(u.full_name)}
                      </span>
                      <div className="min-w-0">
                        <div className="text-on-surface font-medium">
                          {u.full_name}
                          {u.id === selfId && (
                            <span className="text-on-surface-variant text-label-sm ml-2">
                              (você)
                            </span>
                          )}
                        </div>
                        <div className="text-on-surface-variant text-body-sm truncate">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-md py-md">
                    <span
                      className={`text-label-sm rounded-full px-2 py-0.5 ${rb.className}`}
                    >
                      {rb.label}
                    </span>
                  </td>
                  <td className="px-md py-md text-on-surface">
                    {u.department ?? "—"}
                  </td>
                  <td className="px-md py-md">
                    <span className="gap-xs inline-flex items-center">
                      <span
                        className={`h-2 w-2 rounded-full ${sb.className}`}
                        aria-hidden="true"
                      />
                      <span className="text-on-surface">{sb.label}</span>
                    </span>
                  </td>
                  <td className="px-md py-md text-right">
                    <UserRowActions
                      user={u}
                      reservationCount={reservationCounts.get(u.id) ?? 0}
                      isSelf={u.id === selfId}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: cards (F-08) */}
      <ul className="divide-outline-variant divide-y md:hidden">
        {rows.map((u) => {
          const rb = roleBadge(u.role);
          const sb = statusBadge(u.status);
          return (
            <li key={u.id} className="p-md gap-sm flex flex-col">
              <div className="gap-sm flex items-start">
                <span
                  className="bg-primary text-on-primary text-label-md flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold"
                  aria-hidden="true"
                >
                  {initials(u.full_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-on-surface font-medium">
                    {u.full_name}
                    {u.id === selfId && (
                      <span className="text-on-surface-variant text-label-sm ml-2">
                        (você)
                      </span>
                    )}
                  </div>
                  <div className="text-on-surface-variant text-body-sm break-all">
                    {u.email}
                  </div>
                </div>
                <UserRowActions
                  user={u}
                  reservationCount={reservationCounts.get(u.id) ?? 0}
                  isSelf={u.id === selfId}
                />
              </div>
              <div className="gap-sm flex flex-wrap items-center">
                <span
                  className={`text-label-sm rounded-full px-2 py-0.5 ${rb.className}`}
                >
                  {rb.label}
                </span>
                {u.department && (
                  <span className="text-body-sm text-on-surface-variant">
                    {u.department}
                  </span>
                )}
                <span className="gap-xs text-body-sm ml-auto inline-flex items-center">
                  <span
                    className={`h-2 w-2 rounded-full ${sb.className}`}
                    aria-hidden="true"
                  />
                  <span className="text-on-surface">{sb.label}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ═══════════════════════════ Fila de solicitações ═══════════════════════════

function SignupsSection({ signups }: { signups: SignupRequest[] }) {
  if (signups.length === 0) {
    return (
      <EmptyState
        icon="how_to_reg"
        title="Nenhuma solicitação pendente"
        message="Quando um professor pedir cadastro pelo auto-serviço, a solicitação aparece aqui para aprovação ou recusa."
      />
    );
  }

  return (
    <section
      aria-label="Solicitações de cadastro"
      className="gap-md flex flex-col"
    >
      {signups.map((s) => (
        <article
          key={s.id}
          className="bg-surface-container-lowest border-outline-variant overflow-hidden rounded-xl border shadow-sm"
        >
          <div className="p-md md:p-lg gap-md flex flex-col md:flex-row md:items-center">
            <span
              className="bg-secondary-container text-on-secondary-container text-label-md flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full font-bold"
              aria-hidden="true"
            >
              {initials(s.full_name)}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-headline-sm text-on-surface">
                {s.full_name}
              </h2>
              <p className="text-body-sm text-on-surface-variant break-all">
                {s.email}
              </p>
              <div className="gap-sm mt-xs flex flex-wrap items-center">
                <span className="text-label-sm bg-surface-container-high text-on-surface rounded-full px-2 py-0.5">
                  {roleLabel(s.role)}
                </span>
                {s.department && (
                  <span className="text-body-sm text-on-surface-variant">
                    {s.department}
                  </span>
                )}
              </div>
              {s.motivo && (
                <p className="text-body-sm text-on-surface-variant mt-sm">
                  <span className="text-on-surface font-medium">
                    Justificativa:
                  </span>{" "}
                  {s.motivo}
                </p>
              )}
            </div>
            <div className="md:max-w-[18rem] md:flex-shrink-0">
              <SignupActions signupId={s.id} />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

// ─────────────────────────── Empty state ────────────────────────────────────

function EmptyState({
  icon,
  title,
  message,
}: {
  icon: string;
  title: string;
  message: string;
}) {
  return (
    <section className="bg-surface-container-lowest border-outline-variant p-xxl gap-md flex flex-col items-center rounded-xl border text-center shadow-sm">
      <div className="bg-secondary-container flex h-16 w-16 items-center justify-center rounded-full">
        <span
          className="material-symbols-outlined text-on-secondary-container"
          style={{ fontSize: 32 }}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <h2 className="text-headline-sm text-on-surface">{title}</h2>
      <p className="text-body-md text-on-surface-variant max-w-[24rem]">
        {message}
      </p>
    </section>
  );
}

// ─────────────────────────── Contagem de reservas ───────────────────────────

/**
 * Conta reservas por usuário (F-31 CA03 — orienta inativar vs excluir).
 * Agrega NO BANCO via RPC (GROUP BY): devolve 1 linha por usuário com o total,
 * em vez de trazer a tabela `reservations` inteira p/ contar no app. A RPC é
 * SECURITY DEFINER gated por is_admin().
 */
async function loadReservationCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Map<string, number>> {
  const { data } = await supabase.rpc("reservation_counts_by_user");
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    if (row.user_id) counts.set(row.user_id, Number(row.total));
  }
  return counts;
}
