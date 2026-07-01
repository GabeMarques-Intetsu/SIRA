import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  equipmentIcon,
  filterByName,
  filterByStatus,
  paginate,
  parsePage,
  parseResources,
  parseStatusFilter,
  resourceImageUrl,
  roomTypeLabel,
  statusBadge,
  type Equipment,
  type ResourceKind,
  type Room,
  type StatusFilter,
} from "@/lib/resources";
import { ResourceFilters } from "./resource-filters";
import { ResourceCardActions } from "./resource-card-actions";
import { NewResourceButton } from "./new-resource-button";

interface SearchParams {
  status?: string;
  q?: string;
  page?: string;
}

/** Mapa id→quantidade de reservas atuais/futuras (F-25 CA03). */
type CountMap = Map<string, number>;

/**
 * View compartilhada da Gestão de Recursos, parametrizada por `kind`. Cada rota
 * (/salas, /equipamentos) renderiza a aba correspondente; as abas são <Link>
 * que trocam de rota (mantendo o filtro próprio de cada aba — F-44 CA06).
 *
 * Server Component (F-25/F-44): lê o catálogo completo (RLS libera o admin a ver
 * inclusive inativas), aplica filtro/busca em memória, pagina e renderiza os
 * cards como HTML do servidor (LCP bom, sem CLS). Só as ações por card e o botão
 * "Novo" são client islands.
 */
export async function ResourcePage({
  kind,
  searchParams,
}: {
  kind: ResourceKind;
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const status = parseStatusFilter(params.status);
  const query = params.q ?? "";
  const page = parsePage(params.page);

  const supabase = await createClient();

  // Contagens de abas (ambos os totais p/ os badges das tabs).
  const [{ count: roomsTotal }, { count: equipTotal }] = await Promise.all([
    supabase.from("rooms").select("id", { count: "exact", head: true }),
    supabase.from("equipment").select("id", { count: "exact", head: true }),
  ]);

  const isRoom = kind === "room";

  if (isRoom) {
    const { data } = await supabase
      .from("rooms")
      .select("*")
      .order("name", { ascending: true });
    const all = (data ?? []) as Room[];
    const counts = await loadReservationCounts(supabase, "room");
    return (
      <Layout
        kind={kind}
        roomsTotal={roomsTotal ?? 0}
        equipTotal={equipTotal ?? 0}
        status={status}
        query={query}
      >
        <RoomGrid
          rows={all}
          status={status}
          query={query}
          page={page}
          counts={counts}
        />
      </Layout>
    );
  }

  const [{ data: equipData }, { data: roomData }] = await Promise.all([
    supabase.from("equipment").select("*").order("name", { ascending: true }),
    supabase.from("rooms").select("id, name, block").order("name"),
  ]);
  const all = (equipData ?? []) as Equipment[];
  const roomOptions = (roomData ?? []) as {
    id: string;
    name: string;
    block: string | null;
  }[];
  const roomNameById = new Map(roomOptions.map((r) => [r.id, r.name]));

  return (
    <Layout
      kind={kind}
      roomsTotal={roomsTotal ?? 0}
      equipTotal={equipTotal ?? 0}
      status={status}
      query={query}
      rooms={roomOptions}
    >
      <EquipmentGrid
        rows={all}
        status={status}
        query={query}
        page={page}
        rooms={roomOptions}
        roomNameById={roomNameById}
      />
    </Layout>
  );
}

// ─────────────────────────── Contagem de reservas ───────────────────────────

async function loadReservationCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  kind: "room" | "equipment",
): Promise<CountMap> {
  // Agregação NO BANCO via RPC (GROUP BY): reservas futuras pendentes/aprovadas
  // por recurso, sem trazer linhas p/ contar no app. SECURITY DEFINER + is_admin().
  const { data } = await supabase.rpc("reservation_counts_by_resource", {
    p_kind: kind,
  });
  const counts: CountMap = new Map();
  for (const row of data ?? []) {
    if (row.resource_id) counts.set(row.resource_id, Number(row.total));
  }
  return counts;
}

// ─────────────────────────── Layout (header + tabs + filtros) ───────────────

interface RoomOption {
  id: string;
  name: string;
  block: string | null;
}

