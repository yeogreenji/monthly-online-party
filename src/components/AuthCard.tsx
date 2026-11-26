import { useState } from 'react'
import { sendLoginLink } from '../lib/supabase'
import type { ProfileSync } from '../lib/useAuth'

/** 서버 채팅을 쓰려면 필요한 이메일 링크 로그인 카드. 서버가 없으면 렌더링하지 않는다. */
export function AuthCard({ signedIn, sync, onEditProfile }: { signedIn: boolean; sync: ProfileSync; onEditProfile: () => void }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit() {
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setState('error')
      setMessage('이메일 주소를 확인해 주세요.')
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

  if (signedIn && sync === 'duplicate') {
    return (
      <div className="dd-auth-card" role="alert">
        <strong>이미 쓰고 있는 닉네임이에요</strong>
        <p>실제 이용자와 대화하려면 다른 닉네임이 필요해요.</p>
        <button className="dd3-btn" onClick={onEditProfile}>닉네임 바꾸기</button>
      </div>
    )
  }
  if (signedIn && sync === 'error') {
    return (
      <div className="dd-auth-card" role="alert">
        <strong>프로필을 서버에 저장하지 못했어요</strong>
        <p>닉네임 규칙(2~12자, 연락처·운영진 표현 불가)을 확인하고 프로필에서 다시 저장해 주세요.</p>
        <button className="dd3-btn" onClick={onEditProfile}>프로필 열기</button>
      </div>
    )
  }
  if (signedIn) return <div className="dd-auth-card" role="status"><small>서버에 연결하는 중이에요…</small></div>

  return (
    <form
      className="dd-auth-card"
      aria-label="이메일 로그인"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <strong>실제 이용자와 이야기하려면 로그인해 주세요</strong>
      <p>비밀번호 없이 이메일로 받은 링크만 누르면 돼요. 로그인 전에는 지금처럼 이 기기에서만 대화가 저장돼요.</p>
      <div className="dd-auth-row">
        <input
          type="email"
          aria-label="이메일 주소"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (state === 'error') setState('idle')
          }}
          disabled={state === 'sending' || state === 'sent'}
        />
        <button className="dd3-btn" disabled={state === 'sending' || state === 'sent'}>
          {state === 'sending' ? '보내는 중…' : state === 'sent' ? '보냈어요' : '로그인 링크 받기'}
        </button>
      </div>
      {message && <p role={state === 'error' ? 'alert' : 'status'}>{message}</p>}
      <small>메일 주소는 로그인에만 쓰이고 다른 이용자에게 보이지 않아요.</small>
    </form>
  )
}
