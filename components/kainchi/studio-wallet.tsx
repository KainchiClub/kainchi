'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { Check, Copy, MessageCircle, WalletCards } from 'lucide-react'
import { readWalletLedger, readWalletSettings, type StudioWallet as LegacyStudioWallet } from './studio-wallet-store'
import {
  generateMemberCode,
  getBrowserSupabaseClient,
  getLocalMembersLedger,
  getStoredCustomerSession,
  type CustomerProfile,
} from '@/lib/kainchi-crm'
import { buildWhatsAppReferralUrl } from './member-auth-modal'

const WHATSAPP_NUMBER = '918863075356'

type UnifiedWalletView = {
  memberName: string
  phone: string
  passCode: string
  coins: number
  rupeeCredit: number
  referrals: number
  ordersCompleted: number
  redemptions: number
  isPartnerUnlocked: boolean
  lifetimePercent: number
}

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.length >= 10) {
    const ten = digits.slice(-10)
    return `+91 ${ten.slice(0, 5)} *****`
  }
  return phone ? `+${digits}` : 'Verified Member'
}

function walletHref(wallet: UnifiedWalletView) {
  const perkText = wallet.lifetimePercent > 0 ? ` + ${wallet.lifetimePercent}% Lifetime Partner Discount` : ''
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hey Studio, I want to use my Studio Pass (${wallet.passCode}) — ₹${wallet.rupeeCredit} Store Credit${perkText} on my next piece.`
  )}`
}

function profileToUnifiedWallet(profile: CustomerProfile): UnifiedWalletView {
  const passCode = profile.member_code || generateMemberCode(profile.full_name, profile.phone)
  const earned = Number(profile.discount_earned ?? 0)
  const used = Number(profile.discount_used ?? 0)
  const balance = Math.max(0, earned - used)
  const referrals = Number(profile.referral_count ?? 0)
  const ordersCompleted = Number(profile.total_orders ?? 0)
  return {
    memberName: profile.full_name,
    phone: profile.phone || '',
    passCode,
    coins: balance * 10,
    rupeeCredit: balance,
    referrals,
    ordersCompleted,
    redemptions: used,
    isPartnerUnlocked: ordersCompleted >= 1,
    lifetimePercent: Math.floor(referrals / 10),
  }
}

function legacyToUnifiedWallet(legacy: LegacyStudioWallet): UnifiedWalletView {
  const rupees = Math.floor((legacy.coins / 1000) * readWalletSettings().rupeesPerUnit)
  return {
    memberName: legacy.memberName,
    phone: legacy.phone,
    passCode: legacy.passCode,
    coins: legacy.coins,
    rupeeCredit: rupees,
    referrals: legacy.referrals,
    ordersCompleted: legacy.ordersCompleted,
    redemptions: legacy.redemptions,
    isPartnerUnlocked: legacy.ordersCompleted >= 1,
    lifetimePercent: Math.floor(legacy.referrals / 10),
  }
}

