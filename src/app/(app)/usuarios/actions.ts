"use server";

/**
 * Server Actions da Gestão de Usuários (EP-10 — F-28/F-30/F-31 · Solicitações
 * F-32/F-33 · RF-010).
 *
 * Segurança (F-28 CA01 · F-30 · F-31 · F-32 CA01 · F-33), defesa em profundidade:
 * - `requireAdmin()` reconfirma o papel NO SERVIDOR a cada ação — nunca
 *   confiamos em campo do client p/ identidade nem autorização;
 * - a RLS de `profiles` (is_admin()) e `signup_requests` (is_admin()) é a 2ª
 *   camada: mesmo que o client seja burlado, o banco recusa a escrita;
 * - TRAVA DO ÚLTIMO ADMIN: rebaixar/inativar/excluir o derradeiro admin ativo é
 *   bloqueado (`wouldRemoveLastAdmin`), incluindo o próprio admin logado — ele
 *   não pode se auto-rebaixar/inativar se for o último;
 * - idempotência: relemos o estado atual antes de agir e o UPDATE carrega guarda
 *   (`.eq("status", ...)`) p/ que duplo-clique / duas abas não dupliquem efeito.
 *
 * ✅ Provisionamento de conta (Supabase Auth) — IMPLEMENTADO via service-role
 * (`getAdminClient()` em @/lib/supabase/admin, SERVER-ONLY). Criar usuário (F-28),
 * aprovar solicitação criando a conta (F-32 CA02), redefinir senha (F-30 CA03) e
 * hard-delete (F-42 CA05) usam a Admin API. A service-role NUNCA vai ao client.
 * Se a chave `SUPABASE_SERVICE_ROLE_KEY` não estiver configurada, `getAdminClient()`
 * lança em runtime e a action devolve `ok:false` amigável (`isProvisioningUnavailable`)
 * — a app não cai e o build não depende da chave.
 *
 * Confiança no papel: createUser NÃO confia em `user_metadata.role`; o trigger
 * `handle_new_user` força `role='professor'`. A promoção a admin (F-28) é um UPDATE
 * explícito feito DEPOIS, via admin client (bypassa RLS) e respeitando as validações.
 */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth";
import {
  hasDuplicateEmail,
  isEmailAlreadyExistsError,
  isEmailDeliveryError,
  isProvisioningUnavailable,
  passwordSetupRedirectTo,
  PROVISIONING_UNAVAILABLE_MESSAGE,
  validateRejectReason,
  validateUserInput,
  wouldRemoveLastAdmin,
  type AccountStatus,
  type UserInput,
  type UserRole,
} from "@/lib/users";
import { userSchema } from "@/schemas/user";

export interface ActionResult {
  ok: boolean;
  error: string | null;
  fieldErrors?: Record<string, string>;
}

/**
 * `redirectTo` dos e-mails de convite/recuperação → a tela onde o usuário define
 * a senha (`/redefinir-senha`). Usa `NEXT_PUBLIC_SITE_URL` no deploy; em dev cai
 * no localhost (ver `passwordSetupRedirectTo`).
 */
function passwordSetupUrl(): string {
  return passwordSetupRedirectTo(process.env.NEXT_PUBLIC_SITE_URL);
}

/** Revalida as superfícies que refletem o estado de usuários/solicitações. */
function revalidateUserSurfaces(): void {
  revalidatePath("/usuarios");
  revalidatePath("/painel"); // KPIs podem contar usuários/pendências
  revalidatePath("/(app)", "layout"); // badges/contadores da sidebar
}

