'use client'

import { useEffect } from 'react'
import useSWR from 'swr'
import { Download, ExternalLink, RefreshCw } from 'lucide-react'
import {
  CUSTOM_INQUIRIES_STORAGE_KEY,
  CUSTOM_INQUIRIES_UPDATED_EVENT,
  readLocalInquiries,
  type CustomInquiry,
} from '@/components/kainchi/custom-inquiries'

type CloudResponse = { inquiries: CustomInquiry[]; configured: boolean; error?: string }

async function fetchCloudInquiries(url: string): Promise<CloudResponse> {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) throw new Error('Unable to load inquiries.')
  return response.json()
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function downloadHref(url: string) {
  if (url.startsWith('data:')) return url
  try {
    const parsed = new URL(url)
    parsed.searchParams.set('download', '1')
    return parsed.toString()
  } catch {
    return url
  }
}

const SPEC_FIELDS: { key: keyof CustomInquiry; label: string }[] = [
  { key: 'productCode', label: 'Product Code' },
  { key: 'garment', label: 'Garment' },
  { key: 'color', label: 'Color' },
  { key: 'size', label: 'Size' },
  { key: 'budget', label: 'Budget' },
  { key: 'partnerCode', label: 'Partner Code' },
]

export function CustomInquiriesPanel() {
  const cloud = useSWR('/api/inquiries', fetchCloudInquiries, { revalidateOnFocus: true })
  const local = useSWR(CUSTOM_INQUIRIES_STORAGE_KEY, readLocalInquiries)
  const refreshLocal = local.mutate

  useEffect(() => {
    const refresh = () => { void refreshLocal() }
    const handleStorage = (event: StorageEvent) => { if (event.key === CUSTOM_INQUIRIES_STORAGE_KEY) refresh() }
    window.addEventListener(CUSTOM_INQUIRIES_UPDATED_EVENT, refresh)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(CUSTOM_INQUIRIES_UPDATED_EVENT, refresh)
      window.removeEventListener('storage', handleStorage)
    }
  }, [refreshLocal])

  const cloudInquiries = cloud.data?.inquiries ?? []
  const cloudIds = new Set(cloudInquiries.map((inquiry) => inquiry.id))
  const inquiries = [...cloudInquiries, ...(local.data ?? []).filter((inquiry) => !cloudIds.has(inquiry.id))]
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))

  return (
    <section className="admin-panel" aria-labelledby="custom-inquiries-title">
      <div className="admin-panel-heading">
        <div>
          <h2 id="custom-inquiries-title">Custom Inquiries</h2>
          <p>Every Custom Studio submission with specs and reference photos.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="button button-outline-dark" onClick={() => { void cloud.mutate(); void refreshLocal() }} aria-label="Refresh inquiries">
            <RefreshCw aria-hidden="true" /> Refresh
          </button>
          <span className="admin-count">{String(inquiries.length).padStart(2, '0')} INQUIRIES</span>
        </div>
      </div>

      {cloud.data && !cloud.data.configured && (
        <p className="admin-storage-note" role="status">Cloud storage is not connected yet, so inquiries are only saved in the browser where they were submitted. Connect Vercel Blob to collect them from every customer.</p>
      )}
      {(cloud.error || cloud.data?.error) && <p className="admin-login-error" role="alert">Cloud inquiries could not be loaded. Showing inquiries saved in this browser.</p>}
      {cloud.isLoading && <p className="admin-storage-note" role="status">Loading inquiries…</p>}

      {!cloud.isLoading && inquiries.length === 0 && <p className="admin-storage-note">No custom inquiries yet.</p>}

      {inquiries.length > 0 && (
        <ul className="grid gap-4 p-0 [list-style:none] md:grid-cols-2">
          {inquiries.map((inquiry) => (
            <li key={inquiry.id} className="flex flex-col gap-4 border border-[var(--line)] bg-[var(--paper-light)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <time dateTime={inquiry.createdAt} className="text-xs font-bold text-[var(--ink)]">{formatDateTime(inquiry.createdAt)}</time>
                <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--ink-soft)]">{inquiry.storage === 'cloud' ? 'Cloud' : 'This browser'}</span>
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
                {SPEC_FIELDS.map(({ key, label }) => (
                  <div key={key} className="contents">
                    <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ink-soft)]">{label}</dt>
                    <dd className="m-0 text-[var(--ink)]">{String(inquiry[key] || '—')}</dd>
                  </div>
                ))}
                <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ink-soft)]">Notes</dt>
                <dd className="m-0 whitespace-pre-wrap text-[var(--ink)]">{inquiry.notes || '—'}</dd>
              </dl>
              <div className="flex flex-col gap-2">
                <p className="m-0 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ink-soft)]">Reference Images ({inquiry.referenceImageUrls.length})</p>
                {inquiry.referenceImageUrls.length === 0
                  ? <p className="m-0 text-xs text-[var(--ink-soft)]">No photo uploaded.</p>
                  : (
                    <ul className="flex flex-wrap gap-3 p-0 [list-style:none]">
                      {inquiry.referenceImageUrls.map((url, index) => (
                        <li key={url.slice(0, 120) + index} className="flex w-32 flex-col gap-2">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden border border-[var(--line)] bg-[var(--canvas)]">
                            <img src={url} alt={`Reference photo ${index + 1} for inquiry on ${formatDateTime(inquiry.createdAt)}`} loading="lazy" className="size-full object-cover" />
                          </a>
                          <a href={downloadHref(url)} download={`kainchi-reference-${inquiry.id.slice(0, 8)}-${index + 1}.jpg`} className="button button-crimson justify-center text-[10px]">
                            <Download aria-hidden="true" /> Download Photo
                          </a>
                          {!url.startsWith('data:') && (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[var(--crimson)] underline">
                              Open link <ExternalLink aria-hidden="true" className="size-3" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
