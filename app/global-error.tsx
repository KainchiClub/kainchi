'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[kainchi] global error', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#241713', color: '#f4e9db', fontFamily: 'Arial, Helvetica, sans-serif', padding: 24, textAlign: 'center' }}>
        <main style={{ maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <p style={{ margin: 0, color: '#c6a779', fontSize: 10, letterSpacing: '.21em', textTransform: 'uppercase' }}>Kainchi Club</p>
          <h1 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 30, fontWeight: 500 }}>Just a stitch out of place.</h1>
          <p style={{ margin: 0, color: '#d8c7b2', lineHeight: 1.6 }}>Tap below to head straight back to the storefront.</p>
          <button type="button" onClick={reset} style={{ minHeight: 46, padding: '0 20px', border: 0, borderRadius: 3, background: '#792333', color: '#fff7ee', fontWeight: 600, cursor: 'pointer' }}>Back to the collection</button>
        </main>
      </body>
    </html>
  )
}
