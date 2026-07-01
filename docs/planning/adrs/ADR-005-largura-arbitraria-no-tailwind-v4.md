# ADR-005: Usar largura arbitrária `max-w-[NNrem]` no Tailwind v4 (colisão spacing × sizing)

## Status

Accepted

Convenção de código transversal ao front. Decorre da escala de spacing M3 portada dos mockups (ver ADR-004), que reusa os mesmos nomes `sm/md/lg/xl` que o Tailwind aplica aos utilitários de tamanho.

## Context

No Tailwind v4, o theme namespace `--spacing-*` alimenta **não só** os utilitários de espaçamento (`p-*`, `gap-*`, `m-*`) **mas também** os de dimensionamento: `max-w-*`, `min-w-*`, `w-*`, `h-*`. O SIRA define a escala M3 com nomes semânticos:

```css
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
```

Consequência traiçoeira: `max-w-lg` **não** resolve para os ~32rem que um dev espera do Tailwind padrão — resolve para `--spacing-lg` = **24px**. Um container que deveria ter 512px de largura máxima fica com 24px, quebrando o layout de forma silenciosa (sem erro de build). As opções:

1. **Renomear a escala de spacing** (ex.: `--spacing-2`, `--spacing-3`) para não colidir com `sm/md/lg/xl` — recupera o comportamento padrão dos utilitários de largura, mas perde a semântica M3 e desalinha do `tailwind-config.js` dos mockups.
2. **Manter a escala semântica e proibir `max-w-{sm,md,lg,xl}`**, usando sempre largura **arbitrária** (`max-w-[32rem]`) — preserva a semântica de spacing (que ADR-004 usa para densidade) ao custo de uma convenção de código.

## Decision

**Manter a escala de spacing semântica M3 e usar SEMPRE largura arbitrária `max-w-[NNrem]` (idem `w-`/`min-w-`).** É **proibido** usar `max-w-{sm,md,lg,xl}` e correlatos nomeados para largura. A regra está documentada como aviso em `globals.css`, junto à definição da escala.

A escala de spacing precisa ficar como está porque ADR-004 depende dela: a densidade compacta aperta a UI inteira sobrescrevendo `--spacing-*` — renomear quebraria esse mecanismo.

## Consequences

**Positivas:**

- Larguras sempre explícitas e previsíveis (`max-w-[32rem]` é inequívoco), imunes à colisão.
- A escala de spacing M3 permanece semântica e dirige a densidade (ADR-004) sem efeito colateral.
- Bug de layout silencioso (container de 24px) eliminado por convenção, com o aviso no ponto de definição.

**Negativas / trade-offs aceitos:**

- Convenção que vive na disciplina do time, não imposta pelo compilador: um `max-w-lg` esquecido passa no build e só aparece como layout quebrado. Mitigação: aviso em `globals.css`; candidato a regra de lint dedicada.
- Larguras arbitrárias são levemente mais verbosas e não autodocumentam um "tamanho nomeado".

## Cross-ref

- Documentação da regra: `src/app/globals.css` (bloco da escala `--spacing-*`, aviso "use SEMPRE valores arbitrarios").
- Relacionado: [ADR-004](./ADR-004-tema-densidade-reducao-de-movimento-sem-script.md) (densidade sobrescreve `--spacing-*`).
- Fonte da escala: `docs/mockups/_shared/tailwind-config.js`.
