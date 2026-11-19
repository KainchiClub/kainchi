'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, Search, Users } from 'lucide-react'
import {
  generateMemberCode,
  getBrowserSupabaseClient,
  getLocalMembersLedger,
  saveMemberToLocalLedger,
  type CustomerProfile,
} from '@/lib/kainchi-crm'

export function MembersLedgerPanel() {
  const [members, setMembers] = useState<CustomerProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusNote, setStatusNote] = useState('')

  async function loadMembers() {
    setLoading(true)
    setStatusNote('')
    const localList = getLocalMembersLedger()
    const supabase = getBrowserSupabaseClient()

    if (!supabase) {
      setMembers(localList)
      setStatusNote('Showing local browser member records. Connect Supabase in "Payments & Cloud" for permanent cloud sync.')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      const cloudList = (data ?? []) as CustomerProfile[]
      const mergedMap = new Map<string, CustomerProfile>()
      for (const item of [...localList, ...cloudList]) {
        const key = item.email.toLowerCase()
        mergedMap.set(key, {
          ...item,
          member_code: item.member_code || generateMemberCode(item.full_name, item.phone),
        })
      }
      setMembers(Array.from(mergedMap.values()))
    } catch {
      setMembers(localList)
      setStatusNote('Loaded local records (Supabase table permissions or columns need SQL setup).')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  async function updateMemberReward(member: CustomerProfile, field: 'referral_count' | 'discount_earned' | 'discount_used' | 'total_orders', rawValue: string) {
    const val = Math.max(0, Number(rawValue) || 0)
    const updated: CustomerProfile = { ...member, [field]: val }
    setMembers((prev) => prev.map((m) => (m.email === member.email ? updated : m)))
    saveMemberToLocalLedger(updated)

    const supabase = getBrowserSupabaseClient()
    if (supabase) {
      await supabase
        .from('customers')
        .update({ [field]: val })
        .eq('email', member.email)
        .catch(() => {})
    }
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
      <div className="admin-panel-heading">
        <div>
          <h2 id="members-ledger-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} /> Atelier Members, Partner Pass &amp; Referral Ledger
          </h2>
          <p>Step 1 (1st Order = Partner Pass Active) · Step 3 (Every 10 Referrals = +1% Lifetime Discount, 100 = +10%).</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="admin-count">{String(members.length).padStart(2, '0')} MEMBERS</span>
          <button type="button" className="button button-outline-dark" onClick={loadMembers} style={{ padding: '7px 12px', fontSize: '12px' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.55 }} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Name, Phone, Email or Member Code..."
            style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.2)' }}
          />
        </div>
      </div>

      {statusNote && (
        <p style={{ fontSize: '12px', color: '#8b1e24', marginBottom: '10px', fontWeight: 500 }}>{statusNote}</p>
      )}

      {loading ? (
        <p style={{ fontSize: '13px', opacity: 0.7 }}>Loading Atelier Pass directory...</p>
      ) : filtered.length === 0 ? (
        <p style={{ fontSize: '13px', opacity: 0.75 }}>No members registered yet. Once a customer activates an Atelier Pass, they will appear here as #1, #2, #3...</p>
      ) : (
        <div className="admin-table-wrap">
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
                        onChange={(e) => updateMemberReward(m, 'total_orders', e.target.value)}
                        style={{ width: '58px', padding: '5px 8px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={referrals}
                        onChange={(e) => updateMemberReward(m, 'referral_count', e.target.value)}
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
                          onChange={(e) => updateMemberReward(m, 'discount_earned', e.target.value)}
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
      )}
    </section>
  )
}
