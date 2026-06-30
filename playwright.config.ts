import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config para o smoke test do SIRA.
 *
 * O dev server (Next.js) JÁ ESTÁ rodando em http://localhost:3000 — por isso
 * NÃO declaramos `webServer` aqui (não derrubamos nem reiniciamos o dev).
 * Apenas apontamos `baseURL` para ele.
 *
 * Headless por padrão. Screenshots são tirados manualmente no spec (salvos em
 * /tmp/sira-smoke), então desligamos a captura automática. `trace` só no retry.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "off",
    trace: "on-first-retry",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