function Layout({
  kind,
  roomsTotal,
  equipTotal,
  status,
  query,
  rooms,
  children,
}: {
  kind: ResourceKind;
  roomsTotal: number;
  equipTotal: number;
  status: StatusFilter;
  query: string;
  rooms?: RoomOption[];
  children: React.ReactNode;
}) {
  const isRoom = kind === "room";
  return (
    <div className="gap-lg mx-auto flex w-full max-w-[1280px] flex-col">
      <header className="gap-md flex flex-wrap items-start justify-between">
        <div>
          <h1 className="text-headline-sm text-on-surface">Recursos</h1>
          <p className="text-body-sm text-on-surface-variant hidden md:block">
            Salas, auditórios e equipamentos do campus
          </p>
        </div>
        <NewResourceButton kind={kind} rooms={rooms} variant="header" />
      </header>

      {/* Tabs Salas / Equipamentos — <Link> que trocam de rota */}
      <div
        role="tablist"
        aria-label="Tipo de recurso"
        className="border-outline-variant -mx-md px-md flex overflow-x-auto border-b md:mx-0 md:px-0"
      >
        <Tab
          href="/salas"
          icon="meeting_room"
          label="Salas"
          count={roomsTotal}
          active={isRoom}
        />
        <Tab
          href="/equipamentos"
          icon="videocam"
          label="Equipamentos"
          count={equipTotal}
          active={!isRoom}
        />
      </div>

      <ResourceFilters
        status={status}
        query={query}
        searchPlaceholder={isRoom ? "Buscar sala…" : "Buscar equipamento…"}
      />

      {children}
    </div>
  );
}

function Tab({
  href,
  icon,
  label,
  count,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "px-md text-label-md text-primary border-primary gap-sm -mb-px flex items-center border-b-2 py-2 whitespace-nowrap"
          : "px-md text-label-md text-on-surface-variant hover:text-on-surface gap-sm flex items-center py-2 whitespace-nowrap"
      }
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 18 }}
        aria-hidden="true"
      >
        {icon}
      </span>
      {label}
      <span
        className={
          active
            ? "bg-primary-fixed text-on-primary-fixed-variant text-label-sm ml-1 rounded-full px-2 py-0.5"
            : "bg-surface-container-high text-on-surface text-label-sm ml-1 rounded-full px-2 py-0.5"
        }
      >
        {count}
      </span>
    </Link>
  );
}

// ─────────────────────────── Grids ──────────────────────────────────────────

function GridShell({
  ariaLabel,
  children,
}: {
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-label={ariaLabel}
      className="gap-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {children}
    </section>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <section className="bg-surface-container-lowest border-outline-variant p-xxl gap-md flex flex-col items-center rounded-xl border text-center shadow-sm">
      <div className="bg-secondary-container flex h-16 w-16 items-center justify-center rounded-full">
        <span
          className="material-symbols-outlined text-on-secondary-container"
          style={{ fontSize: 32 }}
          aria-hidden="true"
        >
          inventory_2
        </span>
      </div>
      <h2 className="text-headline-sm text-on-surface">
        {filtered ? "Nenhum recurso encontrado" : "Nenhum recurso cadastrado"}
      </h2>
      <p className="text-body-md text-on-surface-variant max-w-[24rem]">
        {filtered
          ? "Nenhum recurso atende ao filtro selecionado. Ajuste a busca ou o estado."
          : "Use o botão Novo para cadastrar o primeiro recurso."}
      </p>
    </section>
  );
}

function Pagination({
  from,
  to,
  total,
  page,
  totalPages,
  noun,
}: {
  from: number;
  to: number;
  total: number;
  page: number;
  totalPages: number;
  noun: string;
}) {
  if (totalPages <= 1) {
    return (
      <p className="text-body-sm text-on-surface-variant">
        Mostrando <strong className="text-on-surface">{total}</strong> {noun}
      </p>
    );
  }
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <nav
      aria-label="Paginação"
      className="gap-md flex flex-wrap items-center justify-between"
    >
      <span className="text-body-sm text-on-surface-variant">
        Mostrando{" "}
        <strong className="text-on-surface">
          {from}–{to}
        </strong>{" "}
        de <strong className="text-on-surface">{total}</strong> {noun}
      </span>
      <div className="gap-xs flex items-center">
        {pages.map((p) => (
          <PageLink key={p} page={p} active={p === page} />
        ))}
      </div>
    </nav>
  );
}

