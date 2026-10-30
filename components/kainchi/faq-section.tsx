'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLocalBrowserStore } from './local-browser-store'
import { DEFAULT_STUDIO_FAQS, FAQ_STORAGE_KEY, isStudioFAQList } from './studio-content'

export function FAQSection() {
  const [faqs] = useLocalBrowserStore(FAQ_STORAGE_KEY, DEFAULT_STUDIO_FAQS, isStudioFAQList)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const visibleFaqs = faqs.filter((faq) => faq.question.trim() && faq.answer.trim())

  return (
    <section className="faq-section" id="faq" aria-labelledby="faq-title">
      <div className="faq-heading">
        <p className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> A few helpful details</p>
        <h2 id="faq-title">Frequently Asked <em>Questions</em></h2>
        <p>Thoughtful answers from our studio, before and after your piece arrives.</p>
      </div>
      <div className="faq-list">
        {visibleFaqs.length ? visibleFaqs.map((faq, index) => {
          const isExpanded = expandedId === faq.id
          const questionId = `faq-question-${index}`
          const answerId = `faq-answer-${index}`

          return (
            <article className={`faq-item${isExpanded ? ' is-open' : ''}`} key={faq.id}>
              <button
                aria-controls={answerId}
                aria-expanded={isExpanded}
                className="faq-question"
                id={questionId}
                onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                type="button"
              >
                <span className="faq-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="faq-question-text">{faq.question}</span>
                <ChevronDown aria-hidden="true" className="faq-chevron" />
              </button>
              <div
                aria-hidden={!isExpanded}
                className={`faq-answer${isExpanded ? ' is-open' : ''}`}
                id={answerId}
                role="region"
                aria-labelledby={questionId}
              >
                <div className="faq-answer-inner"><p>{faq.answer}</p></div>
              </div>
            </article>
          )
        }) : <p className="faq-empty">The studio is updating these answers. Please reach us on WhatsApp if you need a hand.</p>}
      </div>
    </section>
  )
}
