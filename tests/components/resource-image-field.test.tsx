/**
 * Testes de componente do campo de imagem do recurso (F-47/F-48 · IMG02/IMG05/IMG07).
 *
 * Sob teste (de verdade, sem mock): a validação client (`validateImageFile`) e o
 * fluxo de preview/remoção do hook `useResourceImage`, renderizados pelo
 * `ImageField`. Mockado apenas o que é I/O incompatível com jsdom:
 *  - `./resource-actions` (Server Action — importa `server-only`/Supabase);
 *  - `next/navigation` (fora do runtime do Next);
 *  - `URL.createObjectURL`/`revokeObjectURL` (não existem em jsdom).
 *
 * `ImageField`/`useResourceImage` são exportados de forma mínima do
 * `resource-form.tsx` (são UI/hook puros, sem `server-only`) só para permitir
 * testá-los isolados sem montar o formulário inteiro — justificado no arquivo.
 *
 * Asserções por papel/rótulo acessível (getByLabelText/getByRole("alert"))
 * reforçam a acessibilidade do erro (WCAG 2.2 AA — erro com role="alert").
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// A Server Action puxa `server-only`/Supabase — mock para o módulo importar.
vi.mock("@/app/(app)/_resources/resource-actions", () => ({
  createRoomAction: vi.fn(),
  updateRoomAction: vi.fn(),
  createEquipmentAction: vi.fn(),
  updateEquipmentAction: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

import {
  ImageField,
  useResourceImage,
} from "@/app/(app)/_resources/resource-form";

/** Harness mínimo: liga o hook ao campo, como o form real faz. */
function Harness({ currentPath }: { currentPath?: string | null }) {
  const image = useResourceImage(currentPath);
  return <ImageField image={image} />;
}

/** Cria um File com type/size controlados (size via stub da propriedade). */
function makeFile(name: string, type: string, size: number): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://proj.supabase.co";
  // jsdom não implementa objectURL — stub determinístico p/ o preview.
  let n = 0;
  globalThis.URL.createObjectURL = vi.fn(() => `blob:mock-${++n}`);
  globalThis.URL.revokeObjectURL = vi.fn();
});

describe("ImageField (campo de imagem do recurso)", () => {
  it("renderiza o input de arquivo acessível e a dica de formato/tamanho", () => {
    render(<Harness />);

    // Label associada via htmlFor → o input é localizável por rótulo (a11y).
    expect(screen.getByLabelText(/imagem/i)).toBeInTheDocument();
    expect(
      screen.getByText(/JPG, PNG ou WebP · até 2 MB\./i),
    ).toBeInTheDocument();
    // Sem imagem inicial: nenhum preview nem botão de remover.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /remover imagem/i }),
    ).not.toBeInTheDocument();
  });

  it("arquivo de tipo inválido → erro acessível (role=alert) e sem preview (IMG02)", async () => {
    render(<Harness />);

    const input = screen.getByLabelText(/imagem/i) as HTMLInputElement;
    // Disparamos o `change` direto via fireEvent (não `user.upload`): o
    // `accept` do input filtraria o GIF no browser, mas a validação client
    // (`validateImageFile`) é a rede de segurança que precisamos exercitar
    // — um arquivo não permitido chegando ao `onChange` (IMG02).
    fireEvent.change(input, {
      target: { files: [makeFile("foto.gif", "image/gif", 1024)] },
    });

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/JPG, PNG ou WebP/i);
    // Erro cabeado por aria-describedby + aria-invalid (a11y).
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", alert.id);
    // Arquivo recusado: nenhum preview gerado.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("arquivo acima de 2 MB → erro acessível de tamanho e sem preview (IMG03)", async () => {
    render(<Harness />);

    const input = screen.getByLabelText(/imagem/i) as HTMLInputElement;
    fireEvent.change(input, {
      target: {
        files: [makeFile("grande.png", "image/png", 2 * 1024 * 1024 + 1)],
      },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /no máximo 2 MB/i,
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("arquivo válido → preview aparece e não há erro (IMG05)", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const input = screen.getByLabelText(/imagem/i) as HTMLInputElement;
    await user.upload(input, makeFile("ok.png", "image/png", 1024));

    const preview = await screen.findByRole("img");
    expect(preview).toBeInTheDocument();
    expect(preview).toHaveAttribute("alt", expect.stringMatching(/recurso/i));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it('botão "Remover imagem" some a imagem (IMG07/CA07)', async () => {
    const user = userEvent.setup();
    // Começa editando: já há uma imagem atual (preview da URL pública).
    render(<Harness currentPath="room/atual.png" />);

    // Preview inicial presente.
    expect(screen.getByRole("img")).toBeInTheDocument();
    const removeBtn = screen.getByRole("button", { name: /remover imagem/i });
    await user.click(removeBtn);

    // Após remover: sem preview e sem botão de remover.
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /remover imagem/i }),
    ).not.toBeInTheDocument();
  });
});
