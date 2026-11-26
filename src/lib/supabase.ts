import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// 환경변수가 없으면 null이다. 이때 앱은 지금처럼 기기 안 저장 모드로만 동작한다.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true } }) : null

export const serverEnabled = supabase !== null

/** 이메일 링크 로그인 메일을 보낸다. 가입이 처음이면 계정이 만들어진다. */
export async function sendLoginLink(email: string): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!supabase) return { ok: false, reason: '서버가 아직 연결되지 않았어요.' }
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: window.location.origin },
  })
  return error ? { ok: false, reason: '로그인 메일을 보내지 못했어요. 이메일 주소를 확인해 주세요.' } : { ok: true }
}

export async function signOut() {
  await supabase?.auth.signOut()
}

/** 프로필이 없으면 만들고, 있으면 닉네임·연령대를 갱신한다. */
export async function saveProfile(nickname: string, ageBand: string) {
  if (!supabase) return { ok: false as const, reason: '서버가 아직 연결되지 않았어요.' }
  const { data } = await supabase.auth.getUser()
  const user = data.user
  if (!user) return { ok: false as const, reason: '먼저 로그인해 주세요.' }
  const { error } = await supabase.from('profiles').upsert({ id: user.id, nickname: nickname.trim(), age_band: ageBand })
  if (!error) return { ok: true as const }
  return { ok: false as const, reason: error.code === '23505' ? '이미 쓰고 있는 닉네임이에요.' : '프로필을 저장하지 못했어요. 닉네임 규칙을 확인해 주세요.' }
}
