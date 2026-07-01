"use client";

import Script from "next/script";

/**
 * VLibras — tradutor automático de Português → Libras (Língua Brasileira de
 * Sinais). Widget oficial do Governo Federal (vlibras.gov.br). Acessibilidade
 * institucional (IFPB · Lei Brasileira de Inclusão / LBI nº 13.146/2015).
 *
 * Montado uma vez no root layout (fica em todas as páginas). O markup com os
 * atributos `vw`/`vw-access-button`/`vw-plugin-wrapper` é exigido pelo plugin;
 * usamos spread de objeto para passá-los sem brigar com a tipagem do JSX.
 * O script é carregado via next/script (afterInteractive) e o widget é
 * inicializado no onLoad — evitando `<script>` cru (que o React não executa
 * em navegação client).
 */
export function VLibras() {
  return (
    <>
      <div {...{ vw: "true" }} className="enabled">
        <div {...{ "vw-access-button": "true" }} className="active" />
        <div {...{ "vw-plugin-wrapper": "true" }}>
          <div className="vw-plugin-top-wrapper" />
        </div>
      </div>
      <Script
        src="https://vlibras.gov.br/app/vlibras-plugin.js"
        strategy="afterInteractive"
        onLoad={() => {
          // O plugin injeta o global `VLibras` em window ao carregar.
          const w = window as unknown as {
            VLibras?: { Widget: new (url: string) => void };
          };
          if (w.VLibras) new w.VLibras.Widget("https://vlibras.gov.br/app");
        }}
      />
    </>
  );
}