function PageLink({ page, active }: { page: number; active: boolean }) {
  return (
    <Link
      href={`?page=${page}`}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "bg-primary text-on-primary text-label-md rounded-lg px-3 py-1"
          : "hover:bg-surface-container text-label-md text-on-surface rounded-lg px-3 py-1"
      }
    >
      {page}
    </Link>
  );
}

// ─────────────────────────── Imagem do recurso (F-47/F-48) ──────────────────

/**
 * Topo do card: imagem do recurso quando há `image_path` (CA08), senão o ícone
 * padrão sobre a cor de estado (CA09/IMG08). Proporção fixa 16/9 + `loading=lazy`
 * para evitar CLS e adiar o download de imagens fora da viewport.
 */
function ResourceImage({
  imagePath,
  alt,
  fallbackIcon,
  fallbackBg,
  fallbackFg,
}: {
  imagePath: string | null;
  alt: string;
  fallbackIcon: string;
  fallbackBg: string;
  fallbackFg: string;
}) {
  const url = resourceImageUrl(imagePath);
  if (url) {
    return (
      // Imagens vêm do Storage público; `<img>` com dimensões fixas evita CLS.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        width={400}
        height={225}
        loading="lazy"
        className="aspect-[16/9] w-full bg-surface-container object-cover"
      />
    );
  }
  return (
    <div
      className={`flex aspect-[16/9] w-full items-center justify-center ${fallbackBg}`}
    >
      <span
        className={`material-symbols-outlined ${fallbackFg}`}
        style={{ fontSize: 48 }}
        aria-hidden="true"
      >
        {fallbackIcon}
      </span>
    </div>
  );
}

// ─────────────────────────── Salas ──────────────────────────────────────────

function RoomGrid({
  rows,
  status,
  query,
  page,
  counts,
}: {
  rows: Room[];
  status: StatusFilter;
  query: string;
  page: number;
  counts: CountMap;
}) {
  const filtered = filterByName(filterByStatus(rows, status), query);
  const pg = paginate(filtered, page);
  const isFiltered = status !== "all" || query.length > 0;

  if (pg.total === 0) return <EmptyState filtered={isFiltered} />;

  return (
    <>
      <GridShell ariaLabel="Lista de salas">
        {pg.items.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            count={counts.get(room.id) ?? 0}
          />
        ))}
        {!isFiltered && page === pg.totalPages && (
          <NewResourceButton kind="room" variant="card" />
        )}
      </GridShell>
      <Pagination
        from={pg.from}
        to={pg.to}
        total={pg.total}
        page={pg.page}
        totalPages={pg.totalPages}
        noun="salas"
      />
    </>
  );
}

