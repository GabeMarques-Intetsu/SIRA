import type { Metadata } from "next";
import { ResourcePage } from "../_resources/resource-page";

export const metadata: Metadata = { title: "Equipamentos · SIRA" };

interface SearchParams {
  status?: string;
  q?: string;
  page?: string;
}

/**
 * Gestão de Equipamentos (EP-09 · F-43/F-44/F-45/F-46 · RF-013). Admin-only via
 * `requireAdmin()` dentro de `ResourcePage`. A aba "Equipamentos" da Gestão de
 * Recursos é esta rota; a aba "Salas" é /salas (mockup 05).
 */
export default function EquipamentosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <ResourcePage kind="equipment" searchParams={searchParams} />;
}
