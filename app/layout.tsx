import { DeferredAnalytics } from '@/components/kainchi/deferred-analytics'
import { DM_Sans, Playfair_Display } from 'next/font/google'
import Script from 'next/script'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const bodyFont = DM_Sans({ subsets: ['latin'], display: 'swap', preload: true, variable: '--font-body-loaded' })
const displayFont = Playfair_Display({ subsets: ['latin'], display: 'swap', preload: true, variable: '--font-display-loaded' })

export const metadata: Metadata = {
  title: 'KAINCHI CLUB | Luxury Streetwear & Heavyweight Architecture',
  description: 'Shop luxury heavyweight streetwear crafted with 240+ GSM French Terry & 400 GSM fleece. Bespoke wearable art, numbered drops, and archival silhouettes.',
  keywords: ['streetwear', 'kainchi club', 'heavyweight t-shirt', 'french terry', 'oversized hoodie', 'luxury apparel india'],
  openGraph: {
    title: 'KAINCHI CLUB | Wearable Art',
    description: 'Bespoke Heavyweight Streetwear Architecture.',
    url: 'https://kainchi-chi.vercel.app',
    siteName: 'Kainchi Club',
    type: 'website',
  },
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
        <link rel="preconnect" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" />
        <link rel="dns-prefetch" href="//hebbkx1anhila5yf.public.blob.vercel-storage.com" />
        <link rel="preconnect" href="https://lh3.googleusercontent.com" />
        <link rel="dns-prefetch" href="//lh3.googleusercontent.com" />
      </head>
      <body className={`antialiased ${bodyFont.variable} ${displayFont.variable}`}>
        {children}
        <Script
          strategy="lazyOnload"
          src="https://www.googletagmanager.com/gtag/js?id=G-C0DFYC5KQH"
        />
        <Script id="google-analytics" strategy="lazyOnload">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-C0DFYC5KQH');
          `}
        </Script>
        {process.env.NODE_ENV === 'production' && <DeferredAnalytics />}
      </body>
    </html>
  )
}
