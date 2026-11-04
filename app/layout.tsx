import { DeferredAnalytics } from '@/components/kainchi/deferred-analytics'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const bodyFont = DM_Sans({ subsets: ['latin'], display: 'swap', preload: true, variable: '--font-body-loaded' })
const displayFont = Playfair_Display({ subsets: ['latin'], display: 'swap', preload: true, variable: '--font-display-loaded' })

export const metadata: Metadata = {
  title: 'Kainchi Club — Wear Your Own Art',
  description: 'Independent streetwear, custom prints, and wearable art made personal. Find your next favourite at Kainchi Club.',
  generator: 'v0.app',
  verification: {
    google: 'I90Q38ksL2tDWIbg7cHxHA_kH5bK6sa1i8sUBc-0yQA',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#eee7db',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" as="image" href="/images/kainchi-hero-editorial-1200.webp" fetchPriority="high" />
        <link rel="preconnect" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" />
        <link rel="dns-prefetch" href="//hebbkx1anhila5yf.public.blob.vercel-storage.com" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="//lh3.googleusercontent.com" />
      </head>
      <body className={`antialiased ${bodyFont.variable} ${displayFont.variable}`}>
        {children}
        {process.env.NODE_ENV === 'production' && <DeferredAnalytics />}
      </body>
    </html>
  )
}
