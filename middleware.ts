/**
 * Next.js Middleware
 *
 * Runs before every request to:
 * 1. Refresh Supabase auth tokens (keep user logged in)
 * 2. Protect routes that require authentication
 *
 * Protected routes: /dashboard, /api/treasury/create, etc.
 * Public routes: /, /treasury/[address], /auth/login
 */

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Update auth session (refresh tokens if needed)
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
