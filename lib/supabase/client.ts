/**
 * Supabase Client - Browser/Client-side
 *
 * Use this in React components, client components, and browser code
 * This uses the anon key which is safe to expose publicly
 */

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
