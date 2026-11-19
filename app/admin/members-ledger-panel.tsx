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
      // Merge cloud + any unsynced local records
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

  async function updateMemberReward(member: CustomerProfile, field: 'referral_count' | 'discount_earned' | 'discount_used', rawValue: string) {
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
            <Users size={18} /> Atelier Members, Codes &amp; Referral Ledger
          </h2>
          <p>Permanent sequential directory (#1, #2, #3... ∞) with Member Codes, Referral Counts, and Discount Balances.</p>
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
                <th scope="col">Orders / Spend</th>
                <th scope="col">Referrals</th>
                <th scope="col">Discount Earned (₹)</th>
                <th scope="col">Discount Used (₹)</th>
                <th scope="col">Available Bal.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m, idx) => {
                const code = m.member_code || generateMemberCode(m.full_name, m.phone, idx + 1)
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
                      <strong>{m.total_orders ?? 0}</strong> orders<br />
                      <span style={{ fontSize: '12px', opacity: 0.75 }}>₹{Number(m.total_spent ?? 0).toLocaleString('en-IN')}</span>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={m.referral_count ?? 0}
                        onChange={(e) => updateMemberReward(m, 'referral_count', e.target.value)}
                        style={{ width: '64px', padding: '5px 8px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={earned}
                        onChange={(e) => updateMemberReward(m, 'discount_earned', e.target.value)}
                        style={{ width: '80px', padding: '5px 8px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)' }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={used}
                        onChange={(e) => updateMemberReward(m, 'discount_used', e.target.value)}
                        style={{ width: '80px', padding: '5px 8px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.2)' }}
                      />
                    </td>
                    <td>
                      <strong style={{ color: balance > 0 ? '#15803d' : '#181210' }}>₹{balance}</strong>
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
