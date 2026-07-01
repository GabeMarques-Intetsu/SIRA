import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Enums, Json } from "@/lib/supabase/database.types";
import {
  displayStatus,
  formatDateLong,
  formatTimeRange,
  formatTimestamp,
  resourceIcon,
  resourceName,
  type MyReservationRow,
} from "@/lib/my-reservations";
import { CancelButton } from "../cancel-button";
import { EditReservation } from "../edit-reservation";
import { listActiveRoomsAction } from "../actions";

export const metadata: Metadata = { title: "Detalhe da reserva · SIRA" };

interface ApprovalEventRow {
  id: string;
  action: Enums<"approval_action">;
  reason: string | null;
  created_at: string;
  profiles: { full_name: string; role: Enums<"user_role"> } | null;
}

interface DetailRow extends MyReservationRow {
  user_id: string;
  created_at: string;
  rooms: {
    name: string;
    block: string | null;
    type: string;
    capacity: number;
    resources: Json;
  } | null;
}

/**
 * Detalhe de uma reserva (F-17 · RF-007). Server Component:
 * - busca a reserva por id; o RLS de `reservations` só devolve a PRÓPRIA (ou
 *   qualquer uma, para admin), então um professor que tente ver a reserva de
 *   outro recebe 0 linhas → 404 (CA04 / F-10), sem vazar existência;
 * - mostra sala/horário/status/justificativa/recursos (CA01) e o histórico de
 *   aprovação com responsável e data via `approval_events` (CA02);
 * - é acionável a partir da lista e de notificações (mesma rota /:id — CA03);
 * - oferece editar (F-18) e cancelar (F-19) apenas quando pendente.
 */
