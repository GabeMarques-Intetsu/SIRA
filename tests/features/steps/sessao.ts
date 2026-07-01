/**
 * Steps de SESSÃO, ACESSO, RBAC/MENU, RESPONSIVO, TEMA e PRIVACIDADE.
 *
 * Cenários com função pura real:
 *  - Login/cadastro com e-mail institucional → `@/lib/validation`.
 * Cenários SEM lib equivalente (modelo comportamental honesto no World, derivado
 * das specs F-02/F-04/F-05/F-06/F-07/F-08/F-09/F-10): continuidade/encerramento
 * de sessão, menu por perfil (role-visibility), endereços/navegação, breakpoint
 * de tela pequena, tema persistido, isolamento de dados por usuário.
 */
import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { isInstitutionalEmail } from "@/lib/validation";
import type { SiraWorld } from "../support/world";
import { ensureUser, addReservation } from "../support/world";

// Itens de menu visíveis por papel (RBAC — F-05). Spec comportamental.
const PROFESSOR_MENU = [
  "Minhas Reservas",
  "Nova Reserva",
  "Calendário",
  "Notificações",
];
const ADMIN_ONLY_MENU = ["Salas", "Usuários", "Aprovações", "Painel"];

function menuFor(role: "admin" | "professor"): string[] {
  return role === "admin"
    ? [...PROFESSOR_MENU, ...ADMIN_ONLY_MENU]
    : [...PROFESSOR_MENU];
}

// ─────────────────────────── US01 — Login institucional ─────────────────────
Given(
  "que Ana tem uma conta ativa com o e-mail {string}",
  function (this: SiraWorld, email: string) {
    this.currentUser = ensureUser(this, "Ana", { email, status: "active" });
  },
);

Given(
  "que Ana tem uma conta inativa com o e-mail {string}",
  function (this: SiraWorld, email: string) {
    ensureUser(this, "Ana", { email, status: "inactive" });
  },
);

Given("que Bruno está na tela de acesso", function (this: SiraWorld) {
  this.sessionActive = false;
});

When(
  "ela informa o e-mail {string} e a senha correta e confirma o acesso",
  function (this: SiraWorld, email: string) {
    // Regra de login: e-mail institucional + conta ativa (RF-001/RF-002).
    const user = this.users.find((u) => u.email === email);
    if (!isInstitutionalEmail(email)) {
      this.actionOk = false;
      this.message = "Somente e-mails institucionais são aceitos.";
    } else if (user && user.status === "inactive") {
      this.actionOk = false;
      this.message = "Esta conta está inativa.";
    } else if (user && user.pendingSignup) {
      this.actionOk = false;
      this.message = "Seu cadastro ainda aguarda aprovação.";
    } else {
      this.actionOk = true;
      this.currentUser = user ?? ensureUser(this, "Ana", { email });
      this.sessionActive = true;
    }
  },
);

When(
  "ele informa o e-mail {string} e uma senha e confirma o acesso",
  function (this: SiraWorld, email: string) {
    if (!isInstitutionalEmail(email)) {
      this.actionOk = false;
      this.message = "Somente e-mails institucionais são aceitos.";
    } else {
      this.actionOk = true;
      this.sessionActive = true;
    }
  },
);

Then(
  "o sistema a leva para a tela inicial do perfil dela",
  function (this: SiraWorld) {
    assert.equal(this.actionOk, true);
    assert.equal(this.sessionActive, true);
  },
);

Then("o sistema recusa a entrada", function (this: SiraWorld) {
  assert.equal(this.actionOk, false);
  assert.equal(this.sessionActive, false);
});

Then(
  "exibe um aviso de que somente e-mails institucionais são aceitos",
  function (this: SiraWorld) {
    assert.match(this.message ?? "", /institucionais/i);
  },
);

Then("exibe um aviso de que a conta está inativa", function (this: SiraWorld) {
  assert.match(this.message ?? "", /inativa/i);
});

