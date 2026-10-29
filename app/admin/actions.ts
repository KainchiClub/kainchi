'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { clearAdminSession, createAdminSession, isValidAdminPin } from './auth'

export type AdminLoginState = { error: string }

const failedAttempts = new Map<string, { count: number; lockedUntil: number }>()
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

async function getClientKey() {
  const requestHeaders = await headers()
  return requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
    || requestHeaders.get('x-real-ip')
    || 'unknown'
}

export async function unlockAdmin(_previousState: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const clientKey = await getClientKey()
  const now = Date.now()
  const attempts = failedAttempts.get(clientKey)

  if (attempts && attempts.lockedUntil > now) {
    return { error: 'Too many attempts. Please try again in 15 minutes.' }
  }

  const pin = String(formData.get('pin') ?? '')
  if (!isValidAdminPin(pin)) {
    const nextCount = attempts && attempts.lockedUntil <= now ? 1 : (attempts?.count ?? 0) + 1
    failedAttempts.set(clientKey, {
      count: nextCount,
      lockedUntil: nextCount >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_MS : 0,
    })
    return { error: 'That PIN is not correct. Please try again.' }
  }

  failedAttempts.delete(clientKey)
  await createAdminSession()
  redirect('/admin')
}

export async function signOutAdmin() {
  await clearAdminSession()
  redirect('/admin')
}
