import { createServerSupabaseClient } from './supabase-server'

/** Retorna o perfil (role) do usuário autenticado, ou null se não logado. */
export async function getPerfilAtual(): Promise<string | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    return data?.role ?? null
  } catch {
    return null
  }
}

/**
 * Verifica se o usuário tem um dos perfis exigidos. Retorna { ok } ou
 * { ok:false, status, error } para a rota responder.
 */
export async function exigirPerfil(perfis: string[]) {
  const perfil = await getPerfilAtual()
  if (!perfil) return { ok: false as const, status: 401, error: 'Não autenticado.' }
  if (!perfis.includes(perfil)) return { ok: false as const, status: 403, error: 'Sem permissão.' }
  return { ok: true as const, perfil }
}
