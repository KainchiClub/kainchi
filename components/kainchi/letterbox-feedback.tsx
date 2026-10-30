'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Star, X } from 'lucide-react'
import { useLocalBrowserStore } from './local-browser-store'
import { EMPTY_STUDIO_FEEDBACK, FEEDBACK_STORAGE_KEY, isStudioFeedbackList } from './studio-content'

const MAX_COMMENT_LENGTH = 240

function StarRating({ rating, onChange }: { rating: number; onChange: (value: number) => void }) {
  return (
    <fieldset className="letterbox-rating">
      <legend>Rate your experience</legend>
      <div className="letterbox-stars" role="group" aria-label="Choose a rating from one to five stars">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            aria-label={`Rate ${value} out of 5 stars`}
            aria-pressed={rating === value}
            className="letterbox-star"
            data-filled={value <= rating}
            key={value}
            onClick={() => onChange(value)}
            type="button"
          >
            <Star aria-hidden="true" />
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export function LetterboxFeedback() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [, saveFeedback] = useLocalBrowserStore(FEEDBACK_STORAGE_KEY, EMPTY_STUDIO_FEEDBACK, isStudioFeedbackList)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (isDialogOpen && !dialog.open) dialog.showModal()
    if (!isDialogOpen && dialog.open) dialog.close()
  }, [isDialogOpen])

  useEffect(() => {
    if (!confirmation) return
    const timeout = window.setTimeout(() => setConfirmation(''), 5_000)
    return () => window.clearTimeout(timeout)
  }, [confirmation])

  function submitFeedback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!rating) {
      setSubmissionStatus('Choose a star rating before submitting your note.')
      return
    }

    const saved = saveFeedback((current) => [{
      id: crypto.randomUUID(),
      rating,
      note: comment.trim(),
      createdAt: new Date().toISOString(),
      isHidden: false,
    }, ...current])

    if (!saved) {
      setSubmissionStatus('This browser could not save your note. Check its storage settings and try again.')
      return
    }

    setSubmissionStatus('')
    setConfirmation('Thank you! Your note is saved in this browser.')
    setIsDialogOpen(false)
    setRating(0)
    setComment('')
  }

  function closeDialog() {
    setIsDialogOpen(false)
  }

  return (
    <section className="letterbox-section section-wrap" aria-labelledby="letterbox-title">
      <div className="letterbox-card">
        <div className="letterbox-copy">
          <div className="letterbox-postmark"><span aria-hidden="true">KC</span><p>STUDIO CORRESPONDENCE <span>NO. 08</span></p></div>
          <h2 id="letterbox-title">Leave us a <em>little note.</em></h2>
          <p className="letterbox-intro">A rating, a thought, a tiny story — every honest note helps the studio grow.</p>
          <StarRating rating={rating} onChange={setRating} />
          <label className="letterbox-note-label" htmlFor="letterbox-note">A short note <span>OPTIONAL</span></label>
          <textarea
            id="letterbox-note"
            className="letterbox-textarea"
            maxLength={MAX_COMMENT_LENGTH}
            onChange={(event) => setComment(event.target.value)}
            placeholder="What did you think of your piece?"
            rows={2}
            value={comment}
          />
          <div className="letterbox-actions">
            <span className="letterbox-character-count">{comment.length}/{MAX_COMMENT_LENGTH}</span>
            <button className="button button-crimson letterbox-open-button" onClick={() => { setSubmissionStatus(''); setConfirmation(''); setIsDialogOpen(true) }} type="button">Submit feedback</button>
          </div>
          <p className="letterbox-storage-note">In this preview, notes are saved only in this browser and are not sent online.</p>
        </div>
        <div className="letterbox-stamp" aria-hidden="true"><span>OPEN</span><strong>STUDIO<br />MAIL</strong><span>KAINCHI CLUB</span></div>
        <span className="letterbox-card-number" aria-hidden="true">08 / 39</span>
      </div>
      {confirmation && <div className="letterbox-confirmation" role="status" aria-live="polite">
        <span><strong>{confirmation}</strong><small>Only this browser can see it; it has not been sent online.</small></span>
        <button type="button" onClick={() => setConfirmation('')} aria-label="Dismiss feedback confirmation"><X aria-hidden="true" /></button>
      </div>}

      <dialog
        ref={dialogRef}
        className="feedback-dialog"
        aria-labelledby="feedback-dialog-title"
        onCancel={(event) => { event.preventDefault(); closeDialog() }}
        onClose={closeDialog}
      >
        <div className="feedback-dialog-inner">
          <div className="feedback-dialog-topline">
            <p>FROM THE LETTERBOX</p>
            <button aria-label="Close feedback form" className="icon-button" onClick={closeDialog} type="button"><X aria-hidden="true" /></button>
          </div>
          <div className="feedback-dialog-heading">
            <p className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> A note to the studio</p>
            <h2 id="feedback-dialog-title">How did it <em>feel?</em></h2>
            <p>Choose a star rating; a note is optional.</p>
          </div>
          <form className="feedback-form" onSubmit={submitFeedback}>
            <StarRating rating={rating} onChange={setRating} />
            <label className="letterbox-note-label" htmlFor="feedback-note">Your note <span>OPTIONAL</span></label>
            <textarea
              id="feedback-note"
              className="letterbox-textarea"
              maxLength={MAX_COMMENT_LENGTH}
              onChange={(event) => setComment(event.target.value)}
              placeholder="A few words for the people who made it…"
              rows={4}
              value={comment}
            />
            <div className="feedback-form-meta"><span>{comment.length}/{MAX_COMMENT_LENGTH} characters</span><span>Rating required · Note optional</span></div>
            <p className="feedback-storage-note">Saved in this browser only; this preview does not send notes online.</p>
            {submissionStatus && <p className="feedback-submit-status" role="alert">{submissionStatus}</p>}
            <div className="feedback-dialog-actions">
              <button className="button button-outline-dark" onClick={closeDialog} type="button">Keep browsing</button>
              <button className="button button-crimson" type="submit">Submit feedback</button>
            </div>
          </form>
        </div>
      </dialog>
    </section>
  )
}
