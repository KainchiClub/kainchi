export const VISITOR_LEADS_STORAGE_KEY = 'kainchi_visitor_leads'
export const VISITOR_LEADS_UPDATED_EVENT = 'kainchi-visitor-leads-updated'

export type VisitorLead = {
  id: string
  name: string
  city: string
  contact: string
  sourcePath: string
  createdAt: string
}

type NewVisitorLead = Omit<VisitorLead, 'id' | 'createdAt'>

function isVisitorLead(value: unknown): value is VisitorLead {
  if (!value || typeof value !== 'object') return false

  const lead = value as Record<string, unknown>
  return typeof lead.id === 'string'
    && lead.id.length > 0
    && typeof lead.name === 'string'
    && lead.name.length <= 100
    && typeof lead.city === 'string'
    && lead.city.length <= 100
    && typeof lead.contact === 'string'
    && lead.contact.length <= 160
    && typeof lead.sourcePath === 'string'
    && lead.sourcePath.startsWith('/')
    && typeof lead.createdAt === 'string'
    && Number.isFinite(Date.parse(lead.createdAt))
}

export function readVisitorLeads(): VisitorLead[] {
  if (typeof window === 'undefined') return []

  try {
    const serialized = window.localStorage.getItem(VISITOR_LEADS_STORAGE_KEY)
    if (!serialized) return []

    const parsed: unknown = JSON.parse(serialized)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(isVisitorLead)
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
  } catch {
    return []
  }
}

export function addVisitorLead(input: NewVisitorLead): VisitorLead {
  const lead: VisitorLead = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  const nextLeads = [lead, ...readVisitorLeads()]

  window.localStorage.setItem(VISITOR_LEADS_STORAGE_KEY, JSON.stringify(nextLeads))
  window.dispatchEvent(new Event(VISITOR_LEADS_UPDATED_EVENT))

  return lead
}
