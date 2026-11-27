import { useEffect, useRef, useState } from 'react'
import { BellRing, X } from 'lucide-react'
import { sendLoginLink } from '../lib/supabase'

/** 서버 계정이 필요한 바로 그 순간에만 띄우는 간편 로그인 창.
    평소에는 채팅방·게임·산책·꾸미기를 로그인 없이 그대로 즐긴다. */
export function LazyAuth({ open, reason, onClose }: { open: boolean; reason: string; onClose: () => void }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setState('idle')
    setMessage('')
    const timer = window.setTimeout(() => input.current?.focus(), 120)
    return () => window.clearTimeout(timer)
  }, [open])

  async function submit() {
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setState('error')
      setMessage('이메일 주소를 한 번만 확인해 주세요.')
      return
    }
    setState('sending')
    const result = await sendLoginLink(value)
    if (result.ok) {
      setState('sent')
      setMessage('로그인 링크를 보냈어요. 메일함에서 링크를 누르면 이 화면으로 돌아와요.')
    } else {
      setState('error')
      setMessage(result.reason)
    }
  }

  if (!open) return null

  return (
    <div className="dd-lazy-veil" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="dd-lazy-card" role="dialog" aria-modal="true" aria-label="딩동 로그인">
        <button type="button" className="dd-lazy-x" aria-label="로그인 창 닫기" onClick={onClose}><X size={17} /></button>
        <span className="dd-lazy-bell" aria-hidden="true"><BellRing size={20} /></span>
        <h3>딩동에서 이어서 만나요</h3>
        <p className="dd-lazy-reason">{reason}</p>
        <form
          className="dd-lazy-form"
          noValidate
          aria-label="이메일 로그인"
          onSubmit={(e) => { e.preventDefault(); void submit() }}
        >
          <input
            ref={input}
            type="email"
            aria-label="이메일 주소"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (state === 'error' || state === 'sent') { setState('idle'); setMessage('') } }}
            disabled={state === 'sending' || state === 'sent'}
          />
          <button type="submit" className="dd-lazy-go" disabled={state === 'sending' || state === 'sent'}>
            {state === 'sending' ? '보내는 중…' : state === 'sent' ? '보냈어요' : '링크 받기'}
          </button>
        </form>
        {message && <p role={state === 'error' ? 'alert' : 'status'} className={'dd-lazy-msg' + (state === 'error' ? ' is-error' : '')}>{message}</p>}
        <small>비밀번호 없이, 이메일로 받은 링크만 누르면 시작돼요. 주소는 로그인에만 쓰여요.</small>
      </div>
    </div>
  )
}
