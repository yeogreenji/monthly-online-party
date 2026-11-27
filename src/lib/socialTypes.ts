// 미니홈피 데이터 모양. content-master-v1.json의 minihome.fields(홈피 제목·오늘의 기분·소개·
// 취향 태그·오늘의 추천곡 공식 링크·오늘의 한마디)와 themes(8종), privacy_default(private)를 그대로 쓴다.

export type MiniHome = {
  title: string
  mood: string
  intro: string
  tags: string[]
  song: string
  note: string
  theme: string
}

export const MINIHOME_DEFAULT: MiniHome = {
  title: '나의 작은 집',
  mood: '편안함',
  intro: '',
  tags: [],
  song: '',
  note: '',
  theme: '카페형',
}

export const MOODS = ['편안함', '설렘', '기쁨', '차분함', '휴식 필요', '신남', '포근함']

/** 홈피 소개·한마디는 연락처를 담지 않는다(공개 범위와 무관하게 서버 저장 전에 막는다). */
export function cleanMiniHome(v: Partial<MiniHome> | null | undefined): MiniHome {
  const src = v ?? {}
  const text = (s: unknown, max: number) => (typeof s === 'string' ? s.replace(/01[016789][-. ]?\d{3,4}[-. ]?\d{4}/g, '').slice(0, max) : '')
  const tags = Array.isArray(src.tags) ? src.tags.filter((t): t is string => typeof t === 'string').map((t) => t.trim().slice(0, 10)).filter(Boolean).slice(0, 5) : []
  const song = typeof src.song === 'string' && /^https?:\/\//i.test(src.song.trim()) ? src.song.trim().slice(0, 300) : ''
  return {
    title: text(src.title, 40) || MINIHOME_DEFAULT.title,
    mood: typeof src.mood === 'string' && MOODS.includes(src.mood) ? src.mood : MINIHOME_DEFAULT.mood,
    intro: text(src.intro, 160),
    tags,
    song,
    note: text(src.note, 120),
    theme: typeof src.theme === 'string' ? src.theme.slice(0, 20) : MINIHOME_DEFAULT.theme,
  }
}