/** Carrega os admins (id/role/status) p/ avaliar a trava do último admin. */
async function loadAdmins(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<{ id: string; role: UserRole; status: AccountStatus }[]> {
  const { data } = await supabase
    .from("profiles")
    .select("id, role, status")
    .eq("role", "admin");
  return (data ?? []) as {
    id: string;
    role: UserRole;
    status: AccountStatus;
  }[];
}

// ════════════════════════════ USUÁRIOS (profiles) ═══════════════════════════

/**
 * Ativa/inativa um usuário (F-31 CA04 — inativo perde acesso de fato pois o RLS
 * e o login devem barrar contas inativas). Bloqueia inativar o último admin
 * (trava de segurança). Idempotente: se já estiver no estado pedido, não falha.
 */
export async function setUserStatusAction(
  userId: string,
  status: string,
): Promise<ActionResult> {
  await requireAdmin();
  if (!userId) return { ok: false, error: "Usuário inválido." };
  if (status !== "active" && status !== "inactive") {
    return { ok: false, error: "Estado inválido." };
  }

  const supabase = await createClient();

  if (status === "inactive") {
    const admins = await loadAdmins(supabase);
    if (wouldRemoveLastAdmin(admins, userId, { status: "inactive" })) {
      return {
        ok: false,
        error:
          "Não é possível inativar o último administrador ativo. Promova outro usuário a administrador antes.",
      };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ status: status as AccountStatus as never })
    .eq("id", userId);
  if (error) return { ok: false, error: "Não foi possível alterar o estado." };

  revalidateUserSurfaces();
  return { ok: true, error: null };
}

/**
 * Atualiza nome, departamento, matrícula, telefone e PERFIL de um usuário
 * (F-30 CA01/CA02). O e-mail NÃO é alterável (F-30 CA04): ignoramos qualquer
 * `email` recebido e preservamos o do banco. Bloqueia rebaixar o último admin.
 *
 * Redefinição de senha (F-30 CA03): quando vier `password`, definimos a nova
 * senha via Admin API (`updateUserById`) — server-only, a senha nunca volta ao
 * client. Para fluxo por link, use `resetUserPasswordAction`.
 */
export async function updateUserAction(
  userId: string,
  input: UserInput,
): Promise<ActionResult> {
  await requireAdmin();
  if (!userId) return { ok: false, error: "Usuário inválido." };

  // Defesa em profundidade: revalida a EDIÇÃO com o MESMO `userSchema` do client
  // (DRY). E-mail é imutável (F-30 CA04) e senha só muda se informada (CA03), o
  // que o schema base já modela (ambos opcionais). Saneia null como antes.
  const parsed = userSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "");
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Verifique os campos.", fieldErrors };
  }
  const v = {
    fullName: parsed.data.fullName,
    role: parsed.data.role,
    department: parsed.data.department ? parsed.data.department : null,
    siapeMatricula: parsed.data.siapeMatricula
      ? parsed.data.siapeMatricula
      : null,
    phone: parsed.data.phone ? parsed.data.phone : null,
    password: parsed.data.password ? parsed.data.password : null,
  };

  const supabase = await createClient();

  // Trava do último admin ao rebaixar p/ professor (F-30 CA02 + segurança).
  if (v.role !== "admin") {
    const admins = await loadAdmins(supabase);
    if (wouldRemoveLastAdmin(admins, userId, { role: v.role })) {
      return {
        ok: false,
        error:
          "Não é possível rebaixar o último administrador ativo. Promova outro usuário a administrador antes.",
      };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: v.fullName,
      role: v.role as never,
      department: v.department,
      siape_matricula: v.siapeMatricula,
      phone: v.phone,
      // email intencionalmente OMITIDO (F-30 CA04).
    })
    .eq("id", userId);
  if (error)
    return { ok: false, error: "Não foi possível atualizar o usuário." };

  revalidateUserSurfaces();

  // F-30 CA03 — redefinição de senha via Admin API (service-role). Os demais
  // campos já foram salvos acima; aqui só trocamos a senha quando informada.
  if (v.password) {
    let admin: ReturnType<typeof getAdminClient>;
    try {
      admin = getAdminClient();
    } catch (err) {
      if (isProvisioningUnavailable(err)) {
        return {
          ok: true,
          error:
            "Dados salvos, mas a redefinição de senha está indisponível: a chave service-role não está configurada. Peça ao usuário usar 'esqueci a senha'.",
        };
      }
      return {
        ok: true,
        error: "Dados salvos, mas a redefinição de senha falhou ao iniciar.",
      };
    }

    const { error: pwError } = await admin.auth.admin.updateUserById(userId, {
      password: v.password,
    });
    if (pwError) {
      return {
        ok: true,
        error: "Dados salvos, mas não foi possível redefinir a senha.",
      };
    }
  }
  return { ok: true, error: null };
}

