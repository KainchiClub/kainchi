import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const GATEWAY_CLOUD_SETTINGS_KEY = 'kainchi-store-gateway-cloud-v1'
export const CUSTOMER_SESSION_KEY = 'kainchi-member-session-v1'

export interface CustomerProfile {
  id: string
  full_name: string
  email: string
  phone?: string | null
  total_orders: number
  total_spent: number
  last_gift_sent?: string | null
  last_order_at?: string | null
  created_at?: string
}

export const NO_REPEAT_GIFT_TIERS = [
  'Order #01: Custom Brass Kainchi Keychain + Sticker Pack + Handwritten Welcome Note',
  'Order #02: Organic Cotton Crew Socks + Mini Woody Scented Sachet',
  'Order #03: Heavyweight Studio Canvas Tote Bag + VIP Member Card',
  'Order #04: Stainless Steel Atelier Pendant + Travel Oud Roll-On',
  'Order #05+: Bespoke Embroidered Cap + Collector Wax-Seal Note',
]

export function pickNextNonRepeatGift(orderSequence: number, lastGiftSent?: string | null): string {
  const index = Math.max(0, Math.min(orderSequence - 1, NO_REPEAT_GIFT_TIERS.length - 1))
  const candidate = NO_REPEAT_GIFT_TIERS[index]
  if (lastGiftSent && candidate === lastGiftSent) {
    return NO_REPEAT_GIFT_TIERS[(index + 1) % NO_REPEAT_GIFT_TIERS.length]
  }
  return candidate
}

export function getBrowserSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(GATEWAY_CLOUD_SETTINGS_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    const url = (parsed.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
    const key = (parsed.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
    if (!url || !key) return null
    return createClient(url, key)
  } catch {
    return null
  }
}

export function getStoredCustomerSession(): CustomerProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CUSTOMER_SESSION_KEY)
    return raw ? (JSON.parse(raw) as CustomerProfile) : null
  } catch {
    return null
  }
}

export function setStoredCustomerSession(profile: CustomerProfile | null) {
  if (typeof window === 'undefined') return
  try {
    if (profile) {
      window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(profile))
    } else {
      window.localStorage.removeItem(CUSTOMER_SESSION_KEY)
    }
    window.dispatchEvent(new Event('kainchi-member-changed'))
  } catch {}
}

export async function triggerStudioNotification(payload: {
  eventType: 'signup' | 'order_placed' | 'abandoned_cart' | 'system_error' | 'feedback_request'
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  orderSummary?: string
  orderTotal?: number
  orderSequence?: number
  giftAssigned?: string
  errorDetails?: string
}) {
  try {
    await fetch('/api/kainchi-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // Non-blocking notification
  }
}

export async function logErrorOrCartEvent(params: {
  eventType: 'abandoned_cart' | 'signup_error' | 'login_error' | 'checkout_error'
  customerEmail?: string
  customerName?: string
  customerPhone?: string
  details?: Record<string, unknown>
}) {
  const supabase = getBrowserSupabaseClient()
  if (supabase) {
    try {
      await supabase.from('abandoned_carts').insert({
        customer_email: params.customerEmail || null,
        customer_name: params.customerName || null,
        customer_phone: params.customerPhone || null,
        event_type: params.eventType,
        details: params.details ?? {},
      })
    } catch {}
  }
  await triggerStudioNotification({
    eventType: params.eventType === 'abandoned_cart' ? 'abandoned_cart' : 'system_error',
    customerEmail: params.customerEmail,
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    errorDetails: JSON.stringify(params.details ?? {}),
  })
}
