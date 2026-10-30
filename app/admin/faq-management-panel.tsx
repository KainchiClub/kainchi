'use client'

import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useLocalBrowserStore } from '@/components/kainchi/local-browser-store'
import { DEFAULT_STUDIO_FAQS, FAQ_STORAGE_KEY, isStudioFAQList, type StudioFAQ } from '@/components/kainchi/studio-content'

export function FAQManagementPanel() {
  const [faqs, saveFaqs] = useLocalBrowserStore(FAQ_STORAGE_KEY, DEFAULT_STUDIO_FAQS, isStudioFAQList)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState('')

  function updateFAQ(id: string, field: 'question' | 'answer', value: string) {
    const saved = saveFaqs((current) => current.map((faq) => faq.id === id ? { ...faq, [field]: value } : faq))
    setStatus(saved ? '' : 'This browser could not save the change. Check its storage settings and try again.')
  }

  function addFAQ(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuestion = question.trim()
    const nextAnswer = answer.trim()
    if (!nextQuestion || !nextAnswer) {
      setStatus('Add both a question and an answer.')
      return
    }

    const newFAQ: StudioFAQ = { id: crypto.randomUUID(), question: nextQuestion, answer: nextAnswer }
    const saved = saveFaqs((current) => [...current, newFAQ])
    if (!saved) {
      setStatus('This browser could not save the new FAQ. Check its storage settings and try again.')
      return
    }

    setQuestion('')
    setAnswer('')
    setStatus('FAQ added. The storefront updates in this browser immediately.')
  }

  function deleteFAQ(id: string) {
    const saved = saveFaqs((current) => current.filter((faq) => faq.id !== id))
    setStatus(saved ? 'FAQ removed from this browser.' : 'This browser could not save the change. Check its storage settings and try again.')
  }

  return (
    <section className="admin-panel faq-management-panel" aria-labelledby="faq-admin-title">
      <div className="admin-panel-heading">
        <div>
          <h2 id="faq-admin-title">Manage FAQs</h2>
          <p>Edit storefront answers as you type, or add and remove questions.</p>
        </div>
        <span className="faq-storage-badge">This browser only</span>
      </div>

      <div className="faq-admin-list">
        {faqs.map((faq, index) => (
          <article className="faq-admin-item" key={faq.id}>
            <div className="faq-admin-item-heading">
              <span className="faq-admin-index">{String(index + 1).padStart(2, '0')}</span>
              <button className="faq-admin-delete" onClick={() => deleteFAQ(faq.id)} type="button" aria-label={`Delete FAQ: ${faq.question || 'untitled question'}`}>
                <Trash2 aria-hidden="true" /> Delete
              </button>
            </div>
            <label className="faq-admin-field">
              <span>Question</span>
              <input
                maxLength={240}
                onChange={(event) => updateFAQ(faq.id, 'question', event.target.value)}
                value={faq.question}
              />
            </label>
            <label className="faq-admin-field">
              <span>Answer</span>
              <textarea
                maxLength={2_000}
                onChange={(event) => updateFAQ(faq.id, 'answer', event.target.value)}
                rows={3}
                value={faq.answer}
              />
            </label>
          </article>
        ))}
      </div>

      <form className="faq-admin-add" onSubmit={addFAQ}>
        <div className="faq-admin-add-heading">
          <h3>Add a question</h3>
          <p>New answers appear in the storefront as soon as they are saved.</p>
        </div>
        <label className="faq-admin-field">
          <span>Question</span>
          <input maxLength={240} onChange={(event) => setQuestion(event.target.value)} required value={question} />
        </label>
        <label className="faq-admin-field">
          <span>Answer</span>
          <textarea maxLength={2_000} onChange={(event) => setAnswer(event.target.value)} required rows={3} value={answer} />
        </label>
        <button className="button button-crimson faq-admin-add-button" type="submit"><Plus aria-hidden="true" /> Add FAQ</button>
      </form>
      <p className="faq-admin-status" aria-live="polite" role={status && status.startsWith('This browser') ? 'alert' : 'status'}>
        {status || 'Changes are stored in this browser and sync across its open storefront tabs. They are not shared with other devices.'}
      </p>
    </section>
  )
}
