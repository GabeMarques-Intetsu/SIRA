import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Solicitar cadastro · SIRA",
};

export default function CadastroPage() {
  return <SignupForm />;
}
