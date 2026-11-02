'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const Analytics = dynamic(
  () => import('@vercel/analytics/next').then((module) => module.Analytics),
  { ssr: false },
)

export function DeferredAnalytics() {
  const [isWindowLoaded, setIsWindowLoaded] = useState(false)

  useEffect(() => {
    if (document.readyState === 'complete') {
      setIsWindowLoaded(true)
      return
    }

    const handleLoad = () => setIsWindowLoaded(true)
    window.addEventListener('load', handleLoad, { once: true })
    return () => window.removeEventListener('load', handleLoad)
  }, [])

  return isWindowLoaded ? <Analytics /> : null
}
