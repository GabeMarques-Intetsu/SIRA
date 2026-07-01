# F-10 — Isolamento de Segurança e Privacidade de Dados por Usuário

> **Tipo**: Feature
> **Epic pai**: [EP-03 Camada de Persistência](../epics/EP-03-camada-de-persistencia.md)
> **Status**: 📝 Proposto
> **Prioridade**: 🔴 Imediato
> **Origem (requisitos)**: [RF-003](../../requirements/RF/RF-003-isolamento-e-continuidade-dos-dados-pessoais-de-.md)
> **Origem (OpenProject)**: #27371

---

## Descrição (visão de produto)

Garante que os dados pessoais de reserva de cada usuário fiquem isolados dos demais no mesmo navegador: um usuário nunca vê os dados de outro. Dados comuns a todos, como a lista de salas, permanecem compartilhados.

## Requisitos atendidos (rastreabilidade ↑)

| RF                                                                                         | Requisito                                               | Relação |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------- | ------- |
| [RF-003](../../requirements/RF/RF-003-isolamento-e-continuidade-dos-dados-pessoais-de-.md) | Isolamento e continuidade dos dados pessoais de reserva | Realiza |

## Critérios de Aceitação (CAs)

**Grupo:** `CA - Privacidade e isolamento de dados`

| ID       | Critério                                                                                         | Como verificar | Status |
| -------- | ------------------------------------------------------------------------------------------------ | -------------- | ------ |
| **CA01** | Um usuário logado nunca vê reservas ou dados pessoais de outro usuário no mesmo navegador.       | —              | 📝     |
| **CA02** | Ao trocar de usuário no mesmo navegador, passam a ser exibidos apenas os dados do usuário atual. | —              | 📝     |
| **CA03** | Sair do sistema não apaga os dados pessoais; eles reaparecem no próximo login do mesmo usuário.  | —              | 📝     |
| **CA04** | Dados comuns a todos (como a lista de salas) permanecem visíveis para qualquer usuário.          | —              | 📝     |
| **CA05** | Se o armazenamento do navegador ficar cheio, o sistema avisa com mensagem amigável, sem quebrar. | —              | 📝     |
| **CA06** | Tentativa de acessar dados de outro usuário não retorna nada.                                    | —              | 📝     |

## User Stories

### US10.1 — Proteção e Privacidade de Informações Pessoais

> **Como** administrador do SIRA
> **Quero** poder realizar buscas textuais pelo nome do professor solicitante e filtrar por sala específica dentro da fila
> **Para** agilizar a localização de registros de alta urgência.

#### Cenários BDD

````gherkin
# language: pt
Funcionalidade: Proteção e privacidade de informações pessoais

  Cenário: Usuário não enxerga dados de outro no mesmo navegador
    Dado que a professora "Ana" está logada e possui reservas cadastradas
    E o professor "Bruno" usa o mesmo navegador
    Quando "Bruno" faz login
    Então o sistema exibe apenas as reservas de "Bruno"
    E nenhuma reserva de "Ana" aparece

  Cenário: Dados pessoais permanecem após o logout
    Dado que "Ana" possui reservas e está logada
    Quando "Ana" sai do sistema e entra novamente
    Então suas reservas anteriores continuam disponíveis
