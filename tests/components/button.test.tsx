/**
 * Testes de componente do <Button> (primitivo shadcn/ui + cva + Radix Slot).
 *
 * Foco no COMPORTAMENTO observável no DOM (jsdom não roda CSS dos tokens M3, então
 * verificamos roles/texto/atributos e a presença de CLASSES de variante — não a cor
 * computada). Cobre: render do rótulo, troca de variante (classe muda), clique
 * disparando handler, estado disabled e o `asChild` renderizando como <a>.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renderiza como <button> com o texto acessível", () => {
    render(<Button>Entrar</Button>);
    const btn = screen.getByRole("button", { name: "Entrar" });
    expect(btn).toBeInTheDocument();
    expect(btn.tagName).toBe("BUTTON");
  });

  it("aplica classes diferentes conforme a variante", () => {
    const { rerender } = render(<Button variant="primary">X</Button>);
    const primaryClass = screen.getByRole("button").className;

    rerender(<Button variant="destructive">X</Button>);
    const destructiveClass = screen.getByRole("button").className;

    expect(primaryClass).not.toBe(destructiveClass);
    expect(destructiveClass).toContain("text-error");
  });

  it("dispara onClick ao ser clicado", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Confirmar</Button>);

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("não dispara onClick quando disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button disabled onClick={onClick}>
        Bloqueado
      </Button>,
    );

    const btn = screen.getByRole("button", { name: "Bloqueado" });
    expect(btn).toBeDisabled();
    await user.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("com asChild renderiza o filho <a> como raiz, preservando as classes", () => {
    render(
      <Button asChild>
        <a href="/cadastro">Solicitar cadastro</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Solicitar cadastro" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "/cadastro");
    // A classe de variante do Button é mesclada no <a> (Slot).
    expect(link.className).toContain("inline-flex");
  });
});