/**
 * Exclui (ou, na prática, inativa) um usuário com confirmação (F-31 CA01/CA02/CA04).
 *
 * As reservas têm FK `on delete restrict` (preserva histórico — F-31 CA02): se o
 * usuário tiver QUALQUER reserva, o hard-delete é impossível. Nesse caso fazemos
 * o caminho correto e seguro — INATIVAR (perde acesso, histórico preservado —
 * F-31 CA02/CA03/CA04) — e avisamos. Bloqueia remover o último admin.
 */
export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!userId) return { ok: false, error: "Usuário inválido." };

  const supabase = await createClient();

  const admins = await loadAdmins(supabase);
  if (wouldRemoveLastAdmin(admins, userId, { deleting: true })) {
    return {
      ok: false,
      error:
        "Não é possível excluir o último administrador ativo. Promova outro usuário a administrador antes.",
    };
  }
  if (userId === admin.id) {
    return {
      ok: false,
      error: "Você não pode excluir a própria conta por aqui.",
    };
  }

  // F-31 CA02 — há reservas? Então preserva o histórico inativando, não apaga.
  const { count } = await supabase
    .from("reservations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((count ?? 0) > 0) {
    const { error } = await supabase
      .from("profiles")
      .update({ status: "inactive" as never })
      .eq("id", userId);
    if (error)
      return { ok: false, error: "Não foi possível inativar o usuário." };
    revalidateUserSurfaces();
    return {
      ok: true,
      error:
        "Usuário possui reservas no histórico, então foi INATIVADO (sem acesso) em vez de excluído, preservando o histórico.",
    };
  }

  // F-42 CA05 — sem reservas vinculadas: exclusão DEFINITIVA da conta de acesso
  // via Admin API (apaga `auth.users`; o profile cai por cascade/cleanup). Sem
  // service-role, degradamos para inativação (acesso barrado, dado preservado).
  let adminClient: ReturnType<typeof getAdminClient>;
  try {
    adminClient = getAdminClient();
  } catch (err) {
    if (isProvisioningUnavailable(err)) {
      const { error: deactErr } = await supabase
        .from("profiles")
        .update({ status: "inactive" as never })
        .eq("id", userId);
      if (deactErr)
        return { ok: false, error: "Não foi possível inativar o usuário." };
      revalidateUserSurfaces();
      return {
        ok: true,
        error:
          "Exclusão definitiva indisponível (service-role não configurada): o usuário foi INATIVADO (sem acesso). Configure SUPABASE_SERVICE_ROLE_KEY para excluir de vez.",
      };
    }
    return { ok: false, error: "Não foi possível excluir o usuário." };
  }

  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: "Não foi possível excluir o usuário." };

  revalidateUserSurfaces();
  return { ok: true, error: null };
}

/**
 * Cadastro direto de usuário pelo admin (F-28 CA01/CA02/CA03). A senha é
 * definida pelo PRÓPRIO usuário POR E-MAIL: `inviteUserByEmail` cria a conta de
 * acesso E ENVIA um e-mail de convite (link → `/redefinir-senha`), em vez de o
 * admin escolher a senha. O trigger `handle_new_user` cria o profile com
 * `role='professor'`; se o admin pediu papel `admin`, promovemos via UPDATE
 * explícito (não confiamos em metadata). E-mail único checado antes (F-28 CA03).
 *
 * ⚠️ O envio real depende de SMTP/mailer configurado no projeto Supabase. Se o
 * envio falhar (sem SMTP), a conta JÁ FOI criada — fazemos um fallback honesto:
 * geramos um `action_link` de convite e o devolvemos ao admin (server-side,
 * nunca logado) com um aviso claro, para não travar o cadastro.
 *
 * A senha digitada no formulário (F-28 CA02) torna-se OPCIONAL: quando informada,
 * é gravada como credencial inicial de fallback via `updateUserById` — mas o
 * caminho recomendado é o usuário definir a própria pelo e-mail.
 */
