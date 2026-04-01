import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export type ApiError = { error: string; details?: string }

export function errorResponse(message: string, status: number, details?: string): NextResponse {
  const body: ApiError = { error: message }
  if (details) body.details = details
  return NextResponse.json(body, { status })
}

/** Resolves the authenticated user and their profile. Returns null if unauthorized. */
export async function getAuthContext() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, org_id, is_superadmin, roles(slug, permissions)')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return { supabase, user, profile }
}

export function hasRole(profile: any, ...slugs: string[]): boolean {
  if (profile.is_superadmin) return true
  const roleSlug = profile.roles?.slug
  return slugs.includes(roleSlug)
}