function RoomCard({ room, count }: { room: Room; count: number }) {
  const badge = statusBadge(room.status);
  const resources = parseResources(room.resources);
  const inactive = room.status === "inactive";
  return (
    <article
      className={`bg-surface-container-lowest border-outline-variant flex flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md ${
        inactive ? "opacity-90" : ""
      }`}
    >
      <ResourceImage
        imagePath={room.image_path}
        alt={room.name}
        fallbackIcon="meeting_room"
        fallbackBg="bg-primary-fixed"
        fallbackFg="text-on-primary-fixed"
      />
      <div className="p-md gap-xs flex flex-1 flex-col">
        <div className="gap-sm flex items-start justify-between">
          <h2 className="text-body-md text-on-surface font-medium">
            {room.name}
          </h2>
          <span
            className={`text-label-sm rounded-full px-2 py-0.5 whitespace-nowrap ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          {roomTypeLabel(room.type)} · {room.capacity} lugares
        </p>
        {room.block && (
          <div className="gap-sm mt-sm text-label-sm text-on-surface-variant flex items-center">
            <span className="gap-xs flex items-center">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 14 }}
                aria-hidden="true"
              >
                location_on
              </span>
              {room.block}
            </span>
          </div>
        )}
        {resources.length > 0 && (
          <ul className="gap-xs mt-xs flex flex-wrap" aria-label="Recursos">
            {resources.map((r) => (
              <li
                key={r}
                className="bg-surface-container text-on-surface-variant text-label-sm rounded-full px-2 py-0.5"
              >
                {r}
              </li>
            ))}
          </ul>
        )}
        <div className="text-label-sm text-on-surface-variant mt-sm gap-xs flex items-center">
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 14 }}
            aria-hidden="true"
          >
            event
          </span>
          {count} reserva{count === 1 ? "" : "s"} atual/futura
        </div>
        <div className="border-outline-variant mt-sm pt-sm flex items-center justify-end border-t">
          <ResourceCardActions kind="room" room={room} />
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────── Equipamentos ───────────────────────────────────

function EquipmentGrid({
  rows,
  status,
  query,
  page,
  rooms,
  roomNameById,
}: {
  rows: Equipment[];
  status: StatusFilter;
  query: string;
  page: number;
  rooms: RoomOption[];
  roomNameById: Map<string, string>;
}) {
  const filtered = filterByName(filterByStatus(rows, status), query);
  const pg = paginate(filtered, page);
  const isFiltered = status !== "all" || query.length > 0;

  if (pg.total === 0) return <EmptyState filtered={isFiltered} />;

  return (
    <>
      <GridShell ariaLabel="Lista de equipamentos">
        {pg.items.map((eq) => (
          <EquipmentCard
            key={eq.id}
            equipment={eq}
            rooms={rooms}
            roomName={eq.room_id ? roomNameById.get(eq.room_id) : undefined}
          />
        ))}
        {!isFiltered && page === pg.totalPages && (
          <NewResourceButton kind="equipment" rooms={rooms} variant="card" />
        )}
      </GridShell>
      <Pagination
        from={pg.from}
        to={pg.to}
        total={pg.total}
        page={pg.page}
        totalPages={pg.totalPages}
        noun="equipamentos"
      />
    </>
  );
}

function EquipmentCard({
  equipment,
  rooms,
  roomName,
}: {
  equipment: Equipment;
  rooms: RoomOption[];
  roomName?: string;
}) {
  const badge = statusBadge(equipment.status);
  const inactive = equipment.status === "inactive";
  const maintenance = equipment.status === "maintenance";
  const icon = equipmentIcon(equipment.type);
  const location = [equipment.block, roomName].filter(Boolean).join(" · ");

  return (
    <article
      className={`bg-surface-container-lowest border-outline-variant flex flex-col overflow-hidden rounded-xl border shadow-sm transition-shadow hover:shadow-md ${
        inactive ? "opacity-90" : ""
      }`}
    >
      <div className="relative">
        <ResourceImage
          imagePath={equipment.image_path}
          alt={equipment.name}
          fallbackIcon={icon}
          fallbackBg={
            maintenance
              ? "bg-error-container"
              : inactive
                ? "bg-surface-container-high"
                : "bg-secondary-container"
          }
          fallbackFg={
            maintenance
              ? "text-on-error-container"
              : inactive
                ? "text-on-surface-variant"
                : "text-on-secondary-container"
          }
        />
        {maintenance && (
          <span className="bg-error text-on-error text-label-sm absolute top-2 right-2 rounded-full px-2 py-0.5">
            Em manutenção
          </span>
        )}
      </div>
      <div className="p-md gap-xs flex flex-1 flex-col">
        <div className="gap-sm flex items-start justify-between">
          <h2 className="text-body-md text-on-surface font-medium">
            {equipment.name}
          </h2>
          <span
            className={`text-label-sm rounded-full px-2 py-0.5 whitespace-nowrap ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
        <p className="text-body-sm text-on-surface-variant">{equipment.type}</p>
        {location && (
          <div className="gap-sm mt-sm text-label-sm text-on-surface-variant flex items-center">
            <span className="gap-xs flex items-center">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 14 }}
                aria-hidden="true"
              >
                location_on
              </span>
              {location}
            </span>
          </div>
        )}
        <div className="border-outline-variant pt-sm mt-auto flex items-center justify-end border-t">
          <ResourceCardActions
            kind="equipment"
            equipment={equipment}
            rooms={rooms}
          />
        </div>
      </div>
    </article>
  );
}
