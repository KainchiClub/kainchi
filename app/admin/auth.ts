import 'server-only'

import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const ADMIN_PIN_SALT = Buffer.from('a3d661ec9111f62c6e52720430b73eda', 'hex')
const ADMIN_PIN_HASH = Buffer.from('51ca5cf7defb10d217d83ab48b4772bbf9baeb8d6bd43e278ac746a80a7d4ab7', 'hex')
const ADMIN_SESSION_KEY = Buffer.from('6f231eb39c1f049c5d2bf3404721d5b7a3cd5fd11a935eeae93a875c85b4c8e0', 'hex')
const ADMIN_COOKIE = 'kainchi_admin_session'
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000

function signExpiry(expiresAt: string) {
  return createHmac('sha256', ADMIN_SESSION_KEY).update(expiresAt).digest('base64url')
}

export function isValidAdminPin(value: string) {
  const hasValidFormat = value.length === 4 && /^\d{4}$/.test(value)
  const candidate = hasValidFormat ? value : Buffer.alloc(4)
  const submitted = scryptSync(candidate, ADMIN_PIN_SALT, ADMIN_PIN_HASH.length, {
    N: 32_768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  })
  const matches = timingSafeEqual(submitted, ADMIN_PIN_HASH)
  return hasValidFormat && matches
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