```.

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #28338
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05, CA06

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Proteção e privacidade de informações pessoais

  Cenário: Usuário não enxerga dados de outro no mesmo navegador
    Dado que a professora "Ana" está logada e possui reservas cadastradas
    E o professor "Bruno" usa o mesmo navegador
    Quando "Bruno" faz login
    Então o sistema exibe apenas as reservas de "Bruno"
    E nenhuma reserva de "Ana" aparece

  Cenário: Dados pessoais permanecem após o logout
    Dado que "Ana" possui reservas e está logada
    Quando "Ana" sai do sistema e entra novamente
    Então suas reservas anteriores continuam disponíveis
````

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                                                                                     | Status |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T10.1.1 | Garantir em getStore/loadCollection (src/data/store.js) que toda leitura de coleção pessoal use a chave prefixada por e-mail via buildCollectionKey(email, collection), nunca uma chave fixa, isolando reservations/notifications/approvals por usuário. | ⏳     |
| T10.1.2 | Atualizar CURRENT_USER em login() e zerar em logout() (src/data/store.js) de modo que getReservations()/getNotifications() para usuário não-admin sempre filtrem por CURRENT_USER.email, exibindo só os dados do logado.                                 | ⏳     |
| T10.1.3 | Validar que logout() (src/data/store.js) remova apenas 'sira-auth' e nunca apague as chaves sira_db/<email>/\*.json, preservando os dados pessoais para reaparecerem no próximo login do mesmo e-mail.                                                   | ⏳     |
| T10.1.4 | Manter getRooms() lendo de GLOBAL_ROOMS_KEY (sira_db/\_global/rooms.json) independente do usuário logado, garantindo que a lista de salas continue visível para qualquer usuário (dado comum compartilhado).                                             | ⏳     |

### US10.2 — Resiliência do Sistema contra Falhas de Armazenamento

> **Como** desenvolvedor
> **Quero** separar o armazenamento de configurações comuns daqueles que são privados e tratar limites de cota física do navegador
> **Para** garantir a resiliência da aplicação.

#### Cenários BDD

````gherkin
# language: pt
Funcionalidade: Resiliência contra falhas de armazenamento

  Cenário: Armazenamento cheio é tratado com aviso amigável
    Dado que o armazenamento do navegador está cheio
    Quando o usuário tenta salvar uma nova reserva
    Então o sistema exibe uma mensagem amigável de armazenamento cheio
    E não trava nem perde os dados já salvos

  Cenário: Acesso a dado de outro usuário não retorna nada
    Dado que o usuário "Bruno" está logado
    Quando o sistema tenta acessar um dado pertencente a "Ana"
    Então nada é retornado
```.

- **Prioridade**: 🟡 Normal · **Estimativa**: _a estimar_ · **Status**: 📝
- **Origem (OpenProject)**: #28340
- **CAs cobertos**: CA01, CA02, CA03, CA04, CA05, CA06

#### Cenários BDD (Gherkin)

```gherkin
# language: pt
Funcionalidade: Resiliência contra falhas de armazenamento

  Cenário: Armazenamento cheio é tratado com aviso amigável
    Dado que o armazenamento do navegador está cheio
    Quando o usuário tenta salvar uma nova reserva
    Então o sistema exibe uma mensagem amigável de armazenamento cheio
    E não trava nem perde os dados já salvos

  Cenário: Acesso a dado de outro usuário não retorna nada
    Dado que o usuário "Bruno" está logado
    Quando o sistema tenta acessar um dado pertencente a "Ana"
    Então nada é retornado
````

#### Tasks (nível técnico — termo técnico permitido)

| ID      | Task                                                                                                                                                                                                                                            | Status |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| T10.2.1 | Separar fisicamente o storage comum do privado em store.js: salas via GLOBAL_ROOMS_KEY/saveRooms e demais coleções via buildCollectionKey(email, collection), assegurando que dados compartilhados e pessoais nunca compartilhem a mesma chave. | ⏳     |
| T10.2.2 | Envolver localStorage.setItem em saveCollection() e saveRooms() (src/data/store.js) num try/catch que detecte QuotaExceededError e retorne erro tratado em vez de lançar exceção, sem corromper os dados já gravados.                           | ⏳     |
| T10.2.3 | Disparar via modal/toast (src/components/modal.js) uma mensagem amigável de 'armazenamento cheio' quando saveCollection() falhar por cota, mantendo a aplicação funcional.                                                                      | ⏳     |
| T10.2.4 | Garantir em loadCollection(collection, email) que, ao solicitar dado de outro usuário sem chave correspondente, o retorno seja array vazio (sem vazar dados de terceiros), cobrindo o cenário de acesso cruzado.                                | ⏳     |
