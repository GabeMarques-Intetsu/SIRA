"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Providers de cliente que envolvem a árvore (root layout). Hoje: TanStack Query
 * (gerência de estado de servidor no client — cache, dedupe, sincronização).
 *
 * O QueryClient é criado uma vez por montagem (useState lazy) para não vazar
 * cache entre requests no SSR. `staleTime` global evita refetch agressivo.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000, // 1 min fresco — sem refetch em background à toa
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
