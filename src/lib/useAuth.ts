import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, serverEnabled, saveProfile } from './supabase'

export type ProfileSync = 'off' | 'idle' | 'syncing' | 'ok' | 'duplicate' | 'error'

/** 로그인 상태. 서버가 설정되지 않았으면 항상 user=null, ready=true. */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!serverEnabled)
  useEffect(() => {
    if (!supabase) return
    let alive = true
    void supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setUser(data.session?.user ?? null)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setReady(true)
    })
    return () => {
      alive = false
      data.subscription.unsubscribe()
    }
  }, [])
  return { user, ready }
}

/** 로그인한 사용자의 서버 프로필을 기기 프로필과 맞춘다. 닉네임이 겹치면 'duplicate'. */
export function useProfileSync(user: User | null, nickname: string, ageBand: string): ProfileSync {
  const [state, setState] = useState<ProfileSync>(serverEnabled ? 'idle' : 'off')
  useEffect(() => {
    if (!serverEnabled) return
    if (!user) {
      setState('idle')
      return
    }
    let alive = true
    setState('syncing')
    void saveProfile(nickname, ageBand).then((r) => {
      if (!alive) return
      if (r.ok) setState('ok')
      else setState(r.reason.includes('이미 쓰고') ? 'duplicate' : 'error')
    })
    return () => {
      alive = false
    }
  }, [user?.id, nickname, ageBand])
  return state
}
