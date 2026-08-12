-- ============================================================================
-- Migração — ajustes do Notion "OKTW 2"
-- Rodar no SQL Editor do Supabase (projeto Controle EPIs).
-- Seguro para rodar mais de uma vez (IF NOT EXISTS / DROP POLICY IF EXISTS).
-- ============================================================================

-- 1) Histórico de disparos (itens 2 e 12) --------------------------------------
create table if not exists disparos (
  id           uuid primary key default gen_random_uuid(),
  ficha_id     uuid references fichas_entrega(id) on delete cascade,
  item_id      uuid references itens_entrega(id) on delete cascade,
  canal        text not null check (canal in ('email', 'whatsapp')),
  tipo         text not null default 'assinatura' check (tipo in ('assinatura', 'vencimento')),
  enviado_por  uuid references profiles(id),
  created_at   timestamptz default now()
);
create index if not exists idx_disparos_ficha on disparos(ficha_id);

-- 2) Devolução item por item (itens 12 e 15) -----------------------------------
-- Cada item de uma ficha de devolução aponta para o item de entrega original.
alter table itens_entrega add column if not exists item_origem_id uuid references itens_entrega(id);
create index if not exists idx_itens_origem on itens_entrega(item_origem_id);

-- 3) Segurança: habilitar RLS (item 17) ----------------------------------------
-- O app acessa o banco de duas formas:
--   • Servidor (API routes / server components) usa a SERVICE ROLE, que IGNORA
--     o RLS — logo, todo o fluxo público de assinatura (via API) continua igual.
--   • Navegador do staff logado usa a chave ANON com sessão AUTENTICADA.
-- Estratégia: ligar RLS em tudo; liberar acesso apenas para 'authenticated'.
-- Resultado: o público anônimo deixa de conseguir ler/gravar via chave anon
-- (era o alerta do Supabase), e nada do sistema quebra.

alter table profiles       enable row level security;
alter table epis           enable row level security;
alter table fichas_entrega enable row level security;
alter table itens_entrega  enable row level security;
alter table assinaturas    enable row level security;
alter table operacoes_epi  enable row level security;
alter table disparos       enable row level security;
alter table alertas        enable row level security;

-- Tabelas que o navegador do staff realmente acessa: acesso total p/ autenticados.
drop policy if exists "staff_all" on profiles;
create policy "staff_all" on profiles       for all to authenticated using (true) with check (true);
drop policy if exists "staff_all" on epis;
create policy "staff_all" on epis           for all to authenticated using (true) with check (true);
drop policy if exists "staff_all" on fichas_entrega;
create policy "staff_all" on fichas_entrega for all to authenticated using (true) with check (true);
drop policy if exists "staff_all" on itens_entrega;
create policy "staff_all" on itens_entrega  for all to authenticated using (true) with check (true);

-- assinaturas, operacoes_epi, disparos e alertas são acessadas SOMENTE pelo
-- servidor (service role, que ignora RLS). Sem política = sem acesso anônimo.
-- (Se a tabela 'configuracoes' existir no seu projeto, rode também:)
--   alter table configuracoes enable row level security;
--   create policy "staff_all" on configuracoes for all to authenticated using (true) with check (true);
