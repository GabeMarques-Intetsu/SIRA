/**
 * Lógica pura da reserva temporária (hold) — F-49 / RF-006 / ADR-009.
 *
 * Sem dependências de framework nem de Supabase, para ser testável com
 * `node:test` e reutilizável no servidor. O TTL é a única regra de negócio
 * quantitativa do bloqueio temporário (RNF-reserva-temporaria: 10 minutos).
 *
 * A expiração é autoritativa por filtro na RPC `check_resource_availability`
 * (`expires_at > now()`); este helper apenas calcula o instante de expiração
 * gravado em `reservation_holds.expires_at` ao criar/renovar o hold.
 */

/** TTL do bloqueio temporário em minutos (RNF-reserva-temporaria). */
export const HOLD_TTL_MINUTES = 10;

/**
 * Instante de expiração de um hold criado/renovado em `now`: `now + 10 min`.
 * Retorna ISO-8601 (UTC) — o formato aceito por `timestamptz` no Postgres.
 */
export function holdExpiry(now: Date = new Date()): string {
  return new Date(now.getTime() + HOLD_TTL_MINUTES * 60_000).toISOString();
}
