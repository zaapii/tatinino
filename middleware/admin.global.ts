export default defineNuxtRouteMiddleware(async (to) => {
  const normalizedPath = to.path.replace(/\/+$/, '') || '/'
  if (!normalizedPath.startsWith('/admin') || normalizedPath === '/admin/login' || import.meta.server) return

  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return navigateTo({ path: '/admin/login', query: { redirect: normalizedPath } })
  }

  const { data: authorization, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (error || !authorization) {
    await supabase.auth.signOut()
    return navigateTo({ path: '/admin/login', query: { error: 'unauthorized' } })
  }
})