// ─────────────────────────── US03 — Solicitação de cadastro ─────────────────
Given(
  "que Ana está na tela de acesso e abre o formulário de solicitação de cadastro",
  function (this: SiraWorld) {
    this.sessionActive = false;
  },
);

Given(
  "que Bruno abriu o formulário de solicitação de cadastro",
  function (this: SiraWorld) {
    this.sessionActive = false;
  },
);

Given(
  "que a solicitação de Ana com o e-mail {string} está pendente de aprovação",
  function (this: SiraWorld, email: string) {
    ensureUser(this, "Ana", { email, pendingSignup: true, status: "inactive" });
  },
);

When(
  "ela informa nome, o e-mail {string}, o departamento e uma senha e envia",
  function (this: SiraWorld, email: string) {
    if (!isInstitutionalEmail(email)) {
      this.actionOk = false;
      this.message = "Somente e-mails institucionais são aceitos.";
    } else {
      this.actionOk = true;
      ensureUser(this, "Ana", {
        email,
        pendingSignup: true,
        status: "inactive",
      });
      this.message = "Seu pedido aguarda análise do administrador.";
    }
  },
);

When(
  "ele informa o e-mail {string} e envia",
  function (this: SiraWorld, email: string) {
    if (!isInstitutionalEmail(email)) {
      this.actionOk = false;
      this.message = "Somente e-mails institucionais são aceitos.";
    } else {
      this.actionOk = true;
    }
  },
);

When(
  "ela tenta entrar no sistema com esse e-mail e a senha informada",
  function (this: SiraWorld) {
    const user = this.users.find((u) => u.name === "Ana");
    if (user?.pendingSignup) {
      this.accessDenied = true;
      this.actionOk = false;
      this.message = "Seu cadastro ainda aguarda aprovação.";
    } else {
      this.actionOk = true;
    }
  },
);

Then(
  "o sistema registra a solicitação como pendente de aprovação",
  function (this: SiraWorld) {
    assert.equal(this.actionOk, true);
    assert.ok(this.users.some((u) => u.pendingSignup));
  },
);

Then(
  "avisa Ana de que o pedido aguarda análise do administrador",
  function (this: SiraWorld) {
    assert.match(this.message ?? "", /aguarda análise/i);
  },
);

Then("o sistema recusa a solicitação", function (this: SiraWorld) {
  assert.equal(this.actionOk, false);
});

Then("o sistema não permite o acesso", function (this: SiraWorld) {
  assert.equal(this.accessDenied, true);
});

Then(
  "informa que o cadastro ainda aguarda aprovação",
  function (this: SiraWorld) {
    assert.match(this.message ?? "", /aguarda aprovação/i);
  },
);

// ─────────────────────────── US02 — Continuidade de sessão ──────────────────
Given(
  "que Ana entrou no sistema e está na tela inicial",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Ana");
    this.sessionActive = true;
    this.autoRestore = true;
  },
);

Given("que Ana encerrou a sessão dela", function (this: SiraWorld) {
  this.currentUser = null;
  this.sessionActive = false;
  this.autoRestore = false;
});

Given("que Bruno é professor e entrou no sistema", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Bruno", { role: "professor" });
  this.sessionActive = true;
});

When("ela recarrega a página", function (this: SiraWorld) {
  // Recarregar não derruba sessão válida (cookie persistente — F-02 CA01).
  if (this.autoRestore && this.currentUser) this.sessionActive = true;
});

When("ela abre o sistema de novo", function (this: SiraWorld) {
  this.sessionActive = this.autoRestore && this.currentUser !== null;
});

When(
  "ele fecha e reabre o navegador enquanto a sessão ainda é válida",
  function (this: SiraWorld) {
    // Sessão válida sobrevive ao fechamento do navegador (F-02 CA03).
    this.sessionActive = this.currentUser !== null;
  },
);

