"use client";

import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/use-mounted";

const OPTIONS = [
  { value: "light", label: "Claro", icon: "light_mode" },
  { value: "dark", label: "Escuro", icon: "dark_mode" },
  { value: "system", label: "Sistema", icon: "computer" },
] as const;