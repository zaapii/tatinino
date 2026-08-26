import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

export function useSupabaseClient() {
  const config = useRuntimeConfig()
  const url = config.public.supabaseUrl as string
  const publishableKey = config.public.supabasePublishableKey as string

  if (!url || !publishableKey) {
    throw new Error('Falta configurar la conexión pública con Supabase.')
  }

  client ??= createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: import.meta.client,
      persistSession: import.meta.client,
      detectSessionInUrl: import.meta.client,
    },
  })

  return client
}
