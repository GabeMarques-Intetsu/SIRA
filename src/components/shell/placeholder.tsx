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
      <div className="border-outline-variant bg-surface-container-low gap-md p-xxl flex flex-col items-center rounded-xl border text-center">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontSize: 48 }}
          aria-hidden="true"
        >
          {icon}
        </span>
        <p className="text-body-md text-on-surface-variant">
          {description ?? "Tela em construção — disponível em breve."}
        </p>
      </div>
    </div>
  );
}