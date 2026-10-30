'use client'

import { useId, useRef, useState, type KeyboardEvent } from 'react'

type FitStyle = 'standard' | 'oversized'
type SizeGuideVariant = 'dark' | 'light'

const fitMeasurements: Record<FitStyle, { label: string; rows: [string, string, string, string][] }> = {
  standard: {
    label: 'Standard / Regular Fit',
    rows: [
      ['S', '38', '26', '8'],
      ['M', '40', '27', '8.5'],
      ['L', '42', '28', '9'],
      ['XL', '44', '29', '9.5'],
      ['XXL', '46', '30', '10'],
    ],
  },
  oversized: {
    label: 'Signature Streetwear Oversized',
    rows: [
      ['S', '42', '28', '10'],
      ['M', '44', '29', '10.5'],
      ['L', '46', '30', '11'],
      ['XL', '48', '31', '11.5'],
      ['XXL', '50', '32', '12'],
    ],
  },
}

export function FitSizeGuide({ variant }: { variant: SizeGuideVariant }) {
  const [activeFit, setActiveFit] = useState<FitStyle>('oversized')
  const idPrefix = useId().replace(/:/g, '')
  const tabRefs = useRef<Record<FitStyle, HTMLButtonElement | null>>({ standard: null, oversized: null })
  const measurements = fitMeasurements[activeFit]
  const tableWrapClass = variant === 'light' ? 'studio-intake-size-table-wrap' : 'size-guide-table-wrap'

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, currentFit: FitStyle) {
    const currentIndex = currentFit === 'standard' ? 0 : 1
    let nextIndex = currentIndex

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % 2
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + 2) % 2
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = 1
    else return

    event.preventDefault()
    const nextFit: FitStyle = nextIndex === 0 ? 'standard' : 'oversized'
    setActiveFit(nextFit)
    tabRefs.current[nextFit]?.focus()
  }

  return (
    <section className={`fit-size-guide fit-size-guide-${variant}`} aria-label="Select a fit and review measurements">
      <div className="fit-size-guide-tabs" role="tablist" aria-label="Fit style">
        {(Object.keys(fitMeasurements) as FitStyle[]).map((fit) => (
          <button
            key={fit}
            ref={(node) => { tabRefs.current[fit] = node }}
            id={`${idPrefix}-${fit}-tab`}
            type="button"
            role="tab"
            aria-selected={activeFit === fit}
            aria-controls={`${idPrefix}-fit-panel`}
            tabIndex={activeFit === fit ? 0 : -1}
            className="fit-size-guide-tab"
            onClick={() => setActiveFit(fit)}
            onKeyDown={(event) => handleTabKeyDown(event, fit)}
          >
            {fitMeasurements[fit].label}
          </button>
        ))}
      </div>
      <div
        className={tableWrapClass}
        id={`${idPrefix}-fit-panel`}
        role="tabpanel"
        aria-labelledby={`${idPrefix}-${activeFit}-tab`}
        tabIndex={0}
      >
        <table className="size-guide-table">
          <caption className="sr-only">{measurements.label} top measurements in inches</caption>
          <thead>
            <tr><th scope="col">Size</th><th scope="col">Chest (in)</th><th scope="col">Length (in)</th><th scope="col">Sleeve (in)</th></tr>
          </thead>
          <tbody>
            {measurements.rows.map(([size, chest, length, sleeve]) => (
              <tr key={size}><th scope="row">{size}</th><td>{chest}</td><td>{length}</td><td>{sleeve}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fit-size-guide-note">Approximate garment measurements in inches. Ask the studio to confirm a fit before ordering.</p>
    </section>
  )
}