export async function createUserAction(
  input: UserInput,
): Promise<ActionResult & { actionLink?: string }> {
  await requireAdmin();

  const validation = validateUserInput(input, {
    requireEmail: true,
    requirePassword: false, // senha agora é definida pelo usuário via e-mail.
  });
  if (!validation.ok || !validation.value) {
    return {
      ok: false,
      error: "Verifique os campos.",
      fieldErrors: validation.errors,
    };
  }
  const v = validation.value;

  const supabase = await createClient();
  // F-28 CA03 — e-mail único (checado no servidor antes de chamar a Admin API).
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, email");
  if (hasDuplicateEmail(existing ?? [], v.email, null)) {
    return {
      ok: false,
      error: "Já existe um usuário com esse e-mail.",
      fieldErrors: { email: "E-mail já cadastrado." },
    };
  }

  let admin: ReturnType<typeof getAdminClient>;
  try {
    admin = getAdminClient();
  } catch (err) {
    if (isProvisioningUnavailable(err)) {
      return { ok: false, error: PROVISIONING_UNAVAILABLE_MESSAGE };
    }
    return { ok: false, error: "Falha ao iniciar o provisionamento." };
  }

  const redirectTo = passwordSetupUrl();

  // F-28 CA01 — cria a conta E envia o e-mail de convite (definição de senha).
  // Papel NÃO vai no metadata: o trigger força 'professor' (segurança).
  let emailSent = true;
  const { data: invited, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(v.email, {
      redirectTo,
      data: {
        full_name: v.fullName,
        department: v.department,
        siape_matricula: v.siapeMatricula,
        phone: v.phone,
      },
    });

  if (inviteError || !invited?.user) {
    if (isEmailAlreadyExistsError(inviteError)) {
      return {
        ok: false,
        error: "Já existe uma conta com esse e-mail.",
        fieldErrors: { email: "E-mail já cadastrado." },
      };
    }
    // Sem SMTP, o convite falha ANTES de criar a conta. Fallback: cria a conta e
    // gera o link manualmente p/ o admin repassar (a conta não pode ficar presa).
    if (isEmailDeliveryError(inviteError)) {
      emailSent = false;
    } else {
      return { ok: false, error: "Não foi possível criar a conta de acesso." };
    }
  }

  let newUserId = invited?.user?.id ?? null;

  // Fallback de criação sem e-mail: cria a conta direto (email_confirm) e gera o
  // link de convite p/ repasse manual pelo admin.
  let actionLink: string | undefined;
  if (!emailSent || !newUserId) {
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: v.email,
        password: v.password ?? undefined,
        email_confirm: true,
        user_metadata: {
          full_name: v.fullName,
          department: v.department,
          siape_matricula: v.siapeMatricula,
          phone: v.phone,
        },
      });
    if (createError || !created?.user) {
      if (isEmailAlreadyExistsError(createError)) {
        return {
          ok: false,
          error: "Já existe uma conta com esse e-mail.",
          fieldErrors: { email: "E-mail já cadastrado." },
        };
      }
      return { ok: false, error: "Não foi possível criar a conta de acesso." };
    }
    newUserId = created.user.id;
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: v.email,
      options: { redirectTo },
    });
    actionLink = linkData?.properties?.action_link;
  } else if (v.password) {
    // Conta convidada com sucesso + admin informou uma senha inicial opcional:
    // grava como credencial de fallback (o usuário ainda pode redefinir pelo
    // e-mail). Falha aqui NÃO derruba o cadastro.
    await admin.auth.admin.updateUserById(newUserId, { password: v.password });
  }

  // Completa o profile criado pelo trigger (nome/departamento/matrícula/telefone)
  // e, se solicitado, PROMOVE a admin via UPDATE explícito (service-role bypassa
  // RLS) — respeitando que o papel só muda por ação auditável do admin (F-28).
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      full_name: v.fullName,
      role: v.role as never,
      department: v.department,
      siape_matricula: v.siapeMatricula,
      phone: v.phone,
    })
    .eq("id", newUserId);

  revalidateUserSurfaces();

  if (updateError) {
    // Conta criada, mas o ajuste de profile falhou: avisa sem derrubar.
    return {
      ok: true,
      error:
        "Conta criada, mas não foi possível aplicar todos os dados do perfil. Edite o usuário para concluir.",
      actionLink,
    };
  }

  if (!emailSent) {
    return {
      ok: true,
      error:
        "Conta criada, mas o e-mail de definição de senha não pôde ser enviado — configure SMTP no Supabase. Repasse o link de definição de senha ao usuário.",
      actionLink,
    };
  }

  return { ok: true, error: null };
}

/**
 * Redefinição de senha pelo admin (F-30 CA03) — POR E-MAIL. Dispara o e-mail de
 * recuperação via `auth.resetPasswordForEmail` (suportado com a anon key, ENVIA
 * o e-mail quando há SMTP), com `redirectTo` → `/redefinir-senha`. A senha NUNCA
 * trafega/é exposta no client.
 *
 * ⚠️ O envio real depende de SMTP no Supabase. Se o envio falhar (sem SMTP),
 * fazemos um fallback honesto: geramos um `action_link` de recuperação via Admin
 * API e o devolvemos ao admin (server-side, nunca logado) com aviso claro.
 */
export async function resetUserPasswordAction(
  email: string,
): Promise<ActionResult & { actionLink?: string }> {
  await requireAdmin();
  const target = (email ?? "").trim().toLowerCase();
  if (!target) return { ok: false, error: "E-mail inválido." };

  const redirectTo = passwordSetupUrl();

  // Caminho por e-mail: envia o e-mail de recuperação (anon key já basta).
  const supabase = await createClient();
  const { error: sendError } = await supabase.auth.resetPasswordForEmail(
    target,
    { redirectTo },
  );
  if (!sendError) {
    return { ok: true, error: null };
  }

  // Envio falhou (sem SMTP / rate limit): fallback p/ link manual via Admin API.
  let admin: ReturnType<typeof getAdminClient>;
  try {
    admin = getAdminClient();
  } catch (err) {
    if (isProvisioningUnavailable(err)) {
      return {
        ok: false,
        error:
          "Não foi possível enviar o e-mail de redefinição e o link manual está indisponível (service-role não configurada). Configure SMTP ou a service-role no Supabase.",
      };
    }
    return { ok: false, error: "Falha ao iniciar a redefinição." };
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: target,
    options: { redirectTo },
  });
  if (error || !data) {
    return {
      ok: false,
      error: "Não foi possível gerar o link de redefinição.",
    };
  }

  return {
    ok: true,
    error:
      "E-mail de redefinição não pôde ser enviado — configure SMTP no Supabase. Repasse o link de redefinição ao usuário.",
    actionLink: data.properties?.action_link,
  };
}

// ═══════════════════════ SOLICITAÇÕES (signup_requests) ══════════════════════

/** Relê a solicitação e confirma que segue pendente (defesa em profundidade). */
async function loadPendingSignup(
  supabase: Awaited<ReturnType<typeof createClient>>,
  signupId: string,
): Promise<
  | {
      ok: true;
      fullName: string;
      email: string;
      role: UserRole;
      department: string | null;
    }
  | { ok: false; error: string }
> {
  const { data, error } = await supabase
    .from("signup_requests")
    .select("id, status, full_name, email, role, department")
    .eq("id", signupId)
    .single();
  if (error || !data)
    return { ok: false, error: "Solicitação não encontrada." };
  if (data.status !== "pending") {
    return {
      ok: false,
      error: "Esta solicitação já foi decidida por outra pessoa.",
    };
  }
  return {
    ok: true,
    fullName: data.full_name,
    email: data.email,
    role: data.role,
    department: data.department,
  };
}

/**
 * Aprova uma solicitação de cadastro (F-32 CA01/CA02/CA03/CA04). Fluxo:
 *  1. CA01 — `requireAdmin()` no servidor (já garantido); idempotência relendo
 *     o status pendente (defesa anti-corrida).
 *  2. CA02 — cria a conta de acesso E ENVIA o e-mail de definição de senha via
 *     `inviteUserByEmail` (link → `/redefinir-senha`). O trigger
 *     `handle_new_user` cria o profile como 'professor'. Aplica nome/depto.
 *  3. Marca a solicitação `approved` (sai da fila — CA04), com guarda anti-corrida.
 *  4. CA03 — agora o solicitante TEM profile (`user_id`): grava a notificação
 *     `account_approved` avisando que já pode entrar.
 *
 * ⚠️ O ENVIO real depende de SMTP/mailer no Supabase. Sem SMTP, o convite falha
 * antes de criar a conta → fallback honesto: criamos a conta via `createUser` e
 * geramos um `action_link` de definição de senha p/ o admin repassar (server-side,
 * nunca logado), com aviso claro. Sem service-role: degrada marcando a
 * solicitação aprovada e avisando (não derruba a app).
 */
