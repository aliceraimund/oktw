-- ============================================================
-- OKTW EPI Manager — Políticas RLS
-- Execute APÓS o schema.sql
-- ============================================================

-- -------------------- PROFILES --------------------
-- Usuário vê seu próprio perfil
create policy "usuario_ver_proprio_perfil" on profiles
  for select using (id = auth.uid());

-- RH e gestor veem todos os perfis
create policy "rh_gestor_ver_todos_perfis" on profiles
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('rh', 'gestor'))
  );

-- Apenas RH insere/atualiza perfis
create policy "rh_gerenciar_perfis" on profiles
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'rh')
  );

-- -------------------- EPIs --------------------
-- Todos os autenticados veem EPIs
create policy "todos_ver_epis" on epis
  for select using (auth.role() = 'authenticated');

-- Apenas RH gerencia EPIs
create policy "rh_gerenciar_epis" on epis
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'rh')
  );

-- -------------------- ENTREGAS --------------------
-- Colaborador vê apenas suas próprias entregas
create policy "colaborador_ver_proprias_entregas" on entregas
  for select using (colaborador_id = auth.uid());

-- RH e gestores veem todas as entregas
create policy "rh_gestor_ver_todas_entregas" on entregas
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('rh', 'gestor'))
  );

-- Apenas RH insere entregas
create policy "rh_inserir_entregas" on entregas
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'rh')
  );

-- RH atualiza entregas
create policy "rh_atualizar_entregas" on entregas
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'rh')
  );

-- Acesso público ao token de assinatura (sem login)
-- A API route usa service_role, por isso não precisa de policy especial

-- -------------------- ASSINATURAS --------------------
-- Apenas RH e gestores veem assinaturas
create policy "rh_gestor_ver_assinaturas" on assinaturas
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('rh', 'gestor'))
  );

-- -------------------- ALERTAS --------------------
-- Apenas RH e gestores veem alertas
create policy "rh_gestor_ver_alertas" on alertas
  for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('rh', 'gestor'))
  );

-- -------------------- STORAGE --------------------
-- RH pode fazer upload no bucket fichas-assinadas
create policy "rh_upload_fichas" on storage.objects
  for insert with check (
    bucket_id = 'fichas-assinadas' and
    exists (select 1 from profiles where id = auth.uid() and role = 'rh')
  );

-- RH e gestores podem ler as fichas
create policy "rh_gestor_ler_fichas" on storage.objects
  for select using (
    bucket_id = 'fichas-assinadas' and
    exists (select 1 from profiles where id = auth.uid() and role in ('rh', 'gestor'))
  );