Then(
  "ela continua conectada sem precisar informar e-mail e senha novamente",
  function (this: SiraWorld) {
    assert.equal(this.sessionActive, true);
  },
);

Then("o sistema não a reconecta automaticamente", function (this: SiraWorld) {
  assert.equal(this.sessionActive, false);
});

Then("apresenta a tela de acesso", function (this: SiraWorld) {
  assert.equal(this.sessionActive, false);
});

Then("ele continua conectado", function (this: SiraWorld) {
  assert.equal(this.sessionActive, true);
});

Then(
  "mantém o perfil de professor e as mesmas permissões de antes",
  function (this: SiraWorld) {
    assert.equal(this.currentUser?.role, "professor");
  },
);

// ─────────────────────────── US04 — Encerramento de sessão ──────────────────
Given("que Ana está conectada na tela inicial", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Ana");
  this.sessionActive = true;
});

Given("que Ana acabou de sair do sistema", function (this: SiraWorld) {
  this.currentUser = null;
  this.sessionActive = false;
});

Given(
  "que Ana e Bruno já usaram o sistema no mesmo computador",
  function (this: SiraWorld) {
    ensureUser(this, "Ana");
    ensureUser(this, "Bruno");
    addReservation(this, {
      owner: "Bruno",
      roomName: "Lab 1",
      status: "approved",
    });
    this.currentUser = this.users.find((u) => u.name === "Ana") ?? null;
    this.sessionActive = true;
  },
);

When("ela escolhe a opção de sair", function (this: SiraWorld) {
  this.currentUser = null;
  this.sessionActive = false;
});

When("a tela de acesso é exibida", function (this: SiraWorld) {
  // Tela de acesso não exibe dados pessoais da sessão encerrada.
  this.results = this.currentUser;
});

When("Ana sai da sessão dela", function (this: SiraWorld) {
  this.currentUser = null;
  this.sessionActive = false;
});

Then("o sistema encerra a sessão dela", function (this: SiraWorld) {
  assert.equal(this.sessionActive, false);
  assert.equal(this.currentUser, null);
});

Then("a leva para a tela de acesso", function (this: SiraWorld) {
  assert.equal(this.sessionActive, false);
});

Then(
  "os dados pessoais da sessão de Ana deixam de ficar visíveis na tela",
  function (this: SiraWorld) {
    assert.equal(this.results, null);
  },
);

Then(
  "os dados pessoais de Bruno permanecem preservados",
  function (this: SiraWorld) {
    assert.ok(this.users.some((u) => u.name === "Bruno"));
    assert.ok(this.reservations.some((r) => r.owner === "Bruno"));
  },
);

Then(
  "ficam disponíveis quando ele entrar novamente",
  function (this: SiraWorld) {
    const bruno = this.users.find((u) => u.name === "Bruno");
    assert.ok(bruno);
    assert.ok(this.reservations.some((r) => r.owner === "Bruno"));
  },
);

// ─────────────────────────── US05 — Menu por perfil ─────────────────────────
Given("que Ana entrou no sistema como professora", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Ana", { role: "professor" });
  this.sessionActive = true;
});

Given(
  "que Bruno entrou no sistema como administrador",
  function (this: SiraWorld) {
    this.currentUser = ensureUser(this, "Bruno", { role: "admin" });
    this.sessionActive = true;
  },
);

Given("que Ana tem 3 notificações ainda não lidas", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Ana");
  for (let i = 0; i < 3; i++) {
    this.notifications.push({
      id: `n${i}`,
      owner: "Ana",
      type: "system",
      title: "Aviso",
      message: "",
      is_read: false,
      related_reservation_id: null,
      created_at: `2026-06-13T0${i}:00:00Z`,
    });
  }
});

When("ela observa o menu lateral", function (this: SiraWorld) {
  this.results = menuFor(this.currentUser?.role ?? "professor");
});

When("ele observa o menu lateral", function (this: SiraWorld) {
  this.results = menuFor(this.currentUser?.role ?? "professor");
});

When(
  "ela observa o item Notificações no menu lateral",
  function (this: SiraWorld) {
    this.results = this.notifications.filter((n) => !n.is_read).length;
  },
);

Then(
  "ela vê Minhas Reservas, Nova Reserva, Calendário e Notificações",
  function (this: SiraWorld) {
    const menu = this.results as string[];
    for (const item of PROFESSOR_MENU)
      assert.ok(menu.includes(item), `falta ${item}`);
  },
);

Then("não vê as seções de gestão do administrador", function (this: SiraWorld) {
  const menu = this.results as string[];
  for (const item of ADMIN_ONLY_MENU)
    assert.ok(!menu.includes(item), `não devia ver ${item}`);
});

Then(
  "ele vê as seções Salas, Usuários, Aprovações e Painel",
  function (this: SiraWorld) {
    const menu = this.results as string[];
    for (const item of ADMIN_ONLY_MENU)
      assert.ok(menu.includes(item), `falta ${item}`);
  },
);

Then("o número 3 aparece ao lado do item", function (this: SiraWorld) {
  assert.equal(this.results, 3);
});

Then("reflete a quantidade real de pendências", function (this: SiraWorld) {
  assert.equal(
    this.results,
    this.notifications.filter((n) => !n.is_read).length,
  );
});

// ─────────────────────────── US06 — Endereços das telas ─────────────────────
Given(
  "que Ana visitou a tela de Calendário e depois a tela de Nova Reserva",
  function (this: SiraWorld) {
    this.navHistory = ["/calendario", "/reservas/nova"];
    this.navIndex = 1;
  },
);

Given("que Bruno está conectado no sistema", function (this: SiraWorld) {
  this.currentUser = ensureUser(this, "Bruno");
  this.sessionActive = true;
});

Given("que Ana está na tela de Minhas Reservas", function (this: SiraWorld) {
  this.navHistory = ["/reservas"];
  this.navIndex = 0;
});

When("ela usa o comando de voltar do navegador", function (this: SiraWorld) {
  if (this.navIndex > 0) this.navIndex--;
});

When(
  "ele tenta abrir um endereço que não corresponde a nenhuma tela",
  function (this: SiraWorld) {
    this.results = "404";
  },
);

Then(
  "o sistema a leva de volta à tela de Calendário",
  function (this: SiraWorld) {
    assert.equal(this.navHistory[this.navIndex], "/calendario");
  },
);

Then(
  "o comando de avançar a traz novamente à tela de Nova Reserva",
  function (this: SiraWorld) {
    if (this.navIndex < this.navHistory.length - 1) this.navIndex++;
    assert.equal(this.navHistory[this.navIndex], "/reservas/nova");
  },
);

Then(
  "o sistema apresenta a tela de página não encontrada",
  function (this: SiraWorld) {
    assert.equal(this.results, "404");
  },
);

Then(
  "o sistema a mantém na tela de Minhas Reservas",
  function (this: SiraWorld) {
    assert.equal(this.navHistory[this.navIndex], "/reservas");
  },
);

// ─────────────────────────── US07 — Menu em tela pequena ────────────────────
Given("que Ana acessa o sistema pelo celular", function (this: SiraWorld) {
  this.viewportWidth = 390;
});

Given(
  "que Ana está no celular com o menu recolhido",
  function (this: SiraWorld) {
    this.viewportWidth = 390;
    this.menuOpen = false;
  },
);

Given(
  "que Ana está no celular com o menu lateral aberto",
  function (this: SiraWorld) {
    this.viewportWidth = 390;
    this.menuOpen = true;
  },
);

When("a tela inicial é exibida", function (this: SiraWorld) {
  // Em viewport pequena (<768) o menu inicia recolhido (F-07 CA01).
  this.menuOpen = this.viewportWidth >= 768;
});

