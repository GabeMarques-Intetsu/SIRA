/** Domínio institucional aceito pelo SIRA (RF-001 / F-01 CA01, F-03 CA03). */
export const INSTITUTIONAL_DOMAIN = "@ifpb.edu.br";

/** Valida que o e-mail pertence ao domínio institucional do IFPB. */
export function isInstitutionalEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  // Estrutura mínima de e-mail + sufixo de domínio institucional.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
    ? normalized.endsWith(INSTITUTIONAL_DOMAIN)
    : false;
}
