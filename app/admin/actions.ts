'use server'

import { createHash } from 'node:crypto'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { clearAdminSession, createAdminSession, isValidAdminPin } from './auth'

export type AdminLoginState = { error: string }

type FailedAttemptState = { count: number; lockedUntil: number; lastAttemptAt: number }

// Best-effort only: serverless instances do not share this process-local attempt map.
const failedAttempts = new Map<string, FailedAttemptState>()
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000

async function getClientKey() {
  const requestHeaders = await headers()
  const forwardedAddresses = requestHeaders.get('x-forwarded-for')?.split(',').map((address) => address.trim()).filter(Boolean) ?? []
  const clientAddress = requestHeaders.get('x-real-ip')?.trim() || forwardedAddresses[forwardedAddresses.length - 1] || 'unknown'
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
      error: lockedUntil > now
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
