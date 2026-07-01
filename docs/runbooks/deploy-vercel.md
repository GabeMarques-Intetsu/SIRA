# Runbook — Deploy do SIRA na Vercel (via GitHub)

> Este runbook documenta a configuração de deploy. **Nada aqui executa commit,
> push ou PR** — a integração só deve ser ligada quando o grupo de desenvolvimento
> tiver enviado suas partes ao repositório. As configurações de código já estão
> prontas (`.env.example`, headers em `next.config.ts`, `redirectTo` por env).

## Pré-requisitos
- Repositório no GitHub com o código já mesclado pelo grupo.
- Projeto Supabase ativo (o mesmo do dev).
- Conta na Vercel com acesso ao repositório.

## 1. Conectar o repositório
1. Vercel → **Add New… → Project** → importe o repositório do GitHub.
2. Framework Preset: **Next.js** (auto-detectado). Build Command `next build` e Output
   ficam no padrão — **não** é preciso `vercel.json`.
3. Node.js Version: use **22.x** (ou a LTS disponível). O `.nvmrc` pina `24`; se a
   Vercel ainda não oferecer 24, selecione 22 em *Project Settings → General → Node.js Version*.

## 2. Variáveis de ambiente (Project Settings → Environment Variables)
Defina para **Production** (e Preview, se quiser previews):

| Variável | Valor | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable/anon key | pública |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role **secret** | **secreta** — nunca `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | `https://<seu-dominio>.vercel.app` | usado no `redirectTo` dos e-mails |

Modelo em [`.env.example`](../../.env.example). **Nunca** comite valores reais.

## 3. Supabase — URLs de autenticação (Dashboard → Authentication → URL Configuration)
- **Site URL**: `https://<seu-dominio>.vercel.app`
- **Redirect URLs** (allow list), adicione:
  - `https://<seu-dominio>.vercel.app/redefinir-senha`
  - `https://<seu-dominio>.vercel.app/**` (cobre previews/rotas)

Sem isso, os links de convite/recuperação de senha falham (`redirect_to` não autorizado).

## 4. SMTP — envio real dos e-mails (Dashboard → Authentication → Emails / SMTP)
O provisionamento usa `inviteUserByEmail` / `resetPasswordForEmail`. Sem SMTP próprio,
o mailer padrão do Supabase tem **limite baixo** e pode não entregar.
- Configure um SMTP institucional (ex.: servidor do IFPB) ou provedor (Resend, SendGrid…).
- Enquanto não houver SMTP, as Server Actions degradam com aviso e expõem o
  `action_link` server-side (ver `src/app/(app)/usuarios/actions.ts`).

## 5. Deploy
- Com o repositório conectado, cada push na branch de produção dispara um deploy.
- Verifique o build na Vercel e, depois, rode o smoke (login admin + telas) no domínio.

## Pós-deploy — checklist
- [ ] Login institucional (`@ifpb.edu.br`) funciona no domínio.
- [ ] `NEXT_PUBLIC_SITE_URL` correto → e-mail de definição de senha abre `/redefinir-senha`.
- [ ] Headers de segurança presentes (DevTools → Network → resposta da página).
- [ ] VLibras carrega (botão flutuante de Libras).
- [ ] RLS ativa (usuário só vê os próprios dados).

## Itens dependentes de infra (ver ADR-007)
MFA exigido no login (AAL), revisão de sessões, upload de foto (Storage) e i18n
seguem como evolução — não bloqueiam o deploy do MVP.
