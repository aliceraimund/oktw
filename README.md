# OKTW EPI Manager

Sistema de Gestão de Equipamentos de Proteção Individual (NR-6)

## Stack

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **E-mails:** Resend
- **PDF:** pdf-lib (geração client-side/server-side)
- **Deploy:** Vercel + Supabase Cloud

---

## Setup em 5 passos

### 1. Instalar dependências

```bash
npm install
```

### 2. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **SQL Editor** e execute em ordem:
   - `supabase/schema.sql`
   - `supabase/rls.sql`
3. (Opcional) Configure o job de alertas: `supabase/cron.sql`

### 3. Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
RESEND_API_KEY=re_xxxx
NEXT_PUBLIC_APP_URL=https://app.oktw.com.br
CRON_SECRET=uma-string-secreta-qualquer
```

As chaves do Supabase estão em: **Project Settings → API**

### 4. Criar o primeiro usuário RH

No Supabase Dashboard → **Authentication → Users → Add user**:
- E-mail e senha do usuário RH
- Após criar, atualize manualmente na tabela `profiles`: `role = 'rh'`

### 5. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## Estrutura do projeto

```
src/
├── app/
│   ├── login/              # Tela de login
│   ├── dashboard/          # Dashboard com KPIs e alertas
│   ├── colaboradores/      # CRUD de colaboradores
│   ├── epis/               # CRUD do catálogo de EPIs
│   ├── entregas/
│   │   ├── nova/           # Formulário de nova entrega
│   │   └── [token]/assinar # Tela pública de assinatura (mobile-first)
│   ├── vencimentos/        # Controle de prazos
│   ├── compras/            # Sugestão de reposição
│   └── api/
│       ├── assinatura/[token]     # GET: dados; POST: salva assinatura + gera PDF
│       ├── alertas/cron           # Job de alertas de vencimento
│       ├── email/assinatura-pendente
│       └── colaboradores          # Criação de usuários (usa service_role)
├── components/
│   ├── ui/                 # Componentes base (Button, Card, Table, etc.)
│   ├── layout/             # Sidebar, Header
│   ├── SignatureCanvas.tsx # Canvas de assinatura (touch + mouse)
│   ├── EpiStatusBadge.tsx  # Badge de status com dias restantes
│   └── AlertaVencimento.tsx
├── lib/
│   ├── supabase.ts         # Client (browser)
│   ├── supabase-server.ts  # Client (server) + Admin (service_role)
│   ├── pdf.ts              # Geração do PDF da ficha de entrega
│   ├── email.ts            # Envio de e-mails via Resend
│   ├── calculos.ts         # Cálculo de sugestão de compras
│   └── utils.ts            # Formatação de datas (America/Sao_Paulo), utilitários
├── middleware.ts            # Proteção de rotas
└── types/
    └── database.ts         # Tipos TypeScript do banco
supabase/
├── schema.sql              # Criação das tabelas + trigger + storage bucket
├── rls.sql                 # Políticas de Row Level Security
└── cron.sql                # Job pg_cron para alertas diários
```

---

## Fluxo da assinatura eletrônica

```
RH registra entrega
       ↓
Sistema envia e-mail com link único
       ↓
Colaborador acessa /entregas/{token}/assinar (sem login)
       ↓
Colaborador assina no canvas (funciona no celular)
       ↓
POST /api/assinatura/{token}
  ├── Valida token
  ├── Salva assinatura na tabela auditoria (com IP + user agent)
  ├── Gera PDF (pdf-lib) com dados + assinatura + hash SHA-256
  ├── Upload PDF → Supabase Storage (fichas-assinadas/)
  └── Atualiza entrega: assinado=true, pdf_url=...
       ↓
Colaborador vê confirmação + link para baixar PDF
```

---

## Alertas de vencimento

O job POST `/api/alertas/cron` (protegido por `CRON_SECRET`):
- Verifica diariamente todas as entregas assinadas
- Envia e-mail para o colaborador quando faltam 30, 15 e 7 dias
- Envia alerta imediato quando vencido
- Registra na tabela `alertas` para não duplicar envios

**Para acionar via Supabase Edge Function agendada:**
1. Dashboard → Edge Functions → Deploy uma função que chame o endpoint
2. Schedule: `0 10 * * *` (10h UTC = 7h Brasília)

---

## Perfis de acesso

| Perfil | Dashboard | Colaboradores | EPIs | Entregas | Vencimentos | Compras |
|--------|-----------|---------------|------|----------|-------------|---------|
| RH / Segurança | ✓ | ✓ (CRUD) | ✓ (CRUD) | ✓ (registrar) | ✓ | ✓ |
| Gestor | ✓ | ✓ (leitura) | ✓ (leitura) | ✓ (leitura) | ✓ | ✓ |
| Colaborador | — | — | — | Apenas os seus | — | — |

---

## Deploy na Vercel

```bash
# Conectar ao repositório GitHub e configurar env vars no painel da Vercel
vercel --prod
```

Lembrar de adicionar todas as variáveis de `.env.example` nas **Environment Variables** da Vercel.
