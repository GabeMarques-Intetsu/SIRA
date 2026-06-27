interface PlaceholderProps {
  title: string;
  icon: string;
  description?: string;
}

/** Placeholder de tela em construção (telas de domínio chegam na fase P4). */
export function Placeholder({ title, icon, description }: PlaceholderProps) {
  return (
    <div className="gap-lg mx-auto flex max-w-[1280px] flex-col">
      <h1 className="text-headline-md text-on-surface">{title}</h1>
      {/* O container visual do ícone e da descrição será adicionado no próximo commit */}
    </div>
  );
}