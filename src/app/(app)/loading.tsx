/**
 * Fallback de carregamento do grupo (app). Cria um Suspense boundary em torno do
 * conteúdo da página.
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
    </div>
  );
}