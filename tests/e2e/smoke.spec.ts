import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * SMOKE TEST headless do SIRA (Next.js 16 + Supabase).
 *
 * Foco: pegar erros de RENDER e de CONSOLE em navegação CLIENT — foi onde um
 * bug recente quebrou /configuracoes (um <script> que o React 19 não executa
 * em navegação client e que dispara pageerror).
 *
 * Estratégia de navegação (e2e-testing-patterns + webapp-testing):
 *  - Quando existe link na sidebar/header para a rota, CLICAMOS nele → isso é
 *    navegação client de verdade (App Router, sem full reload) e reproduz o bug.
 *  - Quando a rota NÃO tem link visível para o perfil atual (rotas professor-only
 *    vistas pelo admin, e /configuracoes que não tem link em lugar nenhum),
 *    fazemos goto() direto e marcamos o método como "goto" no relatório.
 *
 * Credenciais: lidas SOMENTE de variáveis de ambiente (nunca hardcoded).
 *  SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD          (obrigatório)
 *  SMOKE_PROFESSOR_EMAIL / SMOKE_PROFESSOR_PASSWORD  (opcional — pula RBAC se faltar)
 */

const SHOT_DIR = "/tmp/sira-smoke";
fs.mkdirSync(SHOT_DIR, { recursive: true });

const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? "";
const PROF_EMAIL = process.env.SMOKE_PROFESSOR_EMAIL ?? "";
const PROF_PASSWORD = process.env.SMOKE_PROFESSOR_PASSWORD ?? "";

/** Ruído conhecido e inofensivo que NÃO deve marcar a tela como falha. */
const CONSOLE_NOISE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /favicon\.ico/i,
  /Material Symbols/i, // fonte de ícones via CDN pode logar
  /fonts\.googleapis\.com/i,
  /fonts\.gstatic\.com/i,
];

function isNoise(text: string): boolean {
  return CONSOLE_NOISE.some((re) => re.test(text));
}

interface ScreenResult {
  route: string;
  method: "click" | "goto";
  rendered: boolean;
  heading: string;
  consoleErrors: string[];
  pageErrors: string[];
}

const results: ScreenResult[] = [];

/** Liga os coletores de console.error e pageerror ANTES de navegar. */
function attachCollectors(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const onConsole = (msg: ConsoleMessage) => {
    if (msg.type() === "error" && !isNoise(msg.text())) {
      consoleErrors.push(msg.text());
    }
  };
  const onError = (err: Error) => {
    pageErrors.push(err.message);
  };
  page.on("console", onConsole);
  page.on("pageerror", onError);
  return {
    consoleErrors,
    pageErrors,
    detach() {
      page.off("console", onConsole);
      page.off("pageerror", onError);
    },
  };
}

/** Faz login pelo formulário e espera sair de /login. */
async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.fill("input[type='email']", email);
  await page.fill("input[type='password']", password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 20_000,
    }),
    page.getByRole("button", { name: /Entrar/i }).click(),
  ]);
}

/** Tela renderizou? heading visível OU <main> com conteúdo de texto. */
async function assertRendered(page: Page): Promise<string> {
  const main = page.locator("#main-content");
  await expect(main).toBeVisible({ timeout: 15_000 });

  const h1 = page.locator("#main-content h1, #main-content h2").first();
  let heading = "";
  if (await h1.count()) {
    try {
      heading = (await h1.innerText({ timeout: 5_000 })).trim();
    } catch {
      heading = "";
    }
  }
  // Empty-state conta como render OK: basta o <main> ter algum texto.
  const text = (await main.innerText()).trim();
  expect(text.length, "main deveria ter conteúdo (não tela em branco)").toBeGreaterThan(0);
  return heading || "(sem heading; main com conteúdo)";
}

/**
 * Visita uma rota. Se houver link client visível, clica; senão goto().
 * Coleta erros, asserta render, tira screenshot fullPage.
 */
