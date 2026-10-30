'use client'

import { useCallback, useEffect, useState } from 'react'

const STORE_CHANGE_EVENT = 'kainchi:browser-store-change'

type StoreUpdate<T> = T | ((current: T) => T)
type StoreValidator<T> = (value: unknown) => value is T

function readValue<T>(key: string, fallback: T, validate: StoreValidator<T>): T {
  if (typeof window === 'undefined') return fallback

  try {
    const serialized = window.localStorage.getItem(key)
    if (serialized === null) return fallback

    const parsed: unknown = JSON.parse(serialized)
    return validate(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

export function useLocalBrowserStore<T>(
  key: string,
  fallback: T,
  validate: StoreValidator<T>,
) {
  const [value, setValue] = useState<T>(fallback)
  const readCurrentValue = useCallback(() => readValue(key, fallback, validate), [fallback, key, validate])

  useEffect(() => {
    const syncValue = () => setValue(readCurrentValue())
    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key === key || event.key === null) syncValue()
    }
    const syncWithinTab = (event: Event) => {
      const changedKey = (event as CustomEvent<{ key?: string }>).detail?.key
      if (changedKey === key) syncValue()
    }

    syncValue()
    window.addEventListener('storage', syncAcrossTabs)
    window.addEventListener(STORE_CHANGE_EVENT, syncWithinTab)

    return () => {
      window.removeEventListener('storage', syncAcrossTabs)
      window.removeEventListener(STORE_CHANGE_EVENT, syncWithinTab)
    }
  }, [key, readCurrentValue])

  const saveValue = useCallback((update: StoreUpdate<T>) => {
    if (typeof window === 'undefined') return false

    const currentValue = readCurrentValue()
    const nextValue = typeof update === 'function'
      ? (update as (current: T) => T)(currentValue)
      : update

    if (!validate(nextValue)) return false

    try {
      window.localStorage.setItem(key, JSON.stringify(nextValue))
      setValue(nextValue)
      window.dispatchEvent(new CustomEvent(STORE_CHANGE_EVENT, { detail: { key } }))
      return true
    } catch {
      return false
    }
  }, [key, readCurrentValue, validate])

  return [value, saveValue] as const
}
