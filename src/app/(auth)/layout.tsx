import { ThemeToggle } from "@/components/shell/theme-toggle";

/**
 * Layout das telas de autenticação (espelha o mockup 01-login / 07-cadastro):
 * painel de branding à esquerda (≥ lg) + área de formulário à direita.
 * Grid 50/50 estrito (minmax(0,1fr)) + formulário limitado a 420px — evita
 * que o painel do formulário "roube" largura e colapse o branding.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface text-on-surface grid min-h-screen w-full lg:grid-cols-2">
      <a href="#auth-content" className="skip-link">
        Pular para o conteúdo
      </a>

      {/* ───── Painel de branding (esquerda) ───── */}
      <section className="bg-primary p-xxl relative hidden min-w-0 flex-col justify-between overflow-hidden lg:flex">
        <div aria-hidden="true" className="absolute inset-0 opacity-20">
          <svg
            className="h-full w-full"
            viewBox="0 0 800 800"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <defs>
              <pattern
                id="grid"
                width="80"
                height="80"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 80 0 L 0 0 0 80"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="800" height="800" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="bg-surface-container-lowest mb-lg flex h-16 w-16 items-center justify-center rounded-xl shadow-sm">
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontSize: 40 }}
              aria-hidden="true"
            >
              domain
            </span>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-[32rem]">
          <h2 className="text-headline-lg text-on-primary mb-md text-balance">
            Gestão de recursos simplificada.
          </h2>
          <p className="text-body-lg text-on-primary/90 text-pretty">
            Acesse o SIRA para reservar laboratórios, auditórios e equipamentos
            do IFPB de forma rápida e segura.
          </p>

          <ul className="mt-xl space-y-md text-on-primary/85">
            {[
              "Calendário semanal sincronizado entre coordenações",
              "Fluxo de aprovação com notificações em tempo real",
              "Reserva única para salas + equipamentos",
            ].map((item) => (
              <li key={item} className="gap-sm flex items-start">
                <span
                  className="material-symbols-outlined text-on-primary mt-0.5 shrink-0"
                  aria-hidden="true"
                >
                  check_circle
                </span>
                <span className="text-body-md">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-on-primary/70 text-body-sm relative z-10">
          © 2025 IFPB · SIRA v1.0
        </div>
      </section>

      {/* ───── Painel do formulário (direita) ───── */}
      <section
        id="auth-content"
        className="bg-surface p-margin-mobile md:p-margin-desktop relative flex min-w-0 items-center justify-center"
      >
        <div className="right-md top-md absolute z-10">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-[420px]">{children}</div>
      </section>
    </div>
  );
}
