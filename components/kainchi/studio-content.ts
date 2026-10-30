export const FAQ_STORAGE_KEY = 'kainchi-studio-faqs-v1'
export const FEEDBACK_STORAGE_KEY = 'kainchi-studio-feedback-v1'

export type StudioFAQ = {
  id: string
  question: string
  answer: string
}

export type StudioFeedback = {
  id: string
  rating: number
  note: string
  createdAt: string
  isHidden: boolean
}

export const EMPTY_STUDIO_FEEDBACK: StudioFeedback[] = []

export const DEFAULT_STUDIO_FAQS: StudioFAQ[] = [
  {
    id: 'delivery-time',
    question: 'How long will my order take to reach me?',
    answer: 'Every piece is carefully packaged and dispatched from our studio within 24–48 hours. Standard courier delivery takes 3–5 working days with live tracking.',
  },
  {
    id: 'track-order',
    question: 'How do I track my package?',
    answer: 'As soon as your package is dispatched, our team shares a direct courier tracking link and AWB number directly to your WhatsApp.',
  },
  {
    id: 'apparel-care',
    question: 'What care instructions should I follow for my apparel?',
    answer: 'Machine wash cold inside-out with similar colors. Do not iron directly on graphics or embroidery. Hang dry in shade.',
  },
  {
    id: 'returns-exchanges',
    question: 'Can I return or exchange my order if the size does not fit?',
    answer: 'Yes, you can request an exchange within 24 hours of delivery via WhatsApp, provided the garment is unworn and all original tags remain intact.',
  },
  {
    id: 'collectors-vault',
    question: 'What makes the ₹99 Collector\'s Vault special?',
    answer: 'It includes an individually wax-sealed rigid keepsake box, an embossed certificate of authenticity, and artisan scented wrapping.',
  },
]

export function isStudioFAQList(value: unknown): value is StudioFAQ[] {
  return Array.isArray(value)
    && value.length <= 100
    && value.every((item) => {
      if (!item || typeof item !== 'object') return false
      const faq = item as Record<string, unknown>
      return typeof faq.id === 'string'
        && faq.id.length > 0
        && faq.id.length <= 100
        && typeof faq.question === 'string'
        && faq.question.length <= 240
        && typeof faq.answer === 'string'
        && faq.answer.length <= 2_000
    })
}

export function isStudioFeedbackList(value: unknown): value is StudioFeedback[] {
  return Array.isArray(value)
    && value.length <= 5_000
    && value.every((item) => {
      if (!item || typeof item !== 'object') return false
      const entry = item as Record<string, unknown>
      return typeof entry.id === 'string'
        && entry.id.length > 0
        && entry.id.length <= 100
        && typeof entry.rating === 'number'
        && Number.isInteger(entry.rating)
        && entry.rating >= 1
        && entry.rating <= 5
        && typeof entry.note === 'string'
        && entry.note.length <= 240
        && typeof entry.createdAt === 'string'
        && Number.isFinite(Date.parse(entry.createdAt))
        && typeof entry.isHidden === 'boolean'
    })
}
