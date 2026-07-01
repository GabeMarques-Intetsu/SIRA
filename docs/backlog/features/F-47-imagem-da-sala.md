# F-47 — Imagem da sala

> **Tipo**: Feature
> **Epic pai**: [EP-09 Gestão de Recursos (Salas e Equipamentos)](../epics/EP-09-gestao-de-salas-admin.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-009](../../requirements/RF/RF-009-gestao-do-catalogo-de-salas.md) · [RNF-imagem-de-recurso](../../requirements/RNF/RNF-imagem-de-recurso.md)

---

## Descrição (visão de produto)

Permite ao administrador anexar uma imagem opcional à sala, tanto no cadastro quanto na edição. A imagem aparece no card da sala (no catálogo e na busca) e no detalhe da sala, ajudando o professor a reconhecer o espaço de relance. Quando a sala não tem imagem, o sistema mantém o ícone padrão atual. O administrador pode pré-visualizar a imagem antes de salvar, substituí-la ou removê-la.

## Requisitos atendidos (rastreabilidade ↑)

| RF / RNF                                                                 | Requisito                   | Relação   |
| ------------------------------------------------------------------------ | --------------------------- | --------- |
| [RF-009](../../requirements/RF/RF-009-gestao-do-catalogo-de-salas.md)    | Gestão do catálogo de salas | Realiza   |
| [RNF-imagem-de-recurso](../../requirements/RNF/RNF-imagem-de-recurso.md) | Formato e tamanho da imagem | Restringe |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Anexo da imagem`

| ID       | Critério                                                                      | Como verificar | Status |
| -------- | ----------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | A imagem da sala é opcional, tanto no cadastro quanto na edição.              | —              | 📝     |
| **CA02** | São aceitos apenas os formatos JPG, PNG ou WebP.                              | —              | 📝     |
| **CA03** | A imagem deve ter no máximo 2 MB; arquivos maiores são recusados com aviso.   | —              | 📝     |
| **CA04** | Cada sala tem no máximo uma imagem.                                           | —              | 📝     |
| **CA05** | Antes de salvar, o administrador vê uma pré-visualização da imagem escolhida. | —              | 📝     |

**Grupo:** `CA - Substituir e remover`

| ID       | Critério                                                                 | Como verificar | Status |
| -------- | ------------------------------------------------------------------------ | -------------- | ------ |
| **CA06** | Na edição, é possível substituir a imagem existente por outra.           | —              | 📝     |
| **CA07** | Na edição, é possível remover a imagem, voltando a sala ao ícone padrão. | —              | 📝     |

**Grupo:** `CA - Exibição`

| ID       | Critério                                                                          | Como verificar | Status |
| -------- | --------------------------------------------------------------------------------- | -------------- | ------ |
| **CA08** | A imagem da sala aparece no card da sala (catálogo e busca) e no detalhe da sala. | —              | 📝     |
| **CA09** | Quando a sala não tem imagem, o card e o detalhe mostram o ícone padrão atual.    | —              | 📝     |

## User Stories

### US47.1 — Anexo da imagem da sala

> **Como** administrador, **quero** anexar, trocar ou remover uma imagem da sala no cadastro e na edição, **para** que professores reconheçam o espaço de relance no catálogo e na busca.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Imagem da sala

  Cenário: Cadastrar uma sala com imagem
    Dado que estou na tela de cadastro de salas
    Quando preencho os dados da sala e escolho uma imagem em formato PNG com 1 MB
    Então vejo a pré-visualização da imagem antes de salvar
    E ao salvar a sala fica com a imagem no card e no detalhe

  Cenário: Editar uma sala trocando a imagem
    Dado que a sala "Lab 1" já tem uma imagem
    Quando edito a sala e escolho uma nova imagem válida
    Então a imagem anterior é substituída pela nova no card e no detalhe

  Cenário: Remover a imagem de uma sala
    Dado que a sala "Lab 1" tem uma imagem
    Quando edito a sala e removo a imagem
    Então a sala volta a exibir o ícone padrão no card e no detalhe

  Cenário: Imagem em formato inválido é recusada
    Dado que estou na tela de cadastro de salas
    Quando escolho um arquivo em formato GIF
    Então sou avisado de que só são aceitos JPG, PNG ou WebP
    E a imagem não é anexada

  Cenário: Imagem acima do tamanho máximo é recusada
    Dado que estou na tela de cadastro de salas
    Quando escolho uma imagem de 5 MB
    Então sou avisado de que o tamanho máximo é 2 MB
    E a imagem não é anexada

  Cenário: Sala sem imagem usa o ícone padrão
    Dado que a sala "Lab 2" foi cadastrada sem imagem
    Quando vejo o card e o detalhe da sala "Lab 2"
    Então é exibido o ícone padrão atual
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **CAs cobertos**: CA01–CA09 · **Status**: 📝

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                                                                                                                                  | Status |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T47.1.1 | Adicionar ao formulário de sala (`src/app/(app)/_resources/resource-form.tsx`) um campo de imagem opcional com `accept="image/jpeg,image/png,image/webp"` e validação client-side de tipo e tamanho ≤ 2 MB (CA01, CA02, CA03).                                                                        | ⏳     |
| T47.1.2 | Renderizar pré-visualização do arquivo escolhido via `URL.createObjectURL` antes do envio, com botão de remover (CA05, CA07).                                                                                                                                                                         | ⏳     |
| T47.1.3 | Estender `roomSchema` (`src/schemas/resource.ts`) e a validação canônica (`validateRoomInput` em `src/lib/resources.ts`) com `imagePath` nullable e os limites de tipo/tamanho (CA01–CA04) — alinhado a [RNF-imagem-de-recurso](../../requirements/RNF/RNF-imagem-de-recurso.md).                     | ⏳     |
| T47.1.4 | Em `resource-actions.ts`, no create/update da sala: upload server-side ao bucket `resource-images` via service-role e gravar `rooms.image_path`; em substituição/remoção, apagar o objeto anterior (CA06, CA07) — ver [ADR-008](../../planning/adrs/ADR-008-armazenamento-de-imagens-de-recursos.md). | ⏳     |
| T47.1.5 | Exibir a imagem no card (`resource-page.tsx`/card) e no detalhe da sala, com fallback para o ícone padrão quando `image_path` é nulo (CA08, CA09).                                                                                                                                                    | ⏳     |

## Dependências técnicas (Tasks transversais)

- [TX-09](../epics/EP-atividades-complementares.md) — bucket `resource-images` no Supabase Storage + policy de escrita (admin via service-role) e leitura.
- [TX-10](../epics/EP-atividades-complementares.md) — coluna `image_path text null` em `rooms`.
