'use client'

import { useEffect, useState } from 'react'

export const STUDIO_WALLET_STORAGE_KEY = 'studio_wallet_ledger'
export const STUDIO_WALLET_UPDATED_EVENT = 'studio-wallet-updated'
export const STUDIO_WALLET_DEFAULT_RATE = 50
export const STUDIO_WALLET_COINS_PER_UNIT = 1000

type WalletLedger = {
  phone: string
  memberName: string
  passCode: string
  referrals: number
  ordersCompleted: number
  coins: number
  redemptions: number
  updatedAt: string
}

export type StudioWallet = WalletLedger
export type WalletSettings = { rupeesPerUnit: number }

const SETTINGS_KEY = `${STUDIO_WALLET_STORAGE_KEY}_settings`

function digits(value: string) { return value.replace(/\D/g, '') }
function isLedger(value: unknown): value is WalletLedger {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  return typeof item.phone === 'string' && typeof item.memberName === 'string' && typeof item.passCode === 'string'
    && [item.referrals, item.ordersCompleted, item.coins, item.redemptions].every((v) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0)
    && typeof item.updatedAt === 'string'
}

export function readWalletSettings(): WalletSettings {
  if (typeof window === 'undefined') return { rupeesPerUnit: STUDIO_WALLET_DEFAULT_RATE }
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SETTINGS_KEY) ?? '{}')
    return Number.isSafeInteger(parsed.rupeesPerUnit) && parsed.rupeesPerUnit > 0 ? parsed : { rupeesPerUnit: STUDIO_WALLET_DEFAULT_RATE }
  } catch { return { rupeesPerUnit: STUDIO_WALLET_DEFAULT_RATE } }
}

export function readWalletLedger(): StudioWallet[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STUDIO_WALLET_STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isLedger) : []
  } catch { return [] }
}

function persist(ledger: StudioWallet[], settings?: WalletSettings) {
  window.localStorage.setItem(STUDIO_WALLET_STORAGE_KEY, JSON.stringify(ledger))
  if (settings) window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  window.dispatchEvent(new Event(STUDIO_WALLET_UPDATED_EVENT))
}

export function upsertWallet(input: { phone: string; memberName: string; passCode?: string }) {
  const phone = digits(input.phone)
  if (phone.length < 8) throw new Error('Enter a valid WhatsApp number.')
  const ledger = readWalletLedger()
  const existing = ledger.find((item) => digits(item.phone) === phone)
  if (existing) return existing
  const wallet: StudioWallet = { phone, memberName: input.memberName.trim() || 'Studio Collector', passCode: input.passCode ?? `KC-WALLET-${phone.slice(-4)}`, referrals: 0, ordersCompleted: 0, coins: 0, redemptions: 0, updatedAt: new Date().toISOString() }
  persist([wallet, ...ledger])
  return wallet
}

export function adjustWallet(phone: string, field: 'coins' | 'redemptions' | 'referrals' | 'ordersCompleted', amount: number) {
  const ledger = readWalletLedger()
  const normalized = digits(phone)
  let updated = false
  const next = ledger.map((wallet) => {
    if (digits(wallet.phone) !== normalized) return wallet
    updated = true
    return { ...wallet, [field]: Math.max(0, wallet[field] + amount), updatedAt: new Date().toISOString() }
  })
  if (updated) persist(next)
  return updated
}

export function saveWalletSettings(settings: WalletSettings) {
  persist(readWalletLedger(), settings)
}

export function redeemWallet(phone: string, coins: number) {
  const ledger = readWalletLedger()
  const normalized = digits(phone)
  const wallet = ledger.find((item) => digits(item.phone) === normalized)
  if (!wallet || coins <= 0 || coins > wallet.coins) return false
  const next = ledger.map((item) => item === wallet ? { ...item, coins: item.coins - coins, redemptions: item.redemptions + coins, updatedAt: new Date().toISOString() } : item)
  persist(next)
  return true
}

export function useStudioWallets() {
  const [wallets, setWallets] = useState<StudioWallet[]>([])
  const [settings, setSettings] = useState<WalletSettings>(readWalletSettings)
  useEffect(() => {
    const sync = () => { setWallets(readWalletLedger()); setSettings(readWalletSettings()) }
    sync()
    window.addEventListener(STUDIO_WALLET_UPDATED_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener(STUDIO_WALLET_UPDATED_EVENT, sync); window.removeEventListener('storage', sync) }
  }, [])
  return { wallets, settings }
}
