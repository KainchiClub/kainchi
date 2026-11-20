'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, RefreshCw, Search, ShieldCheck, Users } from 'lucide-react'
import {
  generateMemberCode,
  getLocalMembersLedger,
  saveMemberToLocalLedger,
  type CustomerProfile,
} from '@/lib/kainchi-crm'
import { fetchSecureMembersList, updateSecureMemberField } from './actions'

export function MembersLedgerPanel() {
  const [members, setMembers] = useState<CustomerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [syncBadge, setSyncBadge] = useState<{ ok: boolean; text: string } | null>(null)
  const [savingEmail, setSavingEmail] = useState<string | null>(null)

  async function loadMembers() {
    setLoading(true)
    const localList = getLocalMembersLedger()

    try {
      const res = await fetchSecureMembersList()
      if (res.ok) {
        const mergedMap = new Map<string, CustomerProfile>()
        for (const item of [...localList, ...res.members]) {
          const key = item.email.toLowerCase()
          mergedMap.set(key, {
            ...item,
            member_code: item.member_code || generateMemberCode(item.full_name, item.phone),
          })
        }
        const finalList = Array.from(mergedMap.values())
        setMembers(finalList)
        setSyncBadge({
          ok: true,
          text: res.hasServiceRole
            ? 'Cloud Synced (Encrypted Server RLS Active)'
            : 'Cloud Connected (Add SUPABASE_SERVICE_ROLE_KEY in Vercel for full RLS protection)',
        })
      } else {
        setMembers(localList)
        setSyncBadge({
          ok: false,
          text: res.error || 'Verify Supabase SQL setup and SUPABASE_SERVICE_ROLE_KEY in Vercel.',
        })
      }
    } catch {
      setMembers(localList)
      setSyncBadge({ ok: false, text: 'Network fallback: showing cached records.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  async function handleFieldChange(
    member: CustomerProfile,
    field: 'referral_count' | 'discount_earned' | 'discount_used' | 'total_orders',
    rawValue: string,
  ) {
    const val = Math.max(0, Number(rawValue) || 0)
    const updated: CustomerProfile = { ...member, [field]: val }
    setMembers((prev) => prev.map((m) => (m.email === member.email ? updated : m)))
    saveMemberToLocalLedger(updated)
    setSavingEmail(member.email)

    const res = await updateSecureMemberField(member.email, field, val, updated)
    if (!res.ok && res.error) {
      setSyncBadge({ ok: false, text: `Save warning: ${res.error}` })
    }
    setSavingEmail(null)
  }

  const filtered = members.filter((m) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    const code = (m.member_code || generateMemberCode(m.full_name, m.phone)).toLowerCase()
    return (
      m.full_name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.phone || '').includes(q) ||
      code.includes(q)
    )
  })

  return (
    <section className="admin-panel" aria-labelledby="members-ledger-title">
      <div className="admin-panel-heading" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 id="members-ledger-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} /> Atelier Members, Partner Pass &amp; Referral Ledger
          </h2>
          <p>Step 1 (1st Order = Partner Pass Active) · Step 3 (Every 10 Referrals = +1% Lifetime Discount, 100 = +10%).</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span className="admin-count">{String(members.length).padStart(2, '0')} MEMBERS</span>
          <button
            type="button"
            className="button button-outline-dark"
            onClick={loadMembers}
            style={{ padding: '8px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {syncBadge && (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '999px',
            fontSize: '11.5px',
            fontWeight: 600,
            marginBottom: '12px',
            background: syncBadge.ok ? '#dcfce7' : '#fef3c7',
            color: syncBadge.ok ? '#15803d' : '#92400e',
          }}
        >
          {syncBadge.ok ? <ShieldCheck size={14} /> : <CheckCircle2 size={14} />}
          <span>{syncBadge.text}</span>
        </div>
      )}

      <div style={{ marginBottom: '14px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.55 }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, Phone, Email or Member Code..."
            style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.2)', fontSize: '13px' }}
          />
        </div>
      </div>

      {loading ? (
        <p style={{ fontSize: '13px', opacity: 0.7 }}>Loading encrypted member directory...</p>
      ) : filtered.length === 0 ? (
        <p style={{ fontSize: '13px', opacity: 0.75 }}>No members registered yet.</p>
      ) : (
        <>
          {/* MOBILE-FRIENDLY CARDS (Visible on small screens) */}
          <div className="md:hidden" style={{ display: 'grid', gap: '12px' }}>
            {filtered.map((m, idx) => {
              const code = m.member_code || generateMemberCode(m.full_name, m.phone, idx + 1)
              const referrals = Number(m.referral_count ?? 0)
              const orders = Number(m.total_orders ?? 0)
              const lifetimePct = Math.floor(referrals / 10)
              const earned = Number(m.discount_earned ?? 0)
              const used = Number(m.discount_used ?? 0)
              const balance = Math.max(0, earned - used)

              return (
                <div
                  key={m.email}
                  style={{
                    padding: '14px',
                    borderRadius: '14px',
                    border: '1px solid rgba(0,0,0,0.14)',
                    background: '#fffdf9',
                    display: 'grid',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.6 }}>#{idx + 1}</span>
                      <strong style={{ display: 'block', fontSize: '15px' }}>{m.full_name}</strong>
                      <span style={{ fontSize: '12px', opacity: 0.8, display: 'block' }}>{m.phone ? `+91 ${m.phone}` : '—'}</span>
                      <span style={{ fontSize: '11.5px', opacity: 0.7, display: 'block', wordBreak: 'break-all' }}>{m.email}</span>
                    </div>
                    <code style={{ padding: '4px 8px', borderRadius: '6px', background: '#181210', color: '#f5e29f', fontWeight: 700, fontSize: '11px' }}>
                      {code}
                    </code>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                    {orders >= 1 ? (
                      <span style={{ padding: '3px 8px', borderRadius: '999px', background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                        ✓ Partner Active
                      </span>
                    ) : (
                      <span style={{ padding: '3px 8px', borderRadius: '999px', background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>
                        Awaiting 1st Order
                      </span>
                    )}
                    <strong style={{ color: lifetimePct > 0 ? '#8b1e24' : '#5c5046' }}>
                      +{lifetimePct}% Lifetime · Bal ₹{balance}
                    </strong>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', paddingTop: '6px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600 }}>
                      Orders
                      <input
                        type="number"
                        min="0"
                        value={orders}
                        onChange={(e) => handleFieldChange(m, 'total_orders', e.target.value)}
                        style={{ width: '100%', marginTop: '3px', padding: '7px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)' }}
                      />
                    </label>
                    <label style={{ fontSize: '11px', fontWeight: 600 }}>
                      Referrals
                      <input
                        type="number"
                        min="0"
                        value={referrals}
                        onChange={(e) => handleFieldChange(m, 'referral_count', e.target.value)}
                        style={{ width: '100%', marginTop: '3px', padding: '7px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)' }}
                      />
                    </label>
                    <label style={{ fontSize: '11px', fontWeight: 600 }}>
                      Credit (₹)
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={earned}
                        onChange={(e) => handleFieldChange(m, 'discount_earned', e.target.value)}
                        style={{ width: '100%', marginTop: '3px', padding: '7px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)' }}
                      />
                    </label>
                  </div>
                  {savingEmail === m.email && <span style={{ fontSize: '11px', color: '#15803d' }}>Saving to cloud...</span>}
                </div>
              )
            })}
          </div>

          {/* DESKTOP TABLE (Visible on larger screens) */}
          <div className="admin-table-wrap hidden md:block">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Member Name</th>
                  <th scope="col">Mobile &amp; Email</th>
                  <th scope="col">Member Code</th>
                  <th scope="col">Partner Pass (Step 1)</th>
                  <th scope="col">Orders</th>
                  <th scope="col">Referrals</th>
                  <th scope="col">Lifetime Tier (Step 3)</th>
                  <th scope="col">Credit Bal. (₹)</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m, idx) => {
                  const code = m.member_code || generateMemberCode(m.full_name, m.phone, idx + 1)
                  const referrals = Number(m.referral_count ?? 0)
                  const orders = Number(m.total_orders ?? 0)
                  const lifetimePct = Math.floor(referrals / 10)
                  const earned = Number(m.discount_earned ?? 0)
                  const used = Number(m.discount_used ?? 0)
                  const balance = Math.max(0, earned - used)
                  return (
                    <tr key={m.email}>
                      <td><strong>#{idx + 1}</strong></td>
                      <td>
                        <strong className="admin-product-title">{m.full_name}</strong>
                        {m.referred_by && <span className="admin-product-garment">Ref by: {m.referred_by}</span>}
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{m.phone ? `+91 ${m.phone}` : '—'}</div>
                        <div style={{ fontSize: '12px', opacity: 0.75 }}>{m.email}</div>
                      </td>
                      <td>
                        <code style={{ padding: '4px 8px', borderRadius: '6px', background: '#181210', color: '#f5e29f', fontWeight: 700, fontSize: '12px' }}>
                          {code}
                        </code>
                      </td>
                      <td>
                        {orders >= 1 ? (
                          <span style={{ padding: '3px 8px', borderRadius: '999px', background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 700 }}>
                            ✓ Partner Active
                          </span>
                        ) : (
                          <span style={{ padding: '3px 8px', borderRadius: '999px', background: '#fef3c7', color: '#92400e', fontSize: '11px', fontWeight: 600 }}>
                            Awaiting 1st Order
                          </span>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={orders}
                          onChange={(e) => handleFieldChange(m, 'total_orders', e.target.value)}
                          style={{ width: '58px', padding: '5px 8px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={referrals}
                          onChange={(e) => handleFieldChange(m, 'referral_count', e.target.value)}
                          style={{ width: '64px', padding: '5px 8px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)' }}
                        />
                      </td>
                      <td>
                        <strong style={{ color: lifetimePct > 0 ? '#8b1e24' : '#5c5046', fontSize: '13px' }}>
                          +{lifetimePct}% Lifetime
                        </strong>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={earned}
                            onChange={(e) => handleFieldChange(m, 'discount_earned', e.target.value)}
                            title="Discount Earned"
                            style={{ width: '72px', padding: '5px 6px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)' }}
                          />
                          <span style={{ fontSize: '11px', opacity: 0.7 }}>(Bal: ₹{balance})</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