async function visit(page: Page, route: string): Promise<ScreenResult> {
  const slug = route.replace(/^\//, "").replace(/\//g, "_") || "root";
  const collectors = attachCollectors(page);

  // Procura um link client para a rota (sidebar nav ou header).
  const navLink = page.locator(`a[href="${route}"]`).first();
  let method: "click" | "goto" = "goto";

  if (await navLink.count()) {
    method = "click";
    await Promise.all([
      page.waitForURL((u) => u.pathname === route, { timeout: 20_000 }),
      navLink.click(),
    ]);
  } else {
    await page.goto(route, { waitUntil: "domcontentloaded" });
  }

  // Espera estabilizar a hidratação/streaming.
  await page.waitForLoadState("networkidle").catch(() => {});

  let rendered = true;
  let heading = "";
  try {
    heading = await assertRendered(page);
  } catch (e) {
    rendered = false;
    heading = `RENDER FALHOU: ${(e as Error).message.split("\n")[0]}`;
  }

  await page
    .screenshot({ path: path.join(SHOT_DIR, `${slug}.png`), fullPage: true })
    .catch(() => {});

  collectors.detach();
  const res: ScreenResult = {
    route,
    method,
    rendered,
    heading,
    consoleErrors: collectors.consoleErrors,
    pageErrors: collectors.pageErrors,
  };
  results.push(res);
  return res;
}

// As 9+1 telas do enunciado, na ordem pedida.
const ADMIN_ROUTES = [
  "/calendario",
  "/nova-reserva",
  "/minhas-reservas",
  "/notificacoes",
  "/painel",
  "/aprovacoes",
  "/salas",
  "/equipamentos",
  "/usuarios",
  "/configuracoes",
];

test.describe("SIRA smoke (admin)", () => {
  test.skip(
    !ADMIN_EMAIL || !ADMIN_PASSWORD,
    "Defina SMOKE_ADMIN_EMAIL e SMOKE_ADMIN_PASSWORD.",
  );

  test("login admin + percorrer telas + interações em Configurações", async ({
    page,
  }) => {
    test.setTimeout(180_000);

    // 1) Login admin ---------------------------------------------------------
    const loginCollectors = attachCollectors(page);
    let loginOk = true;
    let loginErr = "";
    try {
      await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    } catch (e) {
      loginOk = false;
      loginErr = (e as Error).message.split("\n")[0];
      await page
        .screenshot({ path: path.join(SHOT_DIR, "login-FAIL.png"), fullPage: true })
        .catch(() => {});
      // tenta capturar a mensagem de erro do formulário (role="alert")
      const alert = page.getByRole("alert");
      if (await alert.count()) {
        loginErr += ` | alerta UI: ${(await alert.first().innerText()).trim()}`;
      }
    }
    loginCollectors.detach();
    console.log(
      `\n[LOGIN] admin → ${loginOk ? "OK" : "FALHOU"}${loginErr ? " :: " + loginErr : ""}`,
    );
    expect(loginOk, `Login admin falhou: ${loginErr}`).toBe(true);

    await page
      .screenshot({ path: path.join(SHOT_DIR, "_after-login.png"), fullPage: true })
      .catch(() => {});

    // 2) Percorrer as telas --------------------------------------------------
    for (const route of ADMIN_ROUTES) {
      const r = await visit(page, route);
      console.log(
        `[SCREEN] ${route} (${r.method}) → ${r.rendered ? "OK" : "FAIL"} | console:${r.consoleErrors.length} pageerr:${r.pageErrors.length}` +
          (r.pageErrors[0] ? ` :: ${r.pageErrors[0]}` : "") +
          (r.consoleErrors[0] ? ` :: ${r.consoleErrors[0]}` : ""),
      );
    }

    // 3) Interações leves em /configuracoes ---------------------------------
    // Garante que estamos em configuracoes.
    if (!page.url().includes("/configuracoes")) {
      await page.goto("/configuracoes", { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});
    }
    const cfg = attachCollectors(page);

    // 3a) Trocar tema (radiogroup dentro da seção Preferências, #preferencias).
    const prefSection = page.locator("#preferencias");
    await expect(prefSection).toBeVisible({ timeout: 10_000 });
    const themeDark = prefSection.getByRole("radio", { name: /Escuro/i });
    const themeLight = prefSection.getByRole("radio", { name: /Claro/i });
    if (await themeDark.count()) {
      await themeDark.click();
      await expect(themeDark).toHaveAttribute("aria-checked", "true", {
        timeout: 5_000,
      });
    }
    if (await themeLight.count()) {
      await themeLight.click();
      await expect(themeLight).toHaveAttribute("aria-checked", "true", {
        timeout: 5_000,
      });
    }

    // 3b) Alternar densidade (select#pref-density) — sem precisar persistir.
    const density = page.locator("#pref-density");
    if (await density.count()) {
      const before = await density.inputValue();
      const next = before === "compact" ? "comfortable" : "compact";
      await density.selectOption(next);
      await expect(density).toHaveValue(next, { timeout: 5_000 });
    }

    // 3c) Alternar "Reduzir animações" (switch).
    const reduceSwitch = page.getByRole("switch", { name: /Reduzir animações/i });
    if (await reduceSwitch.count()) {
      const before = await reduceSwitch.getAttribute("aria-checked");
      await reduceSwitch.click();
      await expect(reduceSwitch).not.toHaveAttribute(
        "aria-checked",
        before ?? "false",
        { timeout: 5_000 },
      );
    }

    // 3d) Alternar uma célula da matriz de notificações.
    const notifSection = page.locator("#notif");
    if (await notifSection.count()) {
      const firstCheckbox = notifSection.locator('input[type="checkbox"]').first();
      if (await firstCheckbox.count()) {
        await firstCheckbox.click({ timeout: 5_000 }).catch(() => {});
      }
    }

    cfg.detach();
    await page
      .screenshot({ path: path.join(SHOT_DIR, "configuracoes_interacted.png"), fullPage: true })
      .catch(() => {});

    console.log(
      `[CONFIG-INTERACT] console:${cfg.consoleErrors.length} pageerr:${cfg.pageErrors.length}` +
        (cfg.pageErrors[0] ? ` :: ${cfg.pageErrors[0]}` : "") +
        (cfg.consoleErrors[0] ? ` :: ${cfg.consoleErrors[0]}` : ""),
    );

    // As interações de Configurações NÃO devem disparar pageerror (era o bug).
    expect(
      cfg.pageErrors,
      `Interações em /configuracoes dispararam pageerror: ${cfg.pageErrors.join(" | ")}`,
    ).toHaveLength(0);

    // ───────── Relatório consolidado no stdout ─────────
    console.log("\n================ SMOKE REPORT (admin) ================");
    for (const r of results) {
      console.log(
        `${r.rendered ? "OK  " : "FAIL"} | ${r.route.padEnd(16)} | via ${r.method.padEnd(5)} | console:${r.consoleErrors.length} pageerr:${r.pageErrors.length}` +
          (r.pageErrors[0] ? `\n        ↳ pageerror: ${r.pageErrors[0]}` : "") +
          (r.consoleErrors[0] ? `\n        ↳ console:   ${r.consoleErrors[0]}` : ""),
      );
    }
    console.log("======================================================\n");

    // Asserções finais: nenhuma tela em branco, nenhum pageerror.
    const blank = results.filter((r) => !r.rendered).map((r) => r.route);
    const withPageErr = results
      .filter((r) => r.pageErrors.length)
      .map((r) => `${r.route}: ${r.pageErrors[0]}`);

    expect(blank, `Telas que não renderizaram: ${blank.join(", ")}`).toHaveLength(0);
    expect(
      withPageErr,
      `Telas com pageerror: ${withPageErr.join(" | ")}`,
    ).toHaveLength(0);
  });
});

// ─────────────────────────── RBAC (professor) ───────────────────────────────
test.describe("SIRA RBAC (professor)", () => {
  test.skip(
    !PROF_EMAIL || !PROF_PASSWORD,
    "Sem SMOKE_PROFESSOR_EMAIL/PASSWORD — fluxo professor pulado.",
  );

  test("professor não vê itens admin e é barrado em /usuarios", async ({
    page,
  }) => {
    test.setTimeout(60_000);
    await login(page, PROF_EMAIL, PROF_PASSWORD);

    const nav = page.locator('nav[aria-label="Navegação principal"]');
    await expect(nav).toBeVisible();

    // Itens admin NÃO devem aparecer.
    for (const adminRoute of ["/painel", "/aprovacoes", "/salas", "/equipamentos", "/usuarios"]) {
      await expect(
        nav.locator(`a[href="${adminRoute}"]`),
        `professor não deveria ver link ${adminRoute}`,
      ).toHaveCount(0);
    }

    // Acessar /usuarios deve redirecionar para /calendario (RF-002 / F-05 CA03).
    await page.goto("/usuarios");
    await page.waitForURL((u) => u.pathname === "/calendario", { timeout: 15_000 });
    expect(new URL(page.url()).pathname).toBe("/calendario");
  });
});
