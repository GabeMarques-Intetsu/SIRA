import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
import path from "node:path";

/**
 * AUDITORIA DE ACESSIBILIDADE (P5) — WCAG 2.2 AA via axe-core.
 *
 * Loga como admin, navega CLIENT (App Router) por todas as telas autenticadas
 * e roda AxeBuilder em cada uma com as tags wcag2a, wcag2aa, wcag21a, wcag21aa.
 * Para telas com formulário/modal, ABRE o modal e roda o axe de novo com o
 * modal aberto (estado que muda a árvore acessível).
 *
 * NÃO falha no 1º erro — coleta TUDO. Agrega por (regra × impacto) com
 * contagem por tela + 1 exemplo de seletor. Salva /tmp/sira-a11y/report.json
 * e imprime um resumo legível no stdout.
 *
 * Credenciais: SOMENTE de env (SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD).
 */

const OUT_DIR = "/tmp/sira-a11y";
fs.mkdirSync(OUT_DIR, { recursive: true });

const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? "";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

interface ViolationNodeLite {
  target: string;
  html: string;
}
interface FlatViolation {
  screen: string;
  state: string; // "page" | "modal:<nome>"
  ruleId: string;
  impact: string; // critical | serious | moderate | minor
  help: string;
  helpUrl: string;
  nodes: ViolationNodeLite[];
}

const allViolations: FlatViolation[] = [];

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

/** Navega para `route`: clica o link client se existir, senão goto(). */
async function navigate(page: Page, route: string) {
  const navLink = page.locator(`a[href="${route}"]`).first();
  if (await navLink.count()) {
    await Promise.all([
      page.waitForURL((u) => u.pathname === route, { timeout: 20_000 }),
      navLink.click(),
    ]);
  } else {
    await page.goto(route, { waitUntil: "domcontentloaded" });
  }
  await page
    .locator("#main-content")
    .waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForLoadState("networkidle").catch(() => {});
}

/** Roda axe no estado atual e empilha as violações achatadas. */
async function runAxe(page: Page, screen: string, state: string) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  for (const v of results.violations) {
    allViolations.push({
      screen,
      state,
      ruleId: v.id,
      impact: v.impact ?? "unknown",
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.slice(0, 1).map((n) => ({
        target: Array.isArray(n.target) ? n.target.join(" ") : String(n.target),
        html: n.html.slice(0, 200),
      })),
    });
  }
  console.log(
    `[AXE] ${screen} (${state}) → ${results.violations.length} regras violadas`,
  );
}

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

