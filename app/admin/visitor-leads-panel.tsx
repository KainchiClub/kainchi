'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import {
  readVisitorLeads,
  VISITOR_LEADS_STORAGE_KEY,
  VISITOR_LEADS_UPDATED_EVENT,
  type VisitorLead,
} from '@/components/kainchi/visitor-leads'

function formatCapturedAt(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function csvCell(value: string) {
  const formulaSafeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return `"${formulaSafeValue.replace(/"/g, '""')}"`
}

export function VisitorLeadsPanel() {
  const [leads, setLeads] = useState<VisitorLead[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadLeads = () => {
      setLeads(readVisitorLeads())
      setIsLoaded(true)
    }

    loadLeads()
    const handleStorage = (event: StorageEvent) => {
      if (event.key === VISITOR_LEADS_STORAGE_KEY || event.key === null) loadLeads()
    }

    window.addEventListener('storage', handleStorage)
    window.addEventListener(VISITOR_LEADS_UPDATED_EVENT, loadLeads)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener(VISITOR_LEADS_UPDATED_EVENT, loadLeads)
    }
  }, [])

  function exportLeads() {
    if (!leads.length) return

    const rows = [
      ['Submitted At', 'Name', 'City / Place', 'Contact', 'Source'],
      ...leads.map((lead) => [formatCapturedAt(lead.createdAt), lead.name, lead.city, lead.contact, lead.sourcePath]),
    ]
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const downloadLink = document.createElement('a')
    downloadLink.href = url
    downloadLink.download = `kainchi-studio-leads-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.append(downloadLink)
    downloadLink.click()
    downloadLink.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <section className="admin-panel admin-leads-panel" aria-labelledby="visitor-leads-title">
      <div className="admin-panel-heading">
        <div>
          <h2 id="visitor-leads-title">Captured Studio Leads</h2>
          <p>Saved in this browser only; leads from other visitors’ devices are not synced.</p>
        </div>
        <div className="admin-leads-actions">
          <span className="admin-count">{String(leads.length).padStart(2, '0')} LEADS</span>
          <button className="button button-outline-dark admin-lead-export" type="button" onClick={exportLeads} disabled={!isLoaded || leads.length === 0}>
            <Download aria-hidden="true" /> Export CSV
          </button>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <caption className="sr-only">Visitor contact details saved in this browser&apos;s local storage</caption>
          <thead><tr><th scope="col">Submitted</th><th scope="col">Name</th><th scope="col">City / Place</th><th scope="col">Contact</th><th scope="col">Source</th></tr></thead>
          <tbody>
            {!isLoaded ? (
              <tr><td className="admin-leads-empty" colSpan={5}>Loading studio leads…</td></tr>
            ) : leads.length === 0 ? (
              <tr><td className="admin-leads-empty" colSpan={5}>No leads saved in this browser yet.</td></tr>
            ) : leads.map((lead) => (
              <tr key={lead.id}>
                <td>{formatCapturedAt(lead.createdAt)}</td>
                <td>{lead.name || '—'}</td>
                <td>{lead.city || '—'}</td>
                <td>{lead.contact}</td>
                <td>{lead.sourcePath}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
