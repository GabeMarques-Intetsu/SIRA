import type { Metadata } from "next";
import { ResourcePage } from "../_resources/resource-page";

export const metadata: Metadata = { title: "Salas · SIRA" };

interface SearchParams {
  status?: string;
  q?: string;
  page?: string;
}

/**
 * Gestão de Salas (EP-09 · F-24/F-25/F-26/F-27 · RF-009). Admin-only via
 * `requireAdmin()` dentro de `ResourcePage`. A aba "Salas" da Gestão de Recursos
 * é esta rota; a aba "Equipamentos" é /equipamentos (mockup 05).
 */
export default function SalasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <ResourcePage kind="room" searchParams={searchParams} />;
}
