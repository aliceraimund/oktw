-- ============================================================
-- OKTW EPI Manager — Schema completo
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Perfis de usuário (extensão da tabela auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text not null,
  email text not null,
  role text not null check (role in ('rh', 'gestor', 'colaborador')),
  setor text,
  cargo text,
  ctps text,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- Catálogo de EPIs
create table if not exists epis (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ca text not null,
  validade_dias int not null,
  estoque_atual int default 0,
  estoque_minimo int default 0,
  consumo_medio_mensal numeric(6,2) default 0,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- Registro de entregas
create table if not exists entregas (
  id uuid primary key default gen_random_uuid(),
  colaborador_id uuid references profiles(id) not null,
  epi_id uuid references epis(id) not null,
  quantidade int not null default 1,
  data_entrega date not null,
  data_vencimento date not null,
  registrado_por uuid references profiles(id),
  assinado boolean default false,
  data_assinatura timestamptz,
  pdf_url text,
  token_assinatura uuid default gen_random_uuid() unique,
  created_at timestamptz default now()
);

-- Log de assinaturas (auditoria)
create table if not exists assinaturas (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid references entregas(id) not null,
  assinatura_base64 text not null,
  ip_address text,
  user_agent text,
  signed_at timestamptz default now()
);

-- Alertas de vencimento
create table if not exists alertas (
  id uuid primary key default gen_random_uuid(),
  entrega_id uuid references entregas(id) not null,
  tipo text not null check (tipo in ('30d', '15d', '7d', 'vencido')),
  enviado_em timestamptz default now()
);

-- ============================================================
-- Trigger: cria perfil automaticamente ao criar usuário
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'colaborador')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- Storage bucket para fichas assinadas
-- ============================================================
insert into storage.buckets (id, name, public)
values ('fichas-assinadas', 'fichas-assinadas', false)
on conflict (id) do nothing;

-- ============================================================
-- RLS: habilitar em todas as tabelas
-- ============================================================
alter table profiles enable row level security;
alter table epis enable row level security;
alter table entregas enable row level security;
alter table assinaturas enable row level security;
alter table alertas enable row level security;
