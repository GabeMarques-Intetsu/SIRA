# F-48 — Imagem do equipamento

> **Tipo**: Feature
> **Epic pai**: [EP-09 Gestão de Recursos (Salas e Equipamentos)](../epics/EP-09-gestao-de-salas-admin.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🟡 Normal
> **Origem (requisitos)**: [RF-013](../../requirements/RF/RF-013-gestao-do-catalogo-de-equipamentos.md) · [RNF-imagem-de-recurso](../../requirements/RNF/RNF-imagem-de-recurso.md)

---

## Descrição (visão de produto)

Permite ao administrador anexar uma imagem opcional ao equipamento, tanto no cadastro quanto na edição. A imagem aparece no card do equipamento (no catálogo e na busca) e no detalhe do equipamento, ajudando o professor a reconhecer o item de relance. Quando o equipamento não tem imagem, o sistema mantém o ícone padrão atual. O administrador pode pré-visualizar a imagem antes de salvar, substituí-la ou removê-la.

## Requisitos atendidos (rastreabilidade ↑)

| RF / RNF                                                                     | Requisito                          | Relação   |
| ---------------------------------------------------------------------------- | ---------------------------------- | --------- |
| [RF-013](../../requirements/RF/RF-013-gestao-do-catalogo-de-equipamentos.md) | Gestão do catálogo de equipamentos | Realiza   |
| [RNF-imagem-de-recurso](../../requirements/RNF/RNF-imagem-de-recurso.md)     | Formato e tamanho da imagem        | Restringe |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Anexo da imagem`

| ID       | Critério                                                                      | Como verificar | Status |
| -------- | ----------------------------------------------------------------------------- | -------------- | ------ |
| **CA01** | A imagem do equipamento é opcional, tanto no cadastro quanto na edição.       | —              | 📝     |
| **CA02** | São aceitos apenas os formatos JPG, PNG ou WebP.                              | —              | 📝     |
| **CA03** | A imagem deve ter no máximo 2 MB; arquivos maiores são recusados com aviso.   | —              | 📝     |
| **CA04** | Cada equipamento tem no máximo uma imagem.                                    | —              | 📝     |
| **CA05** | Antes de salvar, o administrador vê uma pré-visualização da imagem escolhida. | —              | 📝     |

**Grupo:** `CA - Substituir e remover`

| ID       | Critério                                                                        | Como verificar | Status |
| -------- | ------------------------------------------------------------------------------- | -------------- | ------ |
| **CA06** | Na edição, é possível substituir a imagem existente por outra.                  | —              | 📝     |
| **CA07** | Na edição, é possível remover a imagem, voltando o equipamento ao ícone padrão. | —              | 📝     |

**Grupo:** `CA - Exibição`

| ID       | Critério                                                                                | Como verificar | Status |
| -------- | --------------------------------------------------------------------------------------- | -------------- | ------ |
| **CA08** | A imagem do equipamento aparece no card (catálogo e busca) e no detalhe do equipamento. | —              | 📝     |
| **CA09** | Quando o equipamento não tem imagem, o card e o detalhe mostram o ícone padrão atual.   | —              | 📝     |

## User Stories

### US48.1 — Anexo da imagem do equipamento

> **Como** administrador, **quero** anexar, trocar ou remover uma imagem do equipamento no cadastro e na edição, **para** que professores reconheçam o item de relance no catálogo e na busca.

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Imagem do equipamento

  Cenário: Cadastrar um equipamento com imagem
    Dado que estou na aba Equipamentos da gestão de recursos
    Quando preencho os dados do equipamento e escolho uma imagem em formato WebP com 800 KB
    Então vejo a pré-visualização da imagem antes de salvar
    E ao salvar o equipamento fica com a imagem no card e no detalhe

  Cenário: Editar um equipamento trocando a imagem
    Dado que o equipamento "Projetor 04" já tem uma imagem
    Quando edito o equipamento e escolho uma nova imagem válida
    Então a imagem anterior é substituída pela nova no card e no detalhe

  Cenário: Remover a imagem de um equipamento
    Dado que o equipamento "Projetor 04" tem uma imagem
    Quando edito o equipamento e removo a imagem
    Então o equipamento volta a exibir o ícone padrão no card e no detalhe

  Cenário: Imagem em formato inválido é recusada
    Dado que estou na aba Equipamentos da gestão de recursos
    Quando escolho um arquivo em formato BMP
    Então sou avisado de que só são aceitos JPG, PNG ou WebP
    E a imagem não é anexada

  Cenário: Imagem acima do tamanho máximo é recusada
    Dado que estou na aba Equipamentos da gestão de recursos
    Quando escolho uma imagem de 3 MB
    Então sou avisado de que o tamanho máximo é 2 MB
    E a imagem não é anexada

  Cenário: Equipamento sem imagem usa o ícone padrão
    Dado que o equipamento "Microfone 01" foi cadastrado sem imagem
    Quando vejo o card e o detalhe do equipamento "Microfone 01"
    Então é exibido o ícone padrão atual
```

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **CAs cobertos**: CA01–CA09 · **Status**: 📝

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                                                                                                                                             | Status |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T48.1.1 | Adicionar ao formulário de equipamento (`src/app/(app)/_resources/resource-form.tsx`, modo equipment) um campo de imagem opcional com `accept="image/jpeg,image/png,image/webp"` e validação client-side de tipo e tamanho ≤ 2 MB (CA01, CA02, CA03).                                                            | ⏳     |
| T48.1.2 | Renderizar pré-visualização do arquivo escolhido via `URL.createObjectURL` antes do envio, com botão de remover (CA05, CA07).                                                                                                                                                                                    | ⏳     |
| T48.1.3 | Estender `equipmentSchema` (`src/schemas/resource.ts`) e `validateEquipmentInput` (`src/lib/resources.ts`) com `imagePath` nullable e os limites de tipo/tamanho (CA01–CA04) — alinhado a [RNF-imagem-de-recurso](../../requirements/RNF/RNF-imagem-de-recurso.md).                                              | ⏳     |
| T48.1.4 | Em `resource-actions.ts`, no create/update do equipamento: upload server-side ao bucket `resource-images` via service-role e gravar `equipment.image_path`; em substituição/remoção, apagar o objeto anterior (CA06, CA07) — ver [ADR-008](../../planning/adrs/ADR-008-armazenamento-de-imagens-de-recursos.md). | ⏳     |
| T48.1.5 | Exibir a imagem no card e no detalhe do equipamento, com fallback para o ícone padrão quando `image_path` é nulo (CA08, CA09).                                                                                                                                                                                   | ⏳     |

## Dependências técnicas (Tasks transversais)

- [TX-09](../epics/EP-atividades-complementares.md) — bucket `resource-images` no Supabase Storage + policy de escrita (admin via service-role) e leitura.
- [TX-11](../epics/EP-atividades-complementares.md) — coluna `image_path text null` em `equipment`.
