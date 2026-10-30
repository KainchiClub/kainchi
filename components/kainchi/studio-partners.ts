'use client'

import { useEffect, useState } from 'react'

export const STUDIO_PARTNERS_STORAGE_KEY = 'studio_partners'
export const STUDIO_PARTNERS_UPDATED_EVENT = 'studio-partners-updated'
export const INITIAL_ACTIVE_PARTNERS = 48
export const INITIAL_DREAMERS_WELCOMED = 340

export type StudioPartner = {
  id: string
  identifier: string
  date: string
  referralsCount: number
  status: 'Active'
  approved?: boolean
}

type StudioPartnerUpdates = Partial<Pick<StudioPartner, 'identifier' | 'referralsCount' | 'approved'>>

function isStudioPartner(value: unknown): value is StudioPartner {
  if (!value || typeof value !== 'object') return false

  const partner = value as Record<string, unknown>
  return typeof partner.id === 'string'
    && partner.id.startsWith('PARTNER-')
    && typeof partner.identifier === 'string'
    && partner.identifier.length > 0
    && partner.identifier.length <= 80
    && typeof partner.date === 'string'
    && Number.isFinite(Date.parse(partner.date))
    && typeof partner.referralsCount === 'number'
    && Number.isSafeInteger(partner.referralsCount)
    && partner.referralsCount >= 0
    && partner.status === 'Active'
    && (partner.approved === undefined || typeof partner.approved === 'boolean')
}

export function readStudioPartners(): StudioPartner[] {
  if (typeof window === 'undefined') return []

  try {
    const serialized = window.localStorage.getItem(STUDIO_PARTNERS_STORAGE_KEY)
    if (!serialized) return []

    const parsed: unknown = JSON.parse(serialized)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(isStudioPartner)
      .sort((left, right) => Date.parse(right.date) - Date.parse(left.date))
  } catch {
    return []
  }
}

export function writeStudioPartners(partners: StudioPartner[]) {
  window.localStorage.setItem(STUDIO_PARTNERS_STORAGE_KEY, JSON.stringify(partners))
  window.dispatchEvent(new Event(STUDIO_PARTNERS_UPDATED_EVENT))
}

export function addStudioPartner(identifierValue: string): StudioPartner {
  const identifier = identifierValue.trim().slice(0, 80)
  if (!identifier) throw new Error('Enter a WhatsApp number or existing order ID.')

  const partners = readStudioPartners()
  let timestamp = Date.now()
  while (partners.some((partner) => partner.id === `PARTNER-${timestamp}`)) timestamp += 1

  const partner: StudioPartner = {
    id: `PARTNER-${timestamp}`,
    identifier,
    date: new Date().toISOString(),
    referralsCount: 0,
    status: 'Active',
    approved: false,
  }

  writeStudioPartners([partner, ...partners])
  return partner
}

export function updateStudioPartner(id: string, updates: StudioPartnerUpdates) {
  const partners = readStudioPartners()
  let found = false
  const nextPartners = partners.map((partner) => {
    if (partner.id !== id) return partner
    found = true
    return { ...partner, ...updates }
  })

  if (!found) return false
  writeStudioPartners(nextPartners)
  return true
}

export function useStudioPartners() {
  const [partners, setPartners] = useState<StudioPartner[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadPartners = () => {
      setPartners(readStudioPartners())
      setIsLoaded(true)
    }

    loadPartners()
    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key === STUDIO_PARTNERS_STORAGE_KEY || event.key === null) loadPartners()
    }

    window.addEventListener('storage', syncAcrossTabs)
    window.addEventListener(STUDIO_PARTNERS_UPDATED_EVENT, loadPartners)
    return () => {
      window.removeEventListener('storage', syncAcrossTabs)
      window.removeEventListener(STUDIO_PARTNERS_UPDATED_EVENT, loadPartners)
    }
  }, [])

  return { partners, isLoaded }
}
