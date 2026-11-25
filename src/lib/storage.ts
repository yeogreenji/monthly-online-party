import { useCallback, useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function saveJSON(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

/** localStorage에 저장되는 상태. 용량 초과 등으로 저장이 실패해도 화면은 계속 동작합니다. */
export function usePersistentState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => loadJSON(key, initial))

  useEffect(() => {
    saveJSON(key, value)
  }, [key, value])

  return [value, setValue]
}

export function usePersistentFlag(key: string, initial = false): [boolean, () => void] {
  const [value, setValue] = usePersistentState(key, initial)
  const toggle = useCallback(() => setValue((prev) => !prev), [setValue])
  return [value, toggle]
}

export const STORAGE_KEYS = {
  profile: 'ms.profile.v1',
  night: 'ms.night.v1',
  month: 'ms.month.v1',
  rsvp: 'ms.rsvp.v1',
  feed: 'ms.feed.v1',
  notes: 'ms.notes.v1',
  coupons: 'ms.coupons.v1',
  inquiries: 'ms.inquiries.v1',
  votes: 'ms.votes.v1',
  alarms: 'ms.alarms.v1',
  clinks: 'ms.clinks.v1',
  reports: 'ms.reports.v1',
  seenIntro: 'ms.seenIntro.v1',
  roomsVisited: 'ms.roomsVisited.v1',
} as const
