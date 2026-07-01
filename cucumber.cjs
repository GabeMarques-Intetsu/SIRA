// Configuração do Cucumber (Gherkin pt-BR) rodando step definitions em TypeScript.
//
// O harness é uma SIMULAÇÃO DE DOMÍNIO (não E2E de browser): o World monta o
// estado em memória e os steps chamam a lógica PURA real de `src/lib/*` via o
// alias `@/` (resolvido pelo tsx, que lê os paths do tsconfig). `tsx/cjs`
// registra o loader de TS para que `require('.../*.ts')` funcione sem build.
// Arquivo CommonJS de config (.cjs): `require` é o mecanismo correto aqui.
// eslint-disable-next-line @typescript-eslint/no-require-imports
require("tsx/cjs");

module.exports = {
  default: {
    paths: ["tests/features/**/*.feature"],
    require: ["tests/features/support/**/*.ts", "tests/features/steps/**/*.ts"],
    language: "pt",
    publishQuiet: true,
  },
};
