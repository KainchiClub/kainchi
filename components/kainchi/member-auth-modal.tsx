'use client'

import { useState, type FormEvent } from 'react'
import { Check, Copy, Gift, LogOut, Sparkles, UserCheck, X } from 'lucide-react'
import {
  generateMemberCode,
  getBrowserSupabaseClient,
  logErrorOrCartEvent,
  pickNextNonRepeatGift,
  setStoredCustomerSession,
  triggerStudioNotification,
  type CustomerProfile,
} from '@/lib/kainchi-crm'

export function MemberAuthModal({
  isOpen,
  onClose,
  member,
  onMemberChange,
}: {
  isOpen: boolean
  onClose: () => void
  member: CustomerProfile | null
  onMemberChange: (profile: CustomerProfile | null) => void
}) {
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCodeInput, setReferralCodeInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)

  if (!isOpen) return null

  const activeMemberCode = member
    ? member.member_code || generateMemberCode(member.full_name, member.phone)
    : ''

  function handleCopyCode() {
    if (!activeMemberCode) return
    navigator.clipboard?.writeText(activeMemberCode).catch(() => {})
    setCopiedCode(true)
    window.setTimeout(() => setCopiedCode(false), 2000)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setErrorMsg('')
    const cleanEmail = email.trim().toLowerCase()
    const cleanPhone = phone.replace(/\D/g, '').slice(-10)
    const cleanName = fullName.trim()
    const cleanRef = referralCodeInput.trim().toUpperCase()

    if (!cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.')
      return
    }
    if (mode === 'signup' && cleanName.length < 2) {
      setErrorMsg('Please enter your full name.')
      return
    }
    if (mode === 'signup' && cleanPhone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.')
      return
    }

    setLoading(true)
    const generatedCode = generateMemberCode(cleanName || cleanEmail.split('@')[0], cleanPhone)
    const supabase = getBrowserSupabaseClient()

    try {
      if (supabase) {
        const { data: existing, error: fetchError } = await supabase
          .from('customers')
          .select('*')
          .eq('email', cleanEmail)
          .maybeSingle()

        if (!fetchError && existing) {
          const profile: CustomerProfile = {
            ...(existing as CustomerProfile),
            member_code: (existing as CustomerProfile).member_code || generateMemberCode((existing as CustomerProfile).full_name, (existing as CustomerProfile).phone),
          }
          setStoredCustomerSession(profile)
          onMemberChange(profile)
          setLoading(false)
          onClose()
          return
        }

        if (!fetchError && mode === 'login') {
          setErrorMsg('No account found with this email. Switch to "Join Club (New)" to activate your Atelier Pass.')
          logErrorOrCartEvent({
            eventType: 'login_error',
            customerEmail: cleanEmail,
            details: { reason: 'Email not found during sign-in' },
          }).catch(() => {})
          setLoading(false)
          return
        }

        if (!fetchError) {
          const { data: created, error: insertError } = await supabase
            .from('customers')
            .insert({
              full_name: cleanName,
              email: cleanEmail,
              phone: cleanPhone,
              member_code: generatedCode,
              referred_by: cleanRef || null,
              referral_count: 0,
              discount_earned: cleanRef ? 200 : 0,
              discount_used: 0,
              total_orders: 0,
              total_spent: 0,
              last_gift_sent: 'None',
            })
            .select('*')
            .single()

          if (!insertError && created) {
            const newProfile: CustomerProfile = {
              ...(created as CustomerProfile),
              member_code: (created as CustomerProfile).member_code || generatedCode,
            }
            setStoredCustomerSession(newProfile)
            onMemberChange(newProfile)
            triggerStudioNotification({
              eventType: 'signup',
              customerName: `${newProfile.full_name} (${newProfile.member_code})`,
              customerEmail: newProfile.email,
              customerPhone: newProfile.phone ?? '',
            }).catch(() => {})
            setLoading(false)
            onClose()
            return
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Supabase sync fallback'
      logErrorOrCartEvent({
        eventType: mode === 'signup' ? 'signup_error' : 'login_error',
        customerEmail: cleanEmail,
        customerName: cleanName,
        customerPhone: cleanPhone,
        details: { message: msg },
      }).catch(() => {})
    }

    const localProfile: CustomerProfile = {
      id: `kc-${Date.now()}`,
      member_code: generatedCode,
      full_name: cleanName || cleanEmail.split('@')[0],
      email: cleanEmail,
      phone: cleanPhone,
      referred_by: cleanRef || null,
      referral_count: 0,
      discount_earned: cleanRef ? 200 : 0,
      discount_used: 0,
      total_orders: 0,
      total_spent: 0,
      last_gift_sent: 'None',
      created_at: new Date().toISOString(),
    }
    setStoredCustomerSession(localProfile)
    onMemberChange(localProfile)
    if (mode === 'signup') {
      triggerStudioNotification({
        eventType: 'signup',
        customerName: `${localProfile.full_name} (${localProfile.member_code})`,
        customerEmail: localProfile.email,
        customerPhone: localProfile.phone ?? '',
      }).catch(() => {})
    }
    setLoading(false)
    onClose()
  }

  function handleSignOut() {
    setStoredCustomerSession(null)
    onMemberChange(null)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 120,
        background: 'rgba(14, 10, 9, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          background: '#faf7f2',
          color: '#181210',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(212, 175, 55, 0.45)',
          boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8b1e24', fontWeight: 700 }}>
            KAINCHI CLUB · ATELIER PASS
          </span>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {member ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserCheck size={22} color="#8b1e24" />
              <div>
                <h2 id="member-modal-title" style={{ margin: 0, fontSize: '20px' }}>{member.full_name}</h2>
                <p style={{ margin: 0, fontSize: '12px', color: '#5c5046' }}>{member.email} {member.phone ? `· +91 ${member.phone}` : ''}</p>
              </div>
            </div>

            {/* UNIQUE MEMBERSHIP & REFERRAL CODE CARD */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #241916 0%, #140e0c 100%)',
                border: '1px solid rgba(212, 175, 55, 0.55)',
                color: '#f5efe6',
              }}
            >
              <div>
                <span style={{ fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#d4af37', display: 'block' }}>
                  OFFICIAL MEMBER &amp; REFERRAL CODE
                </span>
                <strong style={{ fontSize: '17px', letterSpacing: '0.08em', color: '#fff', fontFamily: 'monospace' }}>
                  {activeMemberCode}
                </strong>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '7px 12px',
                  borderRadius: '999px',
                  border: '1px solid rgba(212, 175, 55, 0.55)',
                  background: 'rgba(212, 175, 55, 0.16)',
                  color: '#f5e29f',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {copiedCode ? <Check size={13} /> : <Copy size={13} />}
                {copiedCode ? 'Copied' : 'Copy Code'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: '#181210', color: '#f5efe6', padding: '12px', borderRadius: '14px' }}>
              <div>
                <span style={{ fontSize: '10px', color: '#a89b8c', display: 'block' }}>ORDERS</span>
                <strong style={{ fontSize: '17px', color: '#f5e29f' }}>#{String(member.total_orders).padStart(2, '0')}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#a89b8c', display: 'block' }}>REFERRALS</span>
                <strong style={{ fontSize: '17px', color: '#f5e29f' }}>{member.referral_count ?? 0}</strong>
              </div>
              <div>
                <span style={{ fontSize: '10px', color: '#a89b8c', display: 'block' }}>DISCOUNT BAL.</span>
                <strong style={{ fontSize: '17px', color: '#f5e29f' }}>₹{Math.max(0, (member.discount_earned ?? 0) - (member.discount_used ?? 0))}</strong>
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(212,175,55,0.12)', border: '1px solid rgba(212,175,55,0.4)', fontSize: '12px' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8b1e24', marginBottom: '4px' }}>
                <Gift size={14} /> Unlocked Gift on Your Next Order (#0{(member.total_orders || 0) + 1}):
              </strong>
              <span>{pickNextNonRepeatGift((member.total_orders || 0) + 1, member.last_gift_sent)}</span>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '10px',
                borderRadius: '999px',
                border: '1px solid rgba(0,0,0,0.2)',
                background: '#fff',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <LogOut size={14} /> Sign Out of Member Pass
            </button>
          </div>
        ) : (
          <>
            <h2 id="member-modal-title" style={{ margin: '0 0 6px', fontSize: '22px' }}>
              {mode === 'signup' ? 'Join the Atelier Club' : 'Member Sign In'}
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#5c5046' }}>
              Get your unique Member Code, track orders, and unlock a non-repeating collector gift with every order.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setMode('signup')}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '999px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: mode === 'signup' ? '#181210' : '#ebe4d8',
                  color: mode === 'signup' ? '#f5e29f' : '#181210',
                }}
              >
                Join Club (New)
              </button>
              <button
                type="button"
                onClick={() => setMode('login')}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '999px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: mode === 'login' ? '#181210' : '#ebe4d8',
                  color: mode === 'login' ? '#f5e29f' : '#181210',
                }}
              >
                Existing Member
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
              {mode === 'signup' && (
                <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                  <span>Full Name *</span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Samrat Shubham"
                    style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.2)', background: '#fff' }}
                  />
                </label>
              )}

              <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                <span>Email Address *</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.2)', background: '#fff' }}
                />
              </label>

              {mode === 'signup' && (
                <>
                  <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                    <span>Mobile Number (WhatsApp) *</span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile number"
                      style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.2)', background: '#fff' }}
                    />
                  </label>
                  <label style={{ display: 'grid', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
                    <span>Friend&apos;s Referral Code (Optional)</span>
                    <input
                      type="text"
                      value={referralCodeInput}
                      onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. KC-SAMR-5356"
                      style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.2)', background: '#fff' }}
                    />
                  </label>
                </>
              )}

              {errorMsg && <p style={{ color: '#b91c1c', fontSize: '12px', margin: 0 }}>{errorMsg}</p>}

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: '4px',
                  padding: '12px',
                  borderRadius: '999px',
                  border: 'none',
                  background: '#8b1e24',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Sparkles size={15} /> {loading ? 'Verifying Pass...' : mode === 'signup' ? 'Activate Atelier Pass' : 'Sign In'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
