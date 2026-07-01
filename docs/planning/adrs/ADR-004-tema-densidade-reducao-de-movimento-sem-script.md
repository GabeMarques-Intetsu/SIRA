# ADR-004: Aplicar tema, densidade e redução de movimento sem `<script>`, via next-themes + atributos server-side

## Status

Accepted

Decisão de camada de apresentação (front) que materializa F-38 / RF-012, complementando o schema de `user_preferences` definido no ADR-001.

## Context

As preferências de interface (F-38) têm três eixos a aplicar em toda a app: **tema** (claro/escuro/sistema — CA03), **densidade** (confortável/compacta — CA08) e **redução de movimento** (CA09/CA10). Cada um persiste em `user_preferences` (por conta) e precisa valer imediatamente, sem flash e sem reload. As forças:

1. **Tema** — padrão consagrado é o next-themes (alterna classe `.dark` e injeta um pequeno `<script>` inline anti-flash no `<head>`). Persistência por conta exige sincronizar next-themes (client) com `user_preferences` (banco).
2. **Densidade e reduce-motion** — não são "tema"; precisam cascatear por toda a árvore. Duas formas de aplicá-los no boot:
   - **`<script>` inline** lendo a preferência e setando atributo/classe antes da pintura — o jeito clássico anti-flash.
   - **Atributo/classe renderizados pelo servidor** num wrapper que envolve a app.
3. **Restrição do React 19** — um `<script>` injetado manualmente no corpo **não é re-executado** em navegação client-side e dispara erro de hidratação; isso quebrava a rota `/configuracoes`.

## Decision

**next-themes para o tema (persistido em `user_preferences`), e densidade + redução de movimento aplicadas por atributos renderizados no servidor**, num wrapper `display:contents` no layout protegido — **sem `<script>` manual**.

- **Tema → next-themes + `user_preferences`.** next-themes cuida da classe e do anti-flash; a preferência é persistida por conta no banco (`savePreferencesAction`) e o next-themes aplica no client sem reload (CA03).
- **Densidade → `[data-density]` + tokens `--spacing-*`.** O `AppLayout` (Server Component) lê `density` de `user_preferences` e seta `data-density` num `<div className="contents">`. `[data-density="compact"]` em `globals.css` reduz o passo da escala `--spacing-{sm,md,lg,xl,xxl}`; como os utilitários (`p-md`, `gap-lg`…) referenciam esses tokens, a interface inteira aperta **sem tocar no markup**.
- **Reduce-motion → classe `.reduce-motion` no mesmo wrapper.** O servidor adiciona a classe quando `reduce_motion` é true; `.reduce-motion *` zera durações de animação/transição. O `@media (prefers-reduced-motion)` cobre a preferência do SO independentemente.
- **`display:contents` no wrapper.** O `<div>` portador dos atributos não introduz caixa no layout (`className="contents"`), então não interfere no fluxo do `AppShell`. Renderizado no servidor: sem flash, sem hidratação de `<script>`, sem o erro do React 19.

## Consequences

**Positivas:**

- Corrige o bug que quebrava `/configuracoes`: nada de `<script>` manual re-executado em navegação (compatível com React 19).
- Sem flash de densidade/movimento — o atributo já vem pintado do servidor.
- Densidade sem mexer no markup: alterar tokens propaga por herança a toda a UI; um só ponto de verdade.
- Preferências por conta, consistentes entre dispositivos (vêm do banco, não só de `localStorage`).

**Negativas / trade-offs aceitos:**

- O wrapper `display:contents` é necessário para portar os atributos sem criar caixa; quem não conhecer o padrão pode estranhar o `<div className="contents">` no layout.
- Densidade depende de toda a UI consumir os tokens `--spacing-*` (via utilitários), não pixels mágicos hardcoded — uma disciplina a manter (ver ADR-005).
- Duas fontes de tema coexistem (next-themes no client + `user_preferences` no banco) e precisam ser mantidas em sincronia pela action de salvar.

## Cross-ref

- Implementação: `src/app/(app)/layout.tsx` (wrapper `data-density`/`.reduce-motion`), `src/app/globals.css` (`[data-density="compact"]`, `.reduce-motion`), `src/app/(app)/configuracoes/actions.ts` (`savePreferencesAction`).
- Requisitos: RF-012; F-38 (CA03/CA08/CA09/CA10).
- Refina: [ADR-001](./ADR-001-schema-inicial-e-rls-supabase.md) (tabela `user_preferences`).
- Relacionado: [ADR-005](./ADR-005-largura-arbitraria-no-tailwind-v4.md) (consumo dos tokens de spacing).
