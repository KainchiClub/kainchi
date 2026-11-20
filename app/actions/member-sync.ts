'use server'

import { createClient } from '@supabase/supabase-js'
import type { CustomerProfile } from '@/lib/kainchi-crm'

function getServerPublicMemberClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function lookupMemberPassSecure(params: {
  email?: string
  phone?: string
  memberCode?: string
}): Promise<CustomerProfile | null> {
  const supabase = getServerPublicMemberClient()
  if (!supabase) return null

  const cleanEmail = params.email?.trim().toLowerCase()
  const cleanPhone = params.phone?.replace(/\D/g, '').slice(-10)
  const cleanCode = params.memberCode?.trim().toUpperCase()

  if (cleanEmail) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle()

    if (data) {
      const record = data as CustomerProfile
      const dbPhone = (record.phone || '').replace(/\D/g, '').slice(-10)
      if (cleanPhone && dbPhone && dbPhone !== cleanPhone) return null
      return record
    }
  }

  if (cleanCode) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .ilike('member_code', cleanCode)
      .limit(1)
      .maybeSingle()
    if (data) return data as CustomerProfile
  }

  if (cleanPhone && cleanPhone.length === 10) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .ilike('phone', `%${cleanPhone}`)
      .limit(1)
      .maybeSingle()
    if (data) return data as CustomerProfile
  }

  return null
}

export async function upsertMemberPassSecure(profile: {
  full_name: string
  email: string
  phone: string
  member_code: string
  referred_by?: string | null
}): Promise<CustomerProfile | null> {
  const supabase = getServerPublicMemberClient()
  if (!supabase) return null

  const cleanEmail = profile.email.trim().toLowerCase()
  const cleanPhone = profile.phone.replace(/\D/g, '').slice(-10)

  const { data: existing } = await supabase
    .from('customers')
    .select('*')
    .eq('email', cleanEmail)
    .maybeSingle()

  if (existing) {
    const { data: updated } = await supabase
      .from('customers')
      .update({
        full_name: profile.full_name.trim(),
        phone: cleanPhone,
        member_code: profile.member_code,
      })
      .eq('email', cleanEmail)
      .select('*')
      .single()
    return (updated as CustomerProfile) ?? (existing as CustomerProfile)
  }

  const { data: created } = await supabase
    .from('customers')
    .insert({
      full_name: profile.full_name.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      member_code: profile.member_code,
      referred_by: profile.referred_by || null,
      referral_count: 0,
      discount_earned: 0,
      discount_used: 0,
      total_orders: 0,
      total_spent: 0,
      last_gift_sent: 'None',
    })
    .select('*')
    .single()

  return (created as CustomerProfile) ?? null
}