export function StudioWallet() {
  const [query, setQuery] = useState('')
  const [wallet, setWallet] = useState<UnifiedWalletView | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const active = getStoredCustomerSession()
    if (active) {
      const unified = profileToUnifiedWallet(active)
      setWallet(unified)
      setQuery(unified.passCode)
    }

    const syncMember = () => {
      const updated = getStoredCustomerSession()
      if (updated) {
        const unified = profileToUnifiedWallet(updated)
        setWallet(unified)
        setQuery(unified.passCode)
        setError('')
      }
    }
    window.addEventListener('kainchi-member-changed', syncMember)
    return () => window.removeEventListener('kainchi-member-changed', syncMember)
  }, [])

  async function openWallet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const rawTrimmed = query.trim()
    const upperCode = rawTrimmed.toUpperCase()
    const digitsOnly = rawTrimmed.replace(/\D/g, '')
    const last10Phone = digitsOnly.slice(-10)

    if (!rawTrimmed) return
    setLoading(true)
    setError('')

    const active = getStoredCustomerSession()
    const allLocalMembers = [...(active ? [active] : []), ...getLocalMembersLedger()]
    const localMemberMatch = allLocalMembers.find((m) => {
      const code = (m.member_code || generateMemberCode(m.full_name, m.phone)).toUpperCase()
      const mPhone = (m.phone || '').replace(/\D/g, '').slice(-10)
      return code === upperCode || (last10Phone.length === 10 && mPhone === last10Phone)
    })

    if (localMemberMatch) {
      setWallet(profileToUnifiedWallet(localMemberMatch))
      setLoading(false)
      return
    }

    const legacyMatch = readWalletLedger().find(
      (item) =>
        (digitsOnly && item.phone.endsWith(last10Phone)) ||
        item.passCode.toUpperCase() === upperCode
    )
    if (legacyMatch) {
      setWallet(legacyToUnifiedWallet(legacyMatch))
      setLoading(false)
      return
    }

    const supabase = getBrowserSupabaseClient()
    if (supabase) {
      try {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .or(
            last10Phone.length === 10
              ? `member_code.ilike.${upperCode},phone.ilike.%${last10Phone}`
              : `member_code.ilike.${upperCode}`
          )
          .limit(1)
          .maybeSingle()

        if (data) {
          setWallet(profileToUnifiedWallet(data as CustomerProfile))
          setLoading(false)
          return
        }
      } catch {}
    }

    setWallet(null)
    setError('No Atelier Pass / Studio Wallet found for that number or code. Activate your Atelier Pass from the top header first.')
    setLoading(false)
  }

  function copyReferral() {
    if (!wallet) return
    void navigator.clipboard?.writeText(wallet.passCode)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  function shareOnWhatsApp() {
    if (!wallet) return
    const url = buildWhatsAppReferralUrl(wallet.passCode, wallet.memberName)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="studio-wallet" aria-labelledby="studio-wallet-title">
      <div className="studio-wallet-heading"><WalletCards aria-hidden="true" /><h3 id="studio-wallet-title">Studio Wallet</h3></div>
      <form className="studio-wallet-form" onSubmit={openWallet}>
        <label htmlFor="studio-wallet-access">Enter your Registered WhatsApp Number / Studio Pass Code</label>
        <div className="studio-wallet-form-row">
          <input
            id="studio-wallet-access"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. 8863075356 or KC-SAMR-5356"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Checking...' : 'Open Studio Wallet'} <span aria-hidden="true">➔</span>
          </button>
        </div>
      </form>
      {error && <p className="studio-wallet-error" role="alert">{error}</p>}
      {wallet && (
        <div className="studio-wallet-card" role="status">
          <div className="studio-wallet-card-top">
            <div>
              <p>
                {wallet.isPartnerUnlocked
                  ? `Official Studio Partner Pass · ${wallet.passCode}`
                  : `Atelier Member Pass · ${wallet.passCode} (Complete 1st order to unlock Partner Pass)`}
              </p>
              <strong>{wallet.memberName}</strong>
              <span>{maskPhone(wallet.phone)}</span>
            </div>
            <span className="studio-wallet-seal">
              {wallet.isPartnerUnlocked ? <>PARTNER<br />ACTIVE</> : <>STEP 01<br />PENDING</>}
            </span>
          </div>
          <div className="studio-wallet-balance">
            <span>Lifetime Stacked Privilege &amp; Credit</span>
            <strong>
              +{wallet.lifetimePercent}% Lifetime Discount · ₹{wallet.rupeeCredit.toLocaleString('en-IN')} Credit
            </strong>
            <em>
              {wallet.referrals % 10 === 0 && wallet.referrals > 0
                ? `Unlocked +${wallet.lifetimePercent}% lifetime discount (${wallet.referrals} referrals)`
                : `${10 - (wallet.referrals % 10)} more referrals to unlock +${wallet.lifetimePercent + 1}% lifetime discount`}
            </em>
          </div>
          <div className="studio-wallet-stats">
            <span><b>{wallet.referrals}</b> Qualified referrals</span>
            <span><b>+{wallet.lifetimePercent}%</b> Lifetime tier</span>
            <span><b>{wallet.ordersCompleted}</b> Orders completed</span>
          </div>
          <div className="studio-wallet-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              onClick={shareOnWhatsApp}
              style={{
                background: '#25D366',
                color: '#0b1f12',
                borderColor: '#25D366',
                fontWeight: 700,
              }}
            >
              <MessageCircle aria-hidden="true" /> Refer on WhatsApp
            </button>
            <button type="button" onClick={copyReferral}>
              {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />} {copied ? 'Copied' : `Copy ${wallet.passCode}`}
            </button>
            <a href={walletHref(wallet)} target="_blank" rel="noopener noreferrer">
              Redeem on WhatsApp Order
            </a>
          </div>
        </div>
      )}
      <p className="studio-wallet-note">Step 1: Your 1st order activates your Official Studio Partner Pass. Every 10 referrals adds +1% lifetime stacked discount (10 = +1%, 20 = +2%, 100 = +10%).</p>
    </section>
  )
}