export default async function DetalheReservaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  // Reserva e histórico são INDEPENDENTES (ambos chaveados pelo `id` da rota,
  // não um pelo resultado do outro) → uma só ida ao banco em paralelo, sem
  // waterfall (react-best-practices → server-parallel-fetching).
  const [reservationRes, eventsRes] = await Promise.all([
    supabase
      .from("reservations")
      .select(
        `id, reservation_date, start_time, end_time, status, resource_kind,
         purpose, recurrence_type, room_id, equipment_id, user_id, created_at,
         rooms ( name, block, type, capacity, resources ),
         equipment ( name, block, type )`,
      )
      .eq("id", id)
      .maybeSingle(),
    // Histórico de aprovação (CA02). RLS: o dono lê os eventos da própria reserva.
    supabase
      .from("approval_events")
      .select(`id, action, reason, created_at, profiles ( full_name, role )`)
      .eq("reservation_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const { data, error } = reservationRes;

  // CA04 — sem linha (não é dono / não existe) → 404.
  if (error || !data) notFound();

  const reservation = data as unknown as DetailRow;
  const status = displayStatus(reservation);
  const isPending = reservation.status === "pending";
  const isRoom = reservation.resource_kind === "room";

  const events = (eventsRes.data ?? []) as unknown as ApprovalEventRow[];

  // Recursos da sala (Json) para "Recursos solicitados" (CA01).
  const roomResources = Array.isArray(reservation.rooms?.resources)
    ? (reservation.rooms.resources as Json[]).map(String)
    : [];

  // Salas ativas só quando há possibilidade de editar (pendente + sala).
  const rooms = isPending && isRoom ? await listActiveRoomsAction() : [];

  const subtitle = `${isRoom ? "Sala" : "Equipamento"}${
    (reservation.rooms?.block ?? reservation.equipment?.block)
      ? ` · Bloco ${reservation.rooms?.block ?? reservation.equipment?.block}`
      : ""
  }${reservation.rooms?.capacity ? ` · ${reservation.rooms.capacity} lugares` : ""}`;

  return (
    <div className="mx-auto flex w-full max-w-[56rem] flex-col gap-2">
      <Link
        href="/minhas-reservas"
        className="text-label-md text-primary gap-xs mb-2 inline-flex items-center self-start hover:underline"
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18 }}
          aria-hidden="true"
        >
          arrow_back
        </span>
        Voltar para Minhas Reservas
      </Link>

      <div className="gap-lg flex flex-col">
        {/* Cabeçalho do recurso + status (CA01) */}
        <section
          aria-labelledby="recurso-h"
          className="bg-surface-container-lowest border-outline-variant overflow-hidden rounded-xl border shadow-sm"
        >
          <div className="p-md md:p-lg gap-md flex flex-col items-start sm:flex-row">
            <span className="bg-primary-fixed flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl">
              <span
                className="material-symbols-outlined text-on-primary-fixed"
                style={{ fontSize: 36 }}
                aria-hidden="true"
              >
                {resourceIcon(reservation)}
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="gap-sm flex flex-wrap items-start justify-between">
                <div>
                  <h2
                    id="recurso-h"
                    className="text-headline-md text-on-surface"
                  >
                    {resourceName(reservation)}
                  </h2>
                  <p className="text-body-sm text-on-surface-variant mt-0.5">
                    {subtitle}
                  </p>
                </div>
                <span
                  className={`text-label-md gap-xs flex items-center rounded-full px-3 py-1 whitespace-nowrap ${status.badgeClass}`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16 }}
                    aria-hidden="true"
                  >
                    {status.icon}
                  </span>
                  {status.label}
                </span>
              </div>
              <div className="text-body-md text-on-surface mt-md gap-lg flex flex-wrap items-center">
                <span className="gap-xs flex items-center">
                  <span
                    className="material-symbols-outlined text-on-surface-variant"
                    style={{ fontSize: 18 }}
                    aria-hidden="true"
                  >
                    event
                  </span>
                  {formatDateLong(reservation.reservation_date)}
                </span>
                <span className="gap-xs flex items-center">
                  <span
                    className="material-symbols-outlined text-on-surface-variant"
                    style={{ fontSize: 18 }}
                    aria-hidden="true"
                  >
                    schedule
                  </span>
                  {formatTimeRange(
                    reservation.start_time,
                    reservation.end_time,
                  )}
                </span>
                {reservation.recurrence_type !== "none" && (
                  <span className="gap-xs flex items-center">
                    <span
                      className="material-symbols-outlined text-on-surface-variant"
                      style={{ fontSize: 18 }}
                      aria-hidden="true"
                    >
                      repeat
                    </span>
                    Reserva recorrente
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="gap-lg grid grid-cols-1 lg:grid-cols-2">
          {/* Finalidade / justificativa (CA01) */}
          <section
            aria-labelledby="finalidade-h"
            className="bg-surface-container-lowest border-outline-variant p-md md:p-lg rounded-xl border shadow-sm"
          >
            <h2
              id="finalidade-h"
              className="text-headline-sm text-on-surface mb-md gap-sm flex items-center"
            >
              <span
                className="material-symbols-outlined text-on-surface-variant"
                aria-hidden="true"
              >
                description
              </span>
              Finalidade
            </h2>
            <dl className="gap-md text-body-sm flex flex-col">
              <div>
                <dt className="text-on-surface-variant">Justificativa</dt>
                <dd className="text-on-surface mt-0.5">
                  {reservation.purpose?.trim() || "Não informada."}
                </dd>
              </div>
            </dl>
          </section>

          {/* Recursos solicitados (CA01) */}
          <section
            aria-labelledby="recursos-h"
            className="bg-surface-container-lowest border-outline-variant p-md md:p-lg rounded-xl border shadow-sm"
          >
            <h2
              id="recursos-h"
              className="text-headline-sm text-on-surface mb-md gap-sm flex items-center"
            >
              <span
                className="material-symbols-outlined text-on-surface-variant"
                aria-hidden="true"
              >
                inventory_2
              </span>
              Recursos solicitados
            </h2>
            {roomResources.length > 0 ? (
              <ul className="gap-sm flex flex-col">
                {roomResources.map((res) => (
                  <li
                    key={res}
                    className="gap-md p-sm bg-surface-container-low flex items-center rounded-lg"
                  >
                    <span className="bg-primary-fixed flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg">
                      <span
                        className="material-symbols-outlined text-on-primary-fixed"
                        style={{ fontSize: 20 }}
                        aria-hidden="true"
                      >
                        check
                      </span>
                    </span>
                    <span className="text-body-sm text-on-surface flex-1">
                      {res}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body-sm text-on-surface-variant">
                Nenhum recurso adicional solicitado.
              </p>
            )}
          </section>
        </div>

        {/* Histórico de aprovação (CA02) */}
        <section
          aria-labelledby="historico-h"
          className="bg-surface-container-lowest border-outline-variant p-md md:p-lg rounded-xl border shadow-sm"
        >
          <h2
            id="historico-h"
            className="text-headline-sm text-on-surface mb-lg gap-sm flex items-center"
          >
            <span
              className="material-symbols-outlined text-on-surface-variant"
              aria-hidden="true"
            >
              history
            </span>
            Histórico de aprovação
          </h2>

          {events.length > 0 ? (
            <ol className="border-outline-variant pl-lg gap-lg relative ml-4 flex flex-col border-l-2">
              {events.map((ev) => (
                <TimelineItem key={ev.id} event={ev} />
              ))}
            </ol>
          ) : (
            <p className="text-body-sm text-on-surface-variant">
              Ainda não há eventos no histórico desta reserva.
            </p>
          )}
        </section>

        {/* Ações conforme status (F-18 editar / F-19 cancelar — só pendente) */}
        <section
          aria-label="Ações da reserva"
          className="bg-surface-container-lowest border-outline-variant p-md gap-md flex flex-wrap items-center justify-between rounded-xl border shadow-sm"
        >
          <Link
            href="/minhas-reservas"
            className="px-md text-on-surface-variant hover:bg-surface-container text-label-md gap-xs flex items-center rounded-lg py-2"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18 }}
              aria-hidden="true"
            >
              arrow_back
            </span>
            Voltar
          </Link>

          {isPending ? (
            <div className="gap-sm flex w-full flex-wrap items-center justify-end lg:w-auto">
              <EditReservation
                reservationId={reservation.id}
                isRoom={isRoom}
                initial={{
                  date: reservation.reservation_date,
                  start: reservation.start_time.slice(0, 5),
                  end: reservation.end_time.slice(0, 5),
                  roomId: reservation.room_id,
                }}
                rooms={rooms}
              />
              <CancelButton reservationId={reservation.id} />
            </div>
          ) : (
            <p className="text-body-sm text-on-surface-variant gap-xs flex items-center">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 18 }}
                aria-hidden="true"
              >
                lock
              </span>
              Reservas {status.label.toLowerCase()} não podem ser editadas.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

const ACTION_META: Record<
  Enums<"approval_action">,
  { label: string; dotClass: string; icon: string }
> = {
  submitted: {
    label: "Solicitação criada",
    dotClass: "bg-primary text-on-primary",
    icon: "edit",
  },
  approved: {
    label: "Reserva aprovada",
    dotClass: "bg-secondary text-on-secondary",
    icon: "check",
  },
  rejected: {
    label: "Reserva recusada",
    dotClass: "bg-error text-on-error",
    icon: "close",
  },
};

function TimelineItem({ event }: { event: ApprovalEventRow }) {
  const meta = ACTION_META[event.action];
  const actor = event.profiles?.full_name ?? "Sistema";
  const role = event.profiles?.role === "admin" ? "Coordenação" : "Professor";

  return (
    <li className="relative">
      <span
        className={`ring-surface-container-lowest absolute top-0.5 -left-[calc(1.5rem+5px)] flex h-5 w-5 items-center justify-center rounded-full ring-4 ${meta.dotClass}`}
        aria-hidden="true"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          {meta.icon}
        </span>
      </span>
      <div className="gap-xs flex flex-wrap items-baseline justify-between">
        <p className="text-body-md text-on-surface font-medium">{meta.label}</p>
        <time
          dateTime={event.created_at}
          className="text-label-sm text-on-surface-variant"
        >
          {formatTimestamp(event.created_at)}
        </time>
      </div>
      <p className="text-body-sm text-on-surface-variant mt-0.5">
        por <strong className="text-on-surface">{actor}</strong> · {role}
      </p>
      {event.reason && (
        <p className="text-body-sm text-on-surface mt-xs p-sm bg-surface-container-low rounded-md">
          {event.reason}
        </p>
      )}
    </li>
  );
}
