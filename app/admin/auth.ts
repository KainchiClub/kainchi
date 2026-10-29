import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const ADMIN_PIN = '0508'
const ADMIN_COOKIE = 'kainchi_admin_session'
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000

function signExpiry(expiresAt: string) {
  return createHmac('sha256', ADMIN_PIN).update(expiresAt).digest('base64url')
}

export function isValidAdminPin(value: string) {
  const submitted = Buffer.from(value)
  const expected = Buffer.from(ADMIN_PIN)
  return submitted.length === expected.length && timingSafeEqual(submitted, expected)
}

export async function createAdminSession() {
  const expiresAt = String(Date.now() + SESSION_DURATION_MS)
  const token = `${expiresAt}.${signExpiry(expiresAt)}`
  const cookieStore = await cookies()

  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_DURATION_MS / 1000,
  })
}

export async function isAdminSessionActive() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value
  if (!token) return false

  const [expiresAt, signature, extra] = token.split('.')
  if (!expiresAt || !signature || extra || !/^\d+$/.test(expiresAt) || Number(expiresAt) <= Date.now()) return false

  const expected = Buffer.from(signExpiry(expiresAt))
  const received = Buffer.from(signature)
  return received.length === expected.length && timingSafeEqual(received, expected)
}

export async function clearAdminSession() {
  (await cookies()).delete(ADMIN_COOKIE)
}
