"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { PERIOD_OPTIONS, type PeriodKey } from "@/lib/dashboard";

interface PeriodFilterProps {
  /** Período atualmente selecionado (resolvido no servidor a partir da URL). */
  current: PeriodKey;
}

/**
 * Seletor de período do painel (F-12 CA07/CA08). Client island mínima: o estado
 * vive na URL (?periodo=) — o Server Component re-busca e reagrega tudo (KPIs,
 * gráfico e tabela) ao mudar, então a troca de período não exige reload manual
 * e suporta deep-link/voltar do navegador. `aria-label` descreve a ação.
 */
export function PeriodFilter({ current }: PeriodFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const onChange = useCallback(
    (key: PeriodKey) => {
      const next = new URLSearchParams(params.toString());
      if (key === "week") next.delete("periodo");
      else next.set("periodo", key);
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [params, pathname, router],
  );

  return (
    <label className="gap-sm flex items-center">
      <span className="sr-only">Período dos indicadores</span>
      <select
        aria-label="Período dos indicadores"
        value={current}
        onChange={(e) => onChange(e.target.value as PeriodKey)}
        className="text-body-sm border-outline-variant bg-surface-container-lowest text-on-surface px-md focus:ring-primary rounded-lg border py-1 outline-none focus:ring-2"
      >
        {PERIOD_OPTIONS.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
