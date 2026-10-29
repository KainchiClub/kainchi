import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Portal | Kainchi Club',
  robots: { index: false, follow: false },
}

const brandLogo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1793199520083.png-jf1N3sU3CUwrqFKo13EIdHxMVXa7FI.jpeg'

export default function AdminPage() {
  return (
    <main className="admin-page">
      <Link className="wordmark" href="/" aria-label="Kainchi Club home">
        <img className="wordmark-logo" src={brandLogo} alt="" />
        <span>KAINCHI <span className="wordmark-light">CLUB</span></span>
      </Link>
      <section className="admin-page-main" aria-labelledby="admin-page-title">
        <div className="admin-notice">
          <p className="eyebrow eyebrow-dark"><span className="eyebrow-dot" /> Owner access</p>
          <h1 id="admin-page-title">Admin Portal</h1>
          <p>Secure owner sign-in and persistent product editing are not configured for this storefront. It remains read-only, and this page intentionally does not accept or store a PIN.</p>
          <Link className="button button-outline-dark" href="/#collection">Return to the storefront <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </main>
  )
}