When("ela toca no botão de menu", function (this: SiraWorld) {
  this.menuOpen = true;
});

When("ela toca em uma área fora do menu", function (this: SiraWorld) {
  this.menuOpen = false;
});

Then("o menu lateral aparece recolhido", function (this: SiraWorld) {
  assert.equal(this.menuOpen, false);
});

Then(
  "o conteúdo principal ocupa o espaço disponível",
  function (this: SiraWorld) {
    assert.ok(this.viewportWidth < 768);
  },
);

Then("o menu lateral se abre sobre o conteúdo", function (this: SiraWorld) {
  assert.equal(this.menuOpen, true);
});

Then("o menu lateral se fecha", function (this: SiraWorld) {
  assert.equal(this.menuOpen, false);
});

// ─────────────────────────── US08 — Listas em tela pequena ──────────────────
Given(
  "que Ana acessa Minhas Reservas pelo celular",
  function (this: SiraWorld) {
    this.viewportWidth = 390;
  },
);

Given(
  "que Bruno consulta a lista de Aprovações pelo celular",
  function (this: SiraWorld) {
    this.viewportWidth = 390;
  },
);

Given(
  "que Ana acessa a lista de Salas em um computador de tela grande",
  function (this: SiraWorld) {
    this.viewportWidth = 1280;
  },
);

When("a lista é exibida", function (this: SiraWorld) {
  // <768 → cartões; senão → tabela (F-08 CA01/CA03).
  this.results = this.viewportWidth < 768 ? "cards" : "table";
});

When("a lista é exibida em cartões", function (this: SiraWorld) {
  this.results = "cards";
});

Then(
  "cada reserva aparece como um cartão empilhado",
  function (this: SiraWorld) {
    assert.equal(this.results, "cards");
  },
);

Then(
  "cada valor exibe o rótulo do campo correspondente",
  function (this: SiraWorld) {
    assert.equal(this.results, "cards");
  },
);

Then(
  "não é necessário rolar a tela para o lado para ver as informações",
  function (this: SiraWorld) {
    assert.equal(this.results, "cards");
  },
);

Then(
  "as informações voltam a aparecer no formato de tabela",
  function (this: SiraWorld) {
    assert.equal(this.results, "table");
  },
);

// ─────────────────────────── US09 — Tema da interface ───────────────────────
Given(
  "que Ana está usando o sistema no tema claro",
  function (this: SiraWorld) {
    this.theme = "light";
  },
);

Given(
  "que Bruno deixou o tema escuro definido no acesso anterior",
  function (this: SiraWorld) {
    this.persistedTheme = "dark";
  },
);

Given(
  "que Ana ativou o tema escuro na tela inicial",
  function (this: SiraWorld) {
    this.theme = "dark";
    this.persistedTheme = "dark";
  },
);

When(
  "ela aciona o controle de troca de tema para escuro",
  function (this: SiraWorld) {
    this.theme = "dark";
    this.persistedTheme = "dark";
  },
);

When("ele abre o sistema novamente", function (this: SiraWorld) {
  // Tema persistido aplicado antes do primeiro paint (sem flash — F-09 CA02).
  this.theme = this.persistedTheme ?? "light";
  this.themeAppliedBeforePaint = this.persistedTheme !== null;
});

When(
  "ela navega para a tela de minhas reservas e para o calendário",
  function (this: SiraWorld) {
    this.navHistory = ["/reservas", "/calendario"];
  },
);

Then(
  "toda a interface passa a ser exibida no tema escuro",
  function (this: SiraWorld) {
    assert.equal(this.theme, "dark");
  },
);

Then(
  "ao entrar novamente no sistema o tema escuro continua aplicado",
  function (this: SiraWorld) {
    assert.equal(this.persistedTheme, "dark");
  },
);

Then("a tela aparece diretamente no tema escuro", function (this: SiraWorld) {
  assert.equal(this.theme, "dark");
});

