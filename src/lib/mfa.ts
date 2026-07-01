/**
 * Lógica pura de MFA/TOTP (F-39 CA05/CA06/CA07). Sem dependências de framework
 * nem do Supabase: apenas tipos e a derivação da VERDADE do 2FA a partir da
 * lista de fatores. Reusada no client island (Segurança) e testável com
 * `node:test`.
 *
 * Verdade do 2FA: ter ≥1 fator TOTP `verified` (não basta a flag declarativa).
 */

/** Subconjunto do fator MFA do Supabase que nos interessa (estável entre versões). */
export interface MfaFactor {
  id: string;
  factor_type: string;
  status: "verified" | "unverified";
  friendly_name?: string | null;
}

/** O usuário tem 2FA REAL ativo? = existe fator TOTP `verified`. */
export function hasVerifiedTotp(
  factors: ReadonlyArray<MfaFactor> | null | undefined,
): boolean {
  if (!factors) return false;
  return factors.some(
    (f) => f.factor_type === "totp" && f.status === "verified",
  );
}

/** Fatores TOTP ainda NÃO verificados (enrolments pendentes p/ limpeza/retomada). */
export function unverifiedTotpFactors(
  factors: ReadonlyArray<MfaFactor> | null | undefined,
): MfaFactor[] {
  if (!factors) return [];
  return factors.filter(
    (f) => f.factor_type === "totp" && f.status === "unverified",
  );
}

/** Fatores TOTP verificados (os que, ao remover, desativam o 2FA). */
export function verifiedTotpFactors(
  factors: ReadonlyArray<MfaFactor> | null | undefined,
): MfaFactor[] {
  if (!factors) return [];
  return factors.filter(
    (f) => f.factor_type === "totp" && f.status === "verified",
  );
}

/** Normaliza o código TOTP digitado (só dígitos; o app gera 6). */
export function normalizeTotpCode(raw: string): string {
  return (raw ?? "").replace(/\D/g, "").slice(0, 6);
}

/** Código TOTP completo (6 dígitos) — habilita o botão de verificar. */
export function isTotpCodeComplete(code: string): boolean {
  return /^\d{6}$/.test(code);
}
