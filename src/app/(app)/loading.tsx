/**
 * Fallback de carregamento do grupo (app). Cria um Suspense boundary em torno do
 * conteúdo da página: na navegação, o shell (sidebar/header) permanece e este
 * skeleton aparece NA HORA, enquanto o Server Component da página renderiza
 * (auth + queries à Supabase). Elimina a sensação de "cliquei e nada acontece".
 * `.animate-pulse` é minimizado para quem ativou "reduzir animações".
 */
export default function Loading() {
  return (
    <div
      className="space-y-md animate-pulse"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Carregando…</span>
      {/* Título */}
      <div className="bg-surface-container-high h-8 w-64 rounded-lg" />
      {/* Faixa de filtros/KPIs */}
      <div className="gap-md grid grid-cols-2 md:grid-cols-4">
        <div className="bg-surface-container-high h-24 rounded-xl" />
        <div className="bg-surface-container-high h-24 rounded-xl" />
        <div className="bg-surface-container-high h-24 rounded-xl" />
        <div className="bg-surface-container-high h-24 rounded-xl" />
      </div>
      {/* Bloco de conteúdo */}
      <div className="bg-surface-container-high h-64 rounded-xl" />
    </div>
  );
}
