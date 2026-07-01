import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * CHECK PRAGMÁTICO DE PERFORMANCE (P5) — sem Lighthouse.
 *
 * Mede, via Performance API no browser real, em telas representativas:
 *  - LCP aproximado (PerformanceObserver "largest-contentful-paint")
 *  - CLS (layout-shift, somando shifts sem recent input)
 *  - nº de long tasks (>50ms) e tempo total bloqueado
 *  - FCP e domContentLoaded como contexto
 *
 * Roda CONTRA o dev server já em pé (não é produção — números são indicativos,
 * úteis para detectar CLS/long-task patológicos e regressões relativas).
 *
 * Credenciais: SOMENTE de env.
 */

const OUT_DIR = "/tmp/sira-a11y";
fs.mkdirSync(OUT_DIR, { recursive: true });

const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD ?? "";

interface PerfMetrics {
  route: string;
  lcpMs: number | null;
  fcpMs: number | null;
  cls: number;
  longTasks: number;
  totalBlockingMs: number;
  domContentLoadedMs: number | null;
  transferKB: number;
}

const all: PerfMetrics[] = [];

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

/**
 * Instala observers ANTES de navegar (via addInitScript) e depois lê os valores.
 * LCP/CLS/long-task acumulam em window.__perf.
 */
const INIT = `
(() => {
  const w = window;
  w.__perf = { lcp: 0, cls: 0, longTasks: 0, tbt: 0 };
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) w.__perf.lcp = e.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (!e.hadRecentInput) w.__perf.cls += e.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        w.__perf.longTasks += 1;
        w.__perf.tbt += Math.max(0, e.duration - 50);
      }
    }).observe({ type: 'longtask', buffered: true });
  } catch {}
})();
`;

async function measure(page: Page, route: string): Promise<PerfMetrics> {
  // Navega client se houver link, senão goto.
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
  // dá tempo para layout-shift tardio (imagens/listas) e LCP estabilizar
  await page.waitForTimeout(1500);

  const data = await page.evaluate(() => {
    const w = window as unknown as {
      __perf: { lcp: number; cls: number; longTasks: number; tbt: number };
    };
    const paints = performance.getEntriesByType("paint");
    const fcp = paints.find((p) => p.name === "first-contentful-paint");
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    const transfer = performance
      .getEntriesByType("resource")
      .reduce(
        (n, r) => n + ((r as PerformanceResourceTiming).transferSize || 0),
        0,
      );
    return {
      lcp: w.__perf?.lcp ?? 0,
      cls: w.__perf?.cls ?? 0,
      longTasks: w.__perf?.longTasks ?? 0,
      tbt: w.__perf?.tbt ?? 0,
      fcp: fcp ? fcp.startTime : null,
      dcl: nav ? nav.domContentLoadedEventEnd : null,
      transfer,
    };
  });

  const m: PerfMetrics = {
    route,
    lcpMs: data.lcp ? Math.round(data.lcp) : null,
    fcpMs: data.fcp != null ? Math.round(data.fcp) : null,
    cls: Math.round(data.cls * 1000) / 1000,
    longTasks: data.longTasks,
    totalBlockingMs: Math.round(data.tbt),
    domContentLoadedMs: data.dcl != null ? Math.round(data.dcl) : null,
    transferKB: Math.round(data.transfer / 1024),
  };
  all.push(m);
  return m;
}

const PERF_ROUTES = [
  "/painel",
  "/calendario",
  "/configuracoes",
  "/minhas-reservas",
];

test.describe("SIRA perf check (admin · dev-server)", () => {
  test.skip(
    !ADMIN_EMAIL || !ADMIN_PASSWORD,
    "Defina SMOKE_ADMIN_EMAIL e SMOKE_ADMIN_PASSWORD.",
  );

  test("LCP / CLS / long-tasks em telas representativas", async ({ page }) => {
    test.setTimeout(180_000);
    await page.addInitScript(INIT);
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    for (const route of PERF_ROUTES) {
      const m = await measure(page, route);
      console.log(
        `[PERF] ${route.padEnd(18)} LCP~${String(m.lcpMs).padStart(5)}ms ` +
          `CLS=${m.cls.toFixed(3)} longTasks=${m.longTasks} TBT=${m.totalBlockingMs}ms ` +
          `transfer=${m.transferKB}KB`,
      );
    }

    fs.writeFileSync(
      path.join(OUT_DIR, "perf.json"),
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          note: "dev-server, indicative",
          metrics: all,
        },
        null,
        2,
      ),
    );

    console.log(
      "\n================ PERF REPORT (dev-server, indicativo) ================",
    );
    console.log(
      `${"ROUTE".padEnd(18)} ${"LCP~".padStart(8)} ${"CLS".padStart(7)} ${"longTasks".padStart(10)} ${"TBT".padStart(7)}`,
    );
    for (const m of all) {
      const clsFlag = m.cls > 0.1 ? " ⚠CLS" : "";
      console.log(
        `${m.route.padEnd(18)} ${String(m.lcpMs ?? "—").padStart(6)}ms ${m.cls.toFixed(3).padStart(7)} ${String(m.longTasks).padStart(10)} ${String(m.totalBlockingMs).padStart(5)}ms${clsFlag}`,
      );
    }
    console.log(
      "=====================================================================\n",
    );

    expect(all.length).toBe(PERF_ROUTES.length);
  });
});