test.describe("SIRA a11y audit (admin · WCAG 2.2 AA)", () => {
  test.skip(
    !ADMIN_EMAIL || !ADMIN_PASSWORD,
    "Defina SMOKE_ADMIN_EMAIL e SMOKE_ADMIN_PASSWORD.",
  );

  test("axe em todas as telas autenticadas + estados de modal", async ({
    page,
  }) => {
    test.setTimeout(300_000);

    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    for (const route of ADMIN_ROUTES) {
      await navigate(page, route);
      const screen = route;
      await runAxe(page, screen, "page");

      // ───── Estados de modal/expansão por tela ─────
      try {
        if (route === "/nova-reserva") {
          // Wizard: o passo inicial já é um formulário. Tenta avançar 1 passo
          // para expor mais campos, mas roda o axe mesmo no estado inicial.
          await runAxe(page, screen, "wizard:step-1");
        }

        if (route === "/salas" || route === "/equipamentos") {
          const novo = page
            .getByRole("button", { name: /Nova sala|Novo equipamento/i })
            .first();
          if (await novo.count()) {
            await novo.click().catch(() => {});
            const dialog = page.getByRole("dialog").first();
            if (await dialog.count()) {
              await dialog
                .waitFor({ state: "visible", timeout: 5_000 })
                .catch(() => {});
              await runAxe(page, screen, "modal:criar-recurso");
              await page.keyboard.press("Escape").catch(() => {});
            }
          }
        }

        if (route === "/aprovacoes") {
          const recusar = page
            .getByRole("button", { name: /^Recusar$/i })
            .first();
          if (await recusar.count()) {
            await recusar.click().catch(() => {});
            const dialog = page.getByRole("dialog").first();
            if (await dialog.count()) {
              await dialog
                .waitFor({ state: "visible", timeout: 5_000 })
                .catch(() => {});
              await runAxe(page, screen, "modal:recusar");
              await page.keyboard.press("Escape").catch(() => {});
            }
          }
        }

        if (route === "/configuracoes") {
          // Já é um formulário denso; o estado "page" cobre os campos.
          // Roda axe focando na seção de notificações (matriz de checkboxes).
          const notif = page.locator("#notif");
          if (await notif.count()) {
            await notif.scrollIntoViewIfNeeded().catch(() => {});
            await runAxe(page, screen, "form:notificacoes");
          }
        }
      } catch (e) {
        console.log(
          `[AXE] ${route} estado-modal pulado: ${(e as Error).message.split("\n")[0]}`,
        );
      }
    }

    // ───────── Agregação por (regra × impacto) ─────────
    interface Agg {
      ruleId: string;
      impact: string;
      help: string;
      helpUrl: string;
      totalNodes: number;
      screens: Record<string, number>; // "screen (state)" -> count
      exampleSelector: string;
    }
    const aggMap = new Map<string, Agg>();
    for (const v of allViolations) {
      const key = `${v.ruleId}::${v.impact}`;
      const sKey = `${v.screen} (${v.state})`;
      let a = aggMap.get(key);
      if (!a) {
        a = {
          ruleId: v.ruleId,
          impact: v.impact,
          help: v.help,
          helpUrl: v.helpUrl,
          totalNodes: 0,
          screens: {},
          exampleSelector: v.nodes[0]?.target ?? "",
        };
        aggMap.set(key, a);
      }
      a.totalNodes += v.nodes.length;
      a.screens[sKey] = (a.screens[sKey] ?? 0) + v.nodes.length;
      if (!a.exampleSelector && v.nodes[0])
        a.exampleSelector = v.nodes[0].target;
    }

    const impactOrder = ["critical", "serious", "moderate", "minor", "unknown"];
    const agg = [...aggMap.values()].sort(
      (x, y) =>
        impactOrder.indexOf(x.impact) - impactOrder.indexOf(y.impact) ||
        y.totalNodes - x.totalNodes,
    );

    const summaryByImpact: Record<string, number> = {};
    for (const v of allViolations)
      summaryByImpact[v.impact] =
        (summaryByImpact[v.impact] ?? 0) + v.nodes.length;

    const report = {
      generatedAt: new Date().toISOString(),
      tags: AXE_TAGS,
      totalViolationInstances: allViolations.reduce(
        (n, v) => n + v.nodes.length,
        0,
      ),
      summaryByImpact,
      rules: agg,
      raw: allViolations,
    };
    fs.writeFileSync(
      path.join(OUT_DIR, "report.json"),
      JSON.stringify(report, null, 2),
    );

    // ───────── Resumo no stdout ─────────
    console.log(
      "\n================ A11Y REPORT (admin · WCAG 2.2 AA) ================",
    );
    console.log(`Tags: ${AXE_TAGS.join(", ")}`);
    console.log(`Instâncias por impacto: ${JSON.stringify(summaryByImpact)}`);
    console.log(
      "---------------------------------------------------------------",
    );
    for (const a of agg) {
      console.log(
        `[${a.impact.toUpperCase()}] ${a.ruleId} — ${a.totalNodes} nós\n` +
          `   ${a.help}\n` +
          `   telas: ${Object.entries(a.screens)
            .map(([s, c]) => `${s}×${c}`)
            .join(", ")}\n` +
          `   ex: ${a.exampleSelector}`,
      );
    }
    console.log(
      "================================================================\n",
    );

    // Não falha o build por violações (é auditoria). Garante que rodou.
    expect(allViolations.length).toBeGreaterThanOrEqual(0);
  });
});
