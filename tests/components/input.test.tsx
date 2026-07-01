/**
 * Testes de componente do <Input> e dos primitivos de formulário (Form*),
 * focados no CABEAMENTO DE ACESSIBILIDADE (WCAG 2.2 AA) que esses primitivos
 * garantem: `aria-invalid` no controle e a mensagem de erro exposta via
 * `FormMessage` com `role="alert"` e associada por `aria-describedby`.
 *
 * Para exercitar `FormControl`/`FormMessage` (que dependem de `useFormField`),
 * montamos uma árvore RHF mínima real — sem mockar a lógica sob teste.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";

import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

describe("Input", () => {
  it("reflete o estado de erro via aria-invalid", () => {
    render(<Input aria-label="Nome" aria-invalid={true} />);
    const input = screen.getByLabelText("Nome");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("encaminha o type e demais props para o <input> nativo", () => {
    render(<Input aria-label="E-mail" type="email" placeholder="voce@ifpb" />);
    const input = screen.getByLabelText("E-mail");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("placeholder", "voce@ifpb");
  });
});

/** Harness: um campo RHF com erro pré-definido para exercitar Form* + a11y. */
function FieldWithError() {
  const form = useForm({
    defaultValues: { email: "" },
    errors: { email: { type: "manual", message: "Campo obrigatório." } },
  });

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>E-mail</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}

describe("FormControl + FormMessage (a11y)", () => {
  it("marca o controle como inválido e expõe a mensagem com role=alert", () => {
    render(<FieldWithError />);

    const input = screen.getByLabelText("E-mail");
    expect(input).toHaveAttribute("aria-invalid", "true");

    const message = screen.getByRole("alert");
    expect(message).toHaveTextContent("Campo obrigatório.");

    // A mensagem deve estar referenciada por aria-describedby do controle (WCAG).
    expect(input.getAttribute("aria-describedby")).toContain(message.id);
  });
});
