import { useEffect, useRef, useState } from 'react'
import { Brain, Send, X } from 'lucide-react'
import { RESIDENTS } from '../data/world'
import { normalizeLook } from '../data/avatarLook'
import {
  DIALOGUE_RESIDENTS,
  MEMORY_CONSENT_KEY,
  MEMORY_KEY,
  type ResidentMemory,
  type Turn,
  lockedNotice,
  replyFor,
} from '../data/residentDialogueV2'
import { loadJSON, saveJSON, usePersistentState } from '../lib/storage'
import { AvatarPreview } from './AvatarWardrobe'

/* 16주민 맥락 대화 — 정본(phase4-5/02-resident-dialogue.json)의 주제 6개와
   첫 방문·재방문·종료·미지원 대사를 쓴다. 생성형 AI가 아니며 실제 접속자가 아니다. */
export function ResidentConversation({ id, onClose, onToast }: { id: string; onClose: () => void; onToast?: (text: string) => void }) {
  const resident = RESIDENTS[id]
  const dialogue = DIALOGUE_RESIDENTS[id]
  const visitedKey = `dd.resident.visited.${id}`
  const revisit = typeof window !== 'undefined' && window.sessionStorage.getItem(visitedKey) === '1'
  const [turns, setTurns] = useState<Turn[]>(() => [
    { speaker: 'resident', text: (revisit ? dialogue?.utterances.revisit : dialogue?.utterances.greeting) ?? resident?.greeting ?? '' },
  ])
  const [draft, setDraft] = useState('')
  const [consent, setConsent] = usePersistentState<boolean>(MEMORY_CONSENT_KEY, false)
  const [memory, setMemory] = useState<ResidentMemory>(() => loadJSON<ResidentMemory>(MEMORY_KEY, {}))
  const [asked, setAsked] = useState<string[]>(() => (loadJSON<boolean>(MEMORY_CONSENT_KEY, false) ? loadJSON<ResidentMemory>(MEMORY_KEY, {})[id]?.intents ?? [] : []))
  const [lastIntent, setLastIntent] = useState<string | undefined>(undefined)
  const log = useRef<HTMLDivElement>(null)
  const locked = lockedNotice(id)

  useEffect(() => {
    window.sessionStorage.setItem(visitedKey, '1')
  }, [visitedKey])

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight
  }, [turns])

  // 기억 동의를 켜면 이 기기에 저장된 주제를 이어 받고, 끄면 즉시 지운다.
  useEffect(() => {
    if (consent && memory[id]) setAsked(memory[id].intents)
    if (!consent) {
      setAsked([])
      saveJSON(`dd.resident.asked.${id}`, [])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consent])

  function rememberIntents(intents: string[]) {
    if (!consent) return
    const next: ResidentMemory = { ...memory, [id]: { intents, updatedAt: new Date().toISOString() } }
    setMemory(next)
    saveJSON(MEMORY_KEY, next)
    saveJSON(`dd.resident.asked.${id}`, intents)
  }

  function send() {
    const question = draft.trim()
    if (!question) return
    if (locked) {
      setTurns((prev) => [...prev, { speaker: 'me' as const, text: question }, { speaker: 'resident' as const, text: locked }].slice(-41))
      setDraft('')
      return
    }
    const lastResidentText = [...turns].reverse().find((turn) => turn.speaker === 'resident')?.text
    const result = replyFor(id, question, { asked, lastIntent, revisit, lastText: lastResidentText })
    const nextAsked = result.intent && !asked.includes(result.intent) ? [...asked, result.intent] : asked
    setTurns((prev) => [...prev, { speaker: 'me' as const, text: question }, { speaker: 'resident' as const, text: result.text }].slice(-41))
    setAsked(nextAsked)
    if (result.intent) setLastIntent(result.intent)
    if (nextAsked !== asked) rememberIntents(nextAsked)
    setDraft('')
  }

  function clearMemory() {
    const next = { ...memory }
    delete next[id]
    setMemory(next)
    saveJSON(MEMORY_KEY, next)
    setAsked([])
    saveJSON(`dd.resident.asked.${id}`, [])
    onToast?.('이 주민에 대해 기억한 내용을 지웠어요.')
  }

  return (
    <section className="dd-host-chat" role="dialog" aria-label={`${resident?.name ?? id}와 대화`} data-resident={id}>
      <header>
        <div className="dd-host-avatar">
          <AvatarPreview model avatar={resident?.avatar ?? 'cat'} look={normalizeLook({ coat: resident?.coat ?? '#627c69', ...resident?.look })} />
        </div>
        <div>
          <strong>{dialogue?.name ?? resident?.name ?? id}</strong>
          <p>{resident?.role ?? dialogue?.personality ?? '마을 주민'} · 가상 주민</p>
        </div>
        <button aria-label="대화 닫기" onClick={onClose}><X size={20} /></button>
      </header>
      <div className="dd-host-log" role="log" aria-label="주민 대화 기록" ref={log}>
        {turns.map((turn, i) => (
          <div key={i} className={`dd-host-turn ${turn.speaker}`}>
            {turn.speaker === 'resident' && <small>{dialogue?.name ?? resident?.name}</small>}
            <p>{turn.text}</p>
          </div>
        ))}
      </div>
      {locked && <p className="dd-host-locked" role="status">{locked}</p>}
      <form onSubmit={(e) => { e.preventDefault(); send() }}>
        <input
          aria-label="주민에게 할 말"
          placeholder={locked ? '잠금 안내만 들을 수 있어요' : `${dialogue?.name ?? resident?.name ?? '주민'}에게 이야기해 보세요`}
          value={draft}
          maxLength={400}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button disabled={!draft.trim()} aria-label="주민에게 전송"><Send size={19} /></button>
      </form>
      <footer>
        <label className="dd-host-memory">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <Brain size={14} /> 대화 주제 기억하기 (기본 꺼짐 · 이 기기에만 저장)
        </label>
        {consent && <button type="button" onClick={clearMemory}>기억 지우기</button>}
        <small>로컬 문맥·주제 기반 대화 · 생성형 AI 및 실제 이용자 아님</small>
      </footer>
    </section>
  )
}