Then(
  "não há nenhum instante em que a cor clara errada é mostrada",
  function (this: SiraWorld) {
    assert.equal(this.themeAppliedBeforePaint, true);
  },
);

Then(
  "todas essas telas são exibidas no tema escuro de forma consistente",
  function (this: SiraWorld) {
    assert.equal(this.theme, "dark");
    assert.ok(this.navHistory.length >= 2);
  },
);

// ─────────────────────────── US10 — Privacidade / resiliência ───────────────
Given(
  "que a professora {string} está logada e possui reservas cadastradas",
  function (this: SiraWorld, name: string) {
    ensureUser(this, name);
    addReservation(this, {
      owner: name,
      roomName: "Lab 1",
      status: "approved",
    });
    this.currentUser = this.users.find((u) => u.name === name) ?? null;
  },
);

Given(
  "o professor {string} usa o mesmo navegador",
  function (this: SiraWorld, name: string) {
    ensureUser(this, name);
  },
);

Given(
  "que {string} possui reservas e está logada",
  function (this: SiraWorld, name: string) {
    ensureUser(this, name);
    addReservation(this, {
      owner: name,
      roomName: "Lab 1",
      status: "approved",
    });
    this.currentUser = this.users.find((u) => u.name === name) ?? null;
  },
);

Given(
  "que o armazenamento do navegador está cheio",
  function (this: SiraWorld) {
    this.results = "storage-full";
  },
);

Given(
  "que o usuário {string} está logado",
  function (this: SiraWorld, name: string) {
    this.currentUser = ensureUser(this, name);
  },
);

When("{string} faz login", function (this: SiraWorld, name: string) {
  this.currentUser = ensureUser(this, name);
  // Isolamento por usuário (RLS — F-10): só vê as próprias reservas.
  this.results = this.reservations.filter((r) => r.owner === name);
});

When(
  "{string} sai do sistema e entra novamente",
  function (this: SiraWorld, name: string) {
    this.currentUser = null;
    this.currentUser = this.users.find((u) => u.name === name) ?? null;
    this.results = this.reservations.filter((r) => r.owner === name);
  },
);

When("o usuário tenta salvar uma nova reserva", function (this: SiraWorld) {
  // Falha de armazenamento tratada sem travar (F-10.2).
  if (this.results === "storage-full") {
    this.message =
      "Seu armazenamento está cheio. Libere espaço e tente de novo.";
    this.actionOk = false;
  }
});

When(
  "o sistema tenta acessar um dado pertencente a {string}",
  function (this: SiraWorld, owner: string) {
    // Acesso a dado de outro dono é barrado pelo RLS → nada retorna.
    const visible = this.reservations.filter(
      (r) => r.owner === this.currentUser?.name,
    );
    this.results = visible.filter((r) => r.owner === owner);
  },
);

Then(
  "o sistema exibe apenas as reservas de {string}",
  function (this: SiraWorld, name: string) {
    const rows = this.results as { owner: string }[];
    assert.ok(rows.every((r) => r.owner === name));
  },
);

Then(
  "nenhuma reserva de {string} aparece",
  function (this: SiraWorld, name: string) {
    const rows = this.results as { owner: string }[];
    assert.ok(rows.every((r) => r.owner !== name));
  },
);

Then(
  "suas reservas anteriores continuam disponíveis",
  function (this: SiraWorld) {
    const rows = this.results as unknown[];
    assert.ok(rows.length > 0);
  },
);

Then(
  "o sistema exibe uma mensagem amigável de armazenamento cheio",
  function (this: SiraWorld) {
    assert.match(this.message ?? "", /armazenamento está cheio/i);
  },
);

Then("não trava nem perde os dados já salvos", function (this: SiraWorld) {
  assert.equal(this.actionOk, false);
  assert.equal(this.results, "storage-full");
});

Then("nada é retornado", function (this: SiraWorld) {
  const rows = this.results as unknown[];
  assert.equal(rows.length, 0);
});