export async function approveSignupAction(
  signupId: string,
): Promise<ActionResult & { actionLink?: string }> {
  await requireAdmin();
  if (!signupId) return { ok: false, error: "Solicitação inválida." };

  const supabase = await createClient();
  const current = await loadPendingSignup(supabase, signupId); // idempotência
  if (!current.ok) return { ok: false, error: current.error };

  let admin: ReturnType<typeof getAdminClient>;
  try {
    admin = getAdminClient();
  } catch (err) {
    if (isProvisioningUnavailable(err)) {
      // Sem service-role: marca aprovada e avisa que falta provisionar.
      const { data: marked } = await supabase
        .from("signup_requests")
        .update({ status: "approved" as never })
        .eq("id", signupId)
        .eq("status", "pending")
        .select("id");
      if (marked && marked.length > 0) revalidateUserSurfaces();
      return {
        ok: marked != null && marked.length > 0,
        error:
          "Solicitação aprovada, mas a conta de acesso NÃO foi criada: a chave service-role não está configurada. Defina SUPABASE_SERVICE_ROLE_KEY para liberar o login.",
      };
    }
    return { ok: false, error: "Falha ao iniciar o provisionamento." };
  }

  const redirectTo = passwordSetupUrl();

  // CA02 — cria a conta E envia o e-mail de definição de senha (convite).
  // Papel NÃO vem do metadata (trigger força 'professor').
  let emailSent = true;
  const { data: invited, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(current.email, {
      redirectTo,
      data: {
        full_name: current.fullName,
        department: current.department,
      },
    });

  if (inviteError && isEmailAlreadyExistsError(inviteError)) {
    return {
      ok: false,
      error:
        "Já existe uma conta com esse e-mail. Verifique se o cadastro não foi aprovado antes.",
    };
  }

  let newUserId = invited?.user?.id ?? null;
  let actionLink: string | undefined;

  // Sem SMTP, o convite falha antes de criar a conta → cria direto + link manual.
  if (inviteError || !newUserId) {
    if (inviteError && !isEmailDeliveryError(inviteError)) {
      return { ok: false, error: "Não foi possível criar a conta de acesso." };
    }
    emailSent = false;
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email: current.email,
        email_confirm: true,
        user_metadata: {
          full_name: current.fullName,
          department: current.department,
        },
      });
    if (createError || !created?.user) {
      if (isEmailAlreadyExistsError(createError)) {
        return {
          ok: false,
          error:
            "Já existe uma conta com esse e-mail. Verifique se o cadastro não foi aprovado antes.",
        };
      }
      return { ok: false, error: "Não foi possível criar a conta de acesso." };
    }
    newUserId = created.user.id;
    const { data: linkData } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: current.email,
      options: { redirectTo },
    });
    actionLink = linkData?.properties?.action_link;
  }

  // Completa o profile criado pelo trigger (nome/departamento da solicitação).
  await admin
    .from("profiles")
    .update({
      full_name: current.fullName,
      department: current.department,
    })
    .eq("id", newUserId);

  // CA04 — solicitação sai da fila (guarda anti-corrida).
  const { data: updated, error } = await supabase
    .from("signup_requests")
    .update({ status: "approved" as never })
    .eq("id", signupId)
    .eq("status", "pending")
    .select("id");
  if (error)
    return { ok: false, error: "Não foi possível aprovar a solicitação." };
  if (!updated || updated.length === 0) {
    return {
      ok: false,
      error: "Esta solicitação já foi decidida por outra pessoa.",
    };
  }

  // CA03 — agora há profile: notifica o solicitante que já pode entrar.
  await admin.from("notifications").insert({
    user_id: newUserId,
    type: "account_approved",
    title: "Cadastro aprovado",
    message: emailSent
      ? "Seu cadastro no SIRA foi aprovado. Enviamos um e-mail para você definir sua senha e já acessar."
      : "Seu cadastro no SIRA foi aprovado. Defina sua senha pelo link enviado pelo administrador e já pode acessar.",
  });

  revalidateUserSurfaces();

  if (!emailSent) {
    return {
      ok: true,
      error:
        "Cadastro aprovado; e-mail de definição de senha não pôde ser enviado — configure SMTP no Supabase. Repasse o link ao usuário.",
      actionLink,
    };
  }

  return { ok: true, error: null };
}

/**
 * Recusa uma solicitação de cadastro com justificativa OBRIGATÓRIA (F-33
 * CA01/CA02/CA03). Move o status p/ `rejected`, grava o `reason` na própria
 * solicitação (consultável pelo solicitante quando reabrir o auto-serviço — CA02)
 * e NÃO cria usuário (CA03). Guarda anti-corrida no UPDATE.
 */
export async function rejectSignupAction(
  signupId: string,
  reason: string,
): Promise<ActionResult> {
  await requireAdmin();
  if (!signupId) return { ok: false, error: "Solicitação inválida." };

  const reasonCheck = validateRejectReason(reason); // F-33 CA01 — no servidor.
  if (!reasonCheck.ok || !reasonCheck.value) {
    return { ok: false, error: reasonCheck.error ?? "Motivo inválido." };
  }

  const supabase = await createClient();
  const current = await loadPendingSignup(supabase, signupId);
  if (!current.ok) return { ok: false, error: current.error };

  const { data: updated, error } = await supabase
    .from("signup_requests")
    .update({ status: "rejected" as never, reason: reasonCheck.value })
    .eq("id", signupId)
    .eq("status", "pending")
    .select("id");
  if (error)
    return { ok: false, error: "Não foi possível recusar a solicitação." };
  if (!updated || updated.length === 0) {
    return {
      ok: false,
      error: "Esta solicitação já foi decidida por outra pessoa.",
    };
  }

  // F-33 CA02 — o solicitante ainda não tem profile (sem user_id), então a
  // notificação não pode ser gravada em `notifications`; o motivo fica salvo na
  // solicitação e é exibido quando a pessoa reabre o auto-serviço de cadastro.

  revalidateUserSurfaces();
  return { ok: true, error: null };
}
