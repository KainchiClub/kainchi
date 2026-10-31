'use client'

import { useEffect, useState } from 'react'

export const PARTNER_PASS_STORAGE_KEY = 'studio_partner_passes'
export const PARTNER_PASS_UPDATED_EVENT = 'studio-partner-passes-updated'
export const PARTNER_PASS_MILESTONE = 10

export type PartnerPass = {
  partnerId: string
  name: string
  email: string
  phone: string
  referralsCount: number
  milestoneTarget: number
  stackedDiscount: number
  status: 'Qualified Partner'
  createdAt: string
}

type NewPartnerPass = Pick<PartnerPass, 'name' | 'email' | 'phone'>

function isPartnerPass(value: unknown): value is PartnerPass {
  if (!value || typeof value !== 'object') return false

  const pass = value as Record<string, unknown>
  return typeof pass.partnerId === 'string'
    && pass.partnerId.startsWith('KC-VIP-')
    && typeof pass.name === 'string'
    && typeof pass.email === 'string'
    && typeof pass.phone === 'string'
    && typeof pass.referralsCount === 'number'
    && Number.isSafeInteger(pass.referralsCount)
    && pass.referralsCount >= 0
    && pass.milestoneTarget === PARTNER_PASS_MILESTONE
    && typeof pass.stackedDiscount === 'number'
    && Number.isSafeInteger(pass.stackedDiscount)
    && pass.stackedDiscount === Math.floor(pass.referralsCount / PARTNER_PASS_MILESTONE)
    && pass.status === 'Qualified Partner'
    && typeof pass.createdAt === 'string'
    && Number.isFinite(Date.parse(pass.createdAt))
}

export function readPartnerPasses(): PartnerPass[] {
  if (typeof window === 'undefined') return []

  try {
    const serialized = window.localStorage.getItem(PARTNER_PASS_STORAGE_KEY)
    if (!serialized) return []

    const parsed: unknown = JSON.parse(serialized)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(isPartnerPass)
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
  } catch {
    return []
  }
}

function writePartnerPasses(passes: PartnerPass[]) {
  window.localStorage.setItem(PARTNER_PASS_STORAGE_KEY, JSON.stringify(passes))
  window.dispatchEvent(new Event(PARTNER_PASS_UPDATED_EVENT))
}

export function generatePartnerId(name: string, phone: string) {
  const firstName = name.trim().replace(/\s+/g, ' ').split(' ')[0] ?? ''
  const phoneDigits = phone.replace(/\D/g, '')
  if (firstName.length === 0 || phoneDigits.length < 4) {
    throw new Error('Enter a first name and a phone number with at least four digits.')
  }

  return `KC-VIP-${firstName.slice(0, 3).toUpperCase()}-${phoneDigits.slice(-4)}`
}

export function createPartnerPass(input: NewPartnerPass) {
  const name = input.name.trim().replace(/\s+/g, ' ').slice(0, 100)
  const email = input.email.trim().toLowerCase()
  const phone = input.phone.trim().slice(0, 32)
  const phoneDigits = phone.replace(/\D/g, '')

  if (!name || !email || phoneDigits.length < 4) {
    throw new Error('Enter the customer name, email, and a valid phone number.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error('Enter a valid customer email address.')
  }

  const partnerId = generatePartnerId(name, phone)
  const passes = readPartnerPasses()
  if (passes.some((pass) => pass.partnerId === partnerId || pass.phone.replace(/\D/g, '') === phoneDigits)) {
    throw new Error('A partner pass already exists for this code or phone number.')
  }

  const pass: PartnerPass = {
    partnerId,
    name,
    email,
    phone,
    referralsCount: 0,
    milestoneTarget: PARTNER_PASS_MILESTONE,
    stackedDiscount: 0,
    status: 'Qualified Partner',
    createdAt: new Date().toISOString(),
  }

  writePartnerPasses([pass, ...passes])
  return pass
}

export function incrementPartnerPassReferral(partnerId: string) {
  const passes = readPartnerPasses()
  const nextPasses = passes.map((pass) => {
    if (pass.partnerId !== partnerId) return pass
    const referralsCount = pass.referralsCount + 1
    return {
      ...pass,
      referralsCount,
      stackedDiscount: Math.floor(referralsCount / pass.milestoneTarget),
    }
  })

  if (!passes.some((pass) => pass.partnerId === partnerId)) return false
  writePartnerPasses(nextPasses)
  return true
}

export function usePartnerPasses() {
  const [passes, setPasses] = useState<PartnerPass[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadPasses = () => {
      setPasses(readPartnerPasses())
      setIsLoaded(true)
    }

    loadPasses()
    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key === PARTNER_PASS_STORAGE_KEY || event.key === null) loadPasses()
    }

    window.addEventListener('storage', syncAcrossTabs)
    window.addEventListener(PARTNER_PASS_UPDATED_EVENT, loadPasses)
    return () => {
      window.removeEventListener('storage', syncAcrossTabs)
      window.removeEventListener(PARTNER_PASS_UPDATED_EVENT, loadPasses)
    }
  }, [])

  return { passes, isLoaded }
}
