/**
 * Testes de componente do <LoginForm> (F-01) — React Hook Form + Zod.
 *
 * Verifica a VALIDAÇÃO no client e a integração com a Server Action, sem tocar
 * em I/O real: a `loginAction` (que importa módulos `server-only`/Supabase, que
 * não rodam em jsdom) e `next/navigation` são MOCKADOS. A lógica sob teste — a
 * validação Zod e o cabeamento de a11y dos erros — NÃO é mockada.
 *
 * Asserções por papel/rótulo/texto acessível (getByRole/getByLabelText/findByText)
 * reforçam a acessibilidade (WCAG 2.2 AA).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock da Server Action: importá-la de verdade puxa `server-only`/Supabase.
const loginAction = vi.fn();
vi.mock("@/app/(auth)/login/actions", () => ({
  loginAction: (...args: unknown[]) => loginAction(...args),
}));

// `next/navigation` não funciona fora do runtime do Next em jsdom.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  redirect: vi.fn(),
}));

import { LoginForm } from "@/app/(auth)/login/login-form";

describe("LoginForm", () => {
  beforeEach(() => {
    loginAction.mockReset();
  });

  it("renderiza os campos e o botão de envio acessíveis", () => {
    render(<LoginForm />);

    expect(
      screen.getByRole("heading", { level: 1, name: "SIRA" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("E-mail institucional")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("ao submeter vazio, mostra as mensagens de validação do Zod e não chama a action", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: /entrar/i }));

    // E-mail vazio → "Informe o e-mail."; senha vazia → "Informe a senha."
    expect(await screen.findByText("Informe o e-mail.")).toBeInTheDocument();
    expect(await screen.findByText("Informe a senha.")).toBeInTheDocument();
    expect(loginAction).not.toHaveBeenCalled();
  });

  it("rejeita e-mail não institucional com a mensagem de domínio", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByLabelText("E-mail institucional"),
      "alguem@gmail.com",
    );
    await user.type(screen.getByLabelText("Senha"), "senha123");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    expect(
      await screen.findByText(
        "Somente e-mails institucionais @ifpb.edu.br são aceitos.",
      ),
    ).toBeInTheDocument();
    expect(loginAction).not.toHaveBeenCalled();
  });

  it("com dados válidos chama loginAction e exibe o erro do servidor (role=alert)", async () => {
    loginAction.mockResolvedValue({
      error: "E-mail ou senha incorretos. Verifique e tente novamente.",
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(
      screen.getByLabelText("E-mail institucional"),
      "professor@ifpb.edu.br",
    );
    await user.type(screen.getByLabelText("Senha"), "senha-errada");
    await user.click(screen.getByRole("button", { name: /entrar/i }));

    // O erro do servidor sobe num container role="alert".
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "E-mail ou senha incorretos. Verifique e tente novamente.",
    );
    expect(loginAction).toHaveBeenCalledTimes(1);
  });
});
