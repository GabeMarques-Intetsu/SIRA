"use client";

/**
 * Menu dropdown reutilizável que SOBREPÕE qualquer ancestral com `overflow`
 * (tabelas, `<main>` com `overflow-y-auto`). O painel é renderizado via
 * `createPortal` no `document.body` com `position: fixed`, posicionado a partir
 * do `getBoundingClientRect()` do botão-âncora — assim não é recortado pelo
 * clipping do contêiner (corrige o BUG 2: popovers "embaixo").
 *
 * Acessibilidade (WCAG 2.2 AA):
 *  - âncora: `aria-haspopup="menu"` + `aria-expanded` (controlado aqui);
 *  - painel: `role="menu"`, itens via `<DropdownItem>` com `role="menuitem"`;
 *  - fecha com Esc e clique-fora; foca o primeiro item ao abrir e devolve o
 *    foco à âncora ao fechar (sem armadilha de teclado — WCAG 2.1.2);
 *  - reposiciona no scroll/resize para acompanhar a âncora.
 *
 * Determinístico e SSR-safe: o portal só monta no client (guarda `mounted`).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface DropdownMenuProps {
  /** Conteúdo do botão-âncora (ícone, avatar+nome, etc.). */
  trigger: ReactNode;
  /** `aria-label` da âncora (obrigatório p/ ícones sem texto). */
  triggerLabel: string;
  /** `aria-label` do painel `role="menu"`. */
  menuLabel: string;
  /** Itens do menu — use `<DropdownItem>`. */
  children: ReactNode;
  /** Classe da âncora (mantém o estilo de cada local de uso). */
  triggerClassName?: string;
  /** Alinhamento horizontal do painel à âncora. */
  align?: "start" | "end";
  /** Largura do painel (token arbitrário Tailwind, ex. `w-[13rem]`). */
  menuClassName?: string;
}

interface MenuCtx {
  close: () => void;
}
const DropdownCtx = createContext<MenuCtx | null>(null);

interface Coords {
  top: number;
  left: number;
  /** Largura da âncora, para alinhar `end`. */
  anchorRight: number;
}

export function DropdownMenu({
  trigger,
  triggerLabel,
  menuLabel,
  children,
  triggerClassName,
  align = "end",
  menuClassName = "w-[13rem]",
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const reposition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ top: r.bottom + 4, left: r.left, anchorRight: r.right });
  }, []);

  // Posiciona ao abrir (layout effect: antes da pintura, sem flicker/CLS).
  useLayoutEffect(() => {
    if (open) reposition();
  }, [open, reposition]);

  // Acompanha scroll/resize enquanto aberto; fecha com Esc / clique-fora.
  useEffect(() => {
    if (!open) return;
    const onScrollResize = () => reposition();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        anchorRef.current?.focus();
      }
    };
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t) || panelRef.current?.contains(t))
        return;
      setOpen(false);
    };
    window.addEventListener("scroll", onScrollResize, true);
    window.addEventListener("resize", onScrollResize);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      window.removeEventListener("scroll", onScrollResize, true);
      window.removeEventListener("resize", onScrollResize);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, reposition]);

  // Foca o primeiro item ao abrir (gestão de foco — WCAG 2.4.3).
  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"]:not([disabled])',
    );
    first?.focus();
  }, [open, coords]);

  const close = useCallback(() => {
    setOpen(false);
    anchorRef.current?.focus();
  }, []);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={triggerLabel}
        className={triggerClassName}
      >
        {trigger}
      </button>

      {open &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={panelRef}
            id={menuId}
            role="menu"
            aria-label={menuLabel}
            className={`bg-surface-container-high border-outline-variant fixed z-50 flex flex-col rounded-lg border py-1 shadow-lg ${menuClassName}`}
            style={
              align === "end"
                ? {
                    top: coords.top,
                    right: window.innerWidth - coords.anchorRight,
                  }
                : { top: coords.top, left: coords.left }
            }
          >
            <DropdownCtx.Provider value={{ close }}>
              {children}
            </DropdownCtx.Provider>
          </div>,
          document.body,
        )}
    </>
  );
}

interface DropdownItemProps {
  children: ReactNode;
  /** Ícone Material Symbol opcional (à esquerda). */
  icon?: string;
  onSelect?: () => void;
  disabled?: boolean;
  /** Variante destrutiva (excluir): cor de erro. */
  destructive?: boolean;
  className?: string;
}

/** Item de ação do menu (`role="menuitem"`). Fecha o menu ao selecionar. */
export function DropdownItem({
  children,
  icon,
  onSelect,
  disabled,
  destructive,
  className = "",
}: DropdownItemProps) {
  const ctx = useContext(DropdownCtx);
  return (
    <button
      role="menuitem"
      type="button"
      disabled={disabled}
      onClick={() => {
        ctx?.close();
        onSelect?.();
      }}
      className={`px-md py-sm text-body-sm gap-sm flex items-center text-left disabled:opacity-60 ${
        destructive
          ? "text-error hover:bg-error-container"
          : "text-on-surface hover:bg-surface-container-highest"
      } ${className}`}
    >
      {icon && (
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18 }}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}

interface DropdownItemLinkProps {
  href: string;
  children: ReactNode;
  icon?: string;
  className?: string;
}

/** Item de navegação do menu (`role="menuitem"` num `<Link>`). Fecha ao clicar. */
export function DropdownItemLink({
  href,
  children,
  icon,
  className = "",
}: DropdownItemLinkProps) {
  const ctx = useContext(DropdownCtx);
  return (
    <Link
      role="menuitem"
      href={href}
      onClick={() => ctx?.close()}
      className={`px-md py-sm text-body-sm text-on-surface hover:bg-surface-container-highest gap-sm flex items-center text-left ${className}`}
    >
      {icon && (
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 18 }}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      {children}
    </Link>
  );
}

/** Acesso ao `close()` do menu para itens customizados (ex.: form de logout). */
export function useDropdownClose(): () => void {
  return useContext(DropdownCtx)?.close ?? (() => {});
}

/** Separador visual entre grupos de itens. */
export function DropdownSeparator() {
  return <hr className="border-outline-variant my-1" role="separator" />;
}
