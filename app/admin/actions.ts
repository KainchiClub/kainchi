'use server'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { clearAdminSession, createAdminSession, isAdminSessionActive, isValidAdminPin } from './auth'
import type { CustomerProfile } from '@/lib/kainchi-crm'

export type AdminLoginState = { error: string }

type FailedAttemptState = { count: number; lockedUntil: number; lastAttemptAt: number }

const failedAttempts = new Map<string, FailedAttemptState>()
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

function getServerAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function getClientKey() {
  const requestHeaders = await headers()
  const forwardedAddresses =
    requestHeaders
      .get('x-forwarded-for')
      ?.split(',')
      .map((address) => address.trim())
      .filter(Boolean) ?? []
  const clientAddress =
    requestHeaders.get('x-real-ip')?.trim() ||
    forwardedAddresses[forwardedAddresses.length - 1] ||
    'unknown'
  return createHash('sha256').update(clientAddress).digest('hex')
}

function removeExpiredAttempts(now: number) {
  for (const [clientKey, attempt] of failedAttempts) {
    if (now - attempt.lastAttemptAt >= LOCKOUT_MS) failedAttempts.delete(clientKey)
  }
}

export async function unlockAdmin(_previousState: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const clientKey = await getClientKey()
  const now = Date.now()
  removeExpiredAttempts(now)
  const attempts = failedAttempts.get(clientKey)

  if (attempts && attempts.lockedUntil > now) {
    return { error: 'Too many attempts. Please try again in 15 minutes.' }
  }

  const pin = String(formData.get('pin') ?? '')
  if (!isValidAdminPin(pin)) {
    const nextCount = (attempts?.count ?? 0) + 1
    const lockedUntil = nextCount >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_MS : 0
    failedAttempts.set(clientKey, { count: nextCount, lockedUntil, lastAttemptAt: now })
    return {
      error:
        lockedUntil > now
          ? 'Too many attempts. Please try again in 15 minutes.'
          : 'That PIN is not correct. Please try again.',
    }
  }

  failedAttempts.delete(clientKey)
  await createAdminSession()
  redirect('/admin')
}

export async function signOutAdmin() {
  await clearAdminSession()
  redirect('/admin')
}

// 1. Fetch all members securely on server (bypasses RLS safely only when admin session is active)
export async function fetchSecureMembersList(): Promise<{
  ok: boolean
  members: CustomerProfile[]
  error?: string
  hasServiceRole: boolean
}> {
  const isAuthed = await isAdminSessionActive()
  if (!isAuthed) {
    return { ok: false, members: [], error: 'Unauthorized admin session.', hasServiceRole: false }
  }

  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
  const supabase = getServerAdminSupabase()
  if (!supabase) {
    return {
      ok: false,
      members: [],
      error: 'Supabase environment variables are missing on Vercel.',
      hasServiceRole,
    }
  }

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return {
      ok: false,
      members: [],
      error: error.message,
      hasServiceRole,
    }
  }

  return {
    ok: true,
    members: (data ?? []) as CustomerProfile[],
    hasServiceRole,
  }
}

// 2. Update member rewards/orders securely on server
export async function updateSecureMemberField(
  email: string,
  field: 'referral_count' | 'discount_earned' | 'discount_used' | 'total_orders',
  value: number,
  fallbackProfile?: CustomerProfile,
): Promise<{ ok: boolean; error?: string }> {
  const isAuthed = await isAdminSessionActive()
  if (!isAuthed) {
    return { ok: false, error: 'Unauthorized admin session.' }
  }

  const supabase = getServerAdminSupabase()
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured on server.' }
  }

  const cleanEmail = email.trim().toLowerCase()
  const safeVal = Math.max(0, Math.round(Number(value) || 0))

  // Check if record exists first; if it only existed locally, upsert it to cloud
  const { data: existing } = await supabase
    .from('customers')
    .select('email')
    .eq('email', cleanEmail)
    .maybeSingle()

  if (!existing && fallbackProfile) {
    const { error: upsertErr } = await supabase.from('customers').upsert(
      {
        full_name: fallbackProfile.full_name,
        email: cleanEmail,
        phone: fallbackProfile.phone || null,
        member_code: fallbackProfile.member_code || null,
        referred_by: fallbackProfile.referred_by || null,
        referral_count: field === 'referral_count' ? safeVal : fallbackProfile.referral_count ?? 0,
        discount_earned: field === 'discount_earned' ? safeVal : fallbackProfile.discount_earned ?? 0,
        discount_used: field === 'discount_used' ? safeVal : fallbackProfile.discount_used ?? 0,
        total_orders: field === 'total_orders' ? safeVal : fallbackProfile.total_orders ?? 0,
        total_spent: fallbackProfile.total_spent ?? 0,
        last_gift_sent: fallbackProfile.last_gift_sent ?? 'None',
      },
      { onConflict: 'email' },
    )
    if (upsertErr) return { ok: false, error: upsertErr.message }
    return { ok: true }
  }

  const { error } = await supabase
    .from('customers')
    .update({ [field]: safeVal })
    .eq('email', cleanEmail)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

// 3. Sync full catalog snapshot securely to store_cloud_state so every user's phone sees live admin changes
export async function syncSecureCatalogCloudState(
  payload: unknown[],
): Promise<{ ok: boolean; error?: string }> {
  const isAuthed = await isAdminSessionActive()
  if (!isAuthed) {
    return { ok: false, error: 'Unauthorized admin session.' }
  }

  const supabase = getServerAdminSupabase()
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured on server.' }
  }

  const { error } = await supabase.from('store_cloud_state').upsert(
    {
      state_key: 'kainchi-catalog-master-v1',
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'state_key' },
  )

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}
