'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { FitSizeGuide } from './fit-size-guide'
import { SIZE_GUIDE_EVENT } from './storefront-events'

const oversizedFit = [
  { size: 'S', chest: 42, length: 28, shoulder: 20 },
  { size: 'M', chest: 44, length: 29, shoulder: 21 },
  { size: 'L', chest: 46, length: 30, shoulder: 22 },
  { size: 'XL', chest: 48, length: 31, shoulder: 23 },
  { size: 'XXL', chest: 50, length: 32, shoulder: 24 },
]

export function SizeGuideModal() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const open = () => setIsOpen(true)
    window.addEventListener(SIZE_GUIDE_EVENT, open)
    return () => window.removeEventListener(SIZE_GUIDE_EVENT, open)
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) {
      dialog.showModal()
      closeButtonRef.current?.focus()
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  return (
    <dialog
      ref={dialogRef}
      className="size-guide-dialog"
      aria-labelledby="size-guide-title"
      onCancel={(event) => { event.preventDefault(); setIsOpen(false) }}
      onClose={() => setIsOpen(false)}
      onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false) }}
    >
      <div className="size-guide-inner">
        <div className="size-guide-topline">
          <div>
            <p className="size-guide-kicker">KAINCHI CLUB · FIT NOTES</p>
            <h2 id="size-guide-title">Size Guide</h2>
          </div>
          <button ref={closeButtonRef} aria-label="Close size guide" className="size-guide-close" onClick={() => setIsOpen(false)} type="button"><X aria-hidden="true" /></button>
        </div>
        <p className="size-guide-intro">Streetwear oversized fit. All measurements are garment measurements in inches.</p>

        <section className="size-guide-category" aria-labelledby="size-guide-oversized">
          <h3 id="size-guide-oversized">Oversized Streetwear Fit <span>Inches</span></h3>
          <div className="size-guide-table-wrap">
            <table className="size-guide-table size-guide-oversized-table">
              <caption className="sr-only">Oversized streetwear fit: chest, length and shoulder in inches</caption>
              <thead><tr><th scope="col">Size</th><th scope="col">Chest</th><th scope="col">Length</th><th scope="col">Shoulder</th></tr></thead>
              <tbody>
                {oversizedFit.map((row) => (
                  <tr key={row.size}><th scope="row">{row.size}</th><td>{row.chest}&quot;</td><td>{row.length}&quot;</td><td>{row.shoulder}&quot;</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="size-guide-tip"><strong>Fit note</strong> Boxy, drop-shoulder streetwear fit. Order true to size for an oversized look, or size down for a classic fit.</p>

        <details className="size-guide-more">
          <summary>Standard fit &amp; denim measurements</summary>
          <div className="size-guide-more-content">
            <FitSizeGuide variant="dark" />
            <section className="size-guide-category" aria-labelledby="size-guide-denim">
              <h3 id="size-guide-denim">Streetwear Denim Jeans</h3>
              <div className="size-guide-table-wrap">
                <table className="size-guide-table size-guide-denim-table">
                  <caption className="sr-only">Streetwear denim jean waist sizes and fit notes</caption>
                  <thead><tr><th scope="col">Waist (in)</th><th scope="col">Standard length</th><th scope="col">Fit</th></tr></thead>
                  <tbody>
                    {['30', '32', '34', '36'].map((waist) => <tr key={waist}><th scope="row">{waist}</th><td>41–42 in</td><td>Relaxed Straight Fit</td></tr>)}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </details>
      </div>
    </dialog>
  )
}
