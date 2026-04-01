import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, errorResponse, hasRole } from '@/lib/api/helpers'

// GET /api/users — list all users in the org
export async function GET(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, profile } = ctx

  const { data, error } = await supabase
    .from('user_profiles')
    .select(`
      id, full_name, email, is_active, is_superadmin, created_at, updated_at,
      roles(id, name, slug)
    `)
    .eq('org_id', profile.org_id)
    .order('full_name')

  if (error) return errorResponse('Failed to fetch users', 500, error.message)

  return NextResponse.json({ users: data ?? [] })
}

// POST /api/users — invite a new user (Master role only)
export async function POST(req: NextRequest) {
  const ctx = await getAuthContext()
  if (!ctx) return errorResponse('Unauthorized', 401)

  const { supabase, profile } = ctx

  if (!hasRole(profile, 'master')) {
    return errorResponse('Forbidden: Master role required to invite users', 403)
  }

  const body = await req.json()
  const { email, full_name, role_id } = body

  if (!email || !full_name || !role_id) {
    return errorResponse('email, full_name, and role_id are required', 400)
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return errorResponse('Invalid email address', 400)
  }

  // Verify role belongs to the org
  const { data: role } = await supabase
    .from('roles')
    .select('id, name, slug')
    .eq('id', role_id)
    .eq('org_id', profile.org_id)
    .single()

  if (!role) return errorResponse('Role not found in this organization', 404)

  // Check if user with this email already exists in the org
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .eq('org_id', profile.org_id)
    .maybeSingle()

  if (existingProfile) {
    return errorResponse('A user with this email already exists in the organization', 409)
  }

  // Invite user via Supabase Auth Admin API
  // This sends an invite email and creates the auth.users record
  const supabaseAdmin = (await import('@supabase/supabase-js')).createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name,
      org_id: profile.org_id,
      role_id,
    },
  })

  if (inviteError || !inviteData.user) {
    return errorResponse('Failed to send invitation', 500, inviteError?.message)
  }

  // Create user profile (the trigger on auth.users may not exist, so create explicitly)
  const { data: newProfile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .upsert({
      id: inviteData.user.id,
      org_id: profile.org_id,
      role_id,
      full_name,
      email,
      is_active: false, // Will be activated upon first login
    })
    .select()
    .single()

  if (profileError) {
    return errorResponse('User invited but profile creation failed', 500, profileError.message)
  }

  return NextResponse.json(
    {
      message: `Invitation sent to ${email}`,
      user: { ...newProfile, roles: role },
    },
    { status: 201 }
  )
}
