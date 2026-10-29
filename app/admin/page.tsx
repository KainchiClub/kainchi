import Link from 'next/link'
import type { Metadata } from 'next'
import { AdminPortal } from './admin-portal'
import { isAdminSessionActive } from './auth'

export const metadata: Metadata = {
  title: 'Admin Portal | Kainchi Club',
  robots: { index: false, follow: false },
}

const brandLogo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1793199520083.png-jf1N3sU3CUwrqFKo13EIdHxMVXa7FI.jpeg'

export default async function AdminPage() {
  const isUnlocked = await isAdminSessionActive()

  return (
    <main className="admin-page">
      <Link className="wordmark" href="/" aria-label="Kainchi Club home">
        <img className="wordmark-logo" src={brandLogo} alt="" />
        <span>KAINCHI <span className="wordmark-light">CLUB</span></span>
      </Link>
      <AdminPortal isUnlocked={isUnlocked} />
    </main>
  )
}
