'use client'

import { useState } from 'react'
import { Eye, EyeOff, Star, Trash2 } from 'lucide-react'
import { useLocalBrowserStore } from '@/components/kainchi/local-browser-store'
import { EMPTY_STUDIO_FEEDBACK, FEEDBACK_STORAGE_KEY, isStudioFeedbackList } from '@/components/kainchi/studio-content'

export function FeedbackModerationPanel() {
  const [feedback, saveFeedback] = useLocalBrowserStore(FEEDBACK_STORAGE_KEY, EMPTY_STUDIO_FEEDBACK, isStudioFeedbackList)
  const [showHidden, setShowHidden] = useState(false)
  const visibleFeedback = feedback
    .filter((entry) => showHidden || !entry.isHidden)
    .slice()
    .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
  const hiddenCount = feedback.filter((entry) => entry.isHidden).length

  function toggleHidden(id: string) {
    saveFeedback((current) => current.map((entry) => entry.id === id ? { ...entry, isHidden: !entry.isHidden } : entry))
  }

  function deleteFeedback(id: string) {
    saveFeedback((current) => current.filter((entry) => entry.id !== id))
  }

  return (
    <section className="admin-panel feedback-admin-panel" aria-labelledby="feedback-admin-title">
      <div className="admin-panel-heading">
        <div>
          <h2 id="feedback-admin-title">Studio letterbox</h2>
          <p>Ratings and notes saved from this browser&apos;s public storefront.</p>
        </div>
        <div className="feedback-admin-tools">
          <span className="feedback-storage-badge">This browser only</span>
          {hiddenCount > 0 && <button className="feedback-show-hidden" type="button" aria-pressed={showHidden} onClick={() => setShowHidden((current) => !current)}>
            {showHidden ? 'Hide hidden' : `Show hidden (${hiddenCount})`}
          </button>}
        </div>
      </div>
      <p className="feedback-admin-disclosure">Notes are stored only in this browser and are not sent to the studio or other devices.</p>

      {visibleFeedback.length ? (
        <ul className="feedback-admin-list">
          {visibleFeedback.map((entry) => (
            <li className={`feedback-admin-entry${entry.isHidden ? ' is-hidden' : ''}`} key={entry.id}>
              <div className="feedback-admin-entry-topline">
                <span className="feedback-admin-rating" aria-label={`${entry.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, index) => <Star aria-hidden="true" className={index < entry.rating ? 'is-filled' : ''} key={index} />)}
                  <span>{entry.rating}/5</span>
                </span>
                <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</time>
              </div>
              <p className="feedback-admin-note-text">{entry.note || 'No written note was included.'}</p>
              <div className="feedback-admin-entry-actions">
                <button type="button" onClick={() => toggleHidden(entry.id)} aria-label={`${entry.isHidden ? 'Restore' : 'Hide'} feedback from ${new Date(entry.createdAt).toLocaleDateString('en-IN')}`}>
                  {entry.isHidden ? <Eye aria-hidden="true" /> : <EyeOff aria-hidden="true" />}
                  {entry.isHidden ? 'Restore' : 'Hide'}
                </button>
                <button type="button" className="is-destructive" onClick={() => deleteFeedback(entry.id)} aria-label="Delete feedback">
                  <Trash2 aria-hidden="true" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="feedback-admin-empty">
          <span className="feedback-admin-mark" aria-hidden="true">KC</span>
          <div>
            <h3>{showHidden && hiddenCount ? 'No hidden notes are visible.' : 'The letterbox is quiet for now.'}</h3>
            <p>Feedback submitted from this browser will appear here. Other browsers and devices have separate local storage.</p>
          </div>
        </div>
      )}
    </section>
  )
}
