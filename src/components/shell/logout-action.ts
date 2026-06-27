"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Encerra a sessão e volta ao login (F-04). */
export async function signOutAction() {
  // A execução do logout será implementada no próximo commit
}