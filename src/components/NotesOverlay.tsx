import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, Lock, MessageCircle, Send, ShieldAlert, X } from 'lucide-react'
import type { NoteThread, NotesState, Peer, Profile } from '../types'
import { stamp } from '../lib/dates'
import { requestHostReply } from '../lib/chat'
import { Avatar } from './Avatar'
import { Modal } from './ui'

type Tab = 'incoming' | 'threads' | 'outgoing'

export function NotesOverlay({
  notes,
  profile,
  initialThreadId,
  onClose,
  onAccept,
  onDecline,
  onAppend,
  onReport,
  onToast,
}: {
  notes: NotesState
  profile: Profile
  initialThreadId?: string | null
  onClose: () => void
  onAccept: (id: string) => void
  onDecline: (id: string) => void
  onAppend: (threadId: string, message: { id: string; author: 'me' | 'peer'; text: string; at: string }) => void
  onReport: (peer: Peer) => void
  onToast: (text: string, tone?: 'default' | 'success') => void
}) {
  const [tab, setTab] = useState<Tab>(initialThreadId ? 'threads' : notes.incoming.some((item) => item.status === 'pending') ? 'incoming' : 'threads')
  const [selected, setSelected] = useState<string | null>(initialThreadId ?? notes.threads[0]?.id ?? null)
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [reportPeer, setReportPeer] = useState<Peer | null>(null)
  const [reportReason, setReportReason] = useState('성적 접근 · 원치 않는 연락')
  const [reportDetail, setReportDetail] = useState('')
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && document.body.dataset.modalOpen !== 'true') closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [])

  const thread: NoteThread | undefined = notes.threads.find((item) => item.id === selected)
  const pendingRequests = notes.incoming.filter((item) => item.status === 'pending')

  const accept = (id: string) => {
    onAccept(id)
    const created = notes.incoming.find((item) => item.id === id)
    onToast(`${created?.peer.nickname ?? '상대'}님과의 쪽지가 열렸어요. 이제 1:1로 이야기할 수 있습니다.`, 'success')
    setTab('threads')
    setSelected(`thread-${id}`)
  }

  const send = async () => {
    if (!thread || !draft.trim() || pending) return
    const text = draft.trim()
    setDraft('')
    onAppend(thread.id, { id: `n-${Date.now()}`, author: 'me', text, at: stamp() })
    setPending(true)
    const reply = await requestHostReply({
      mode: 'note',
      roomId: 'wine',
      roomName: '쪽지',
      roomTopic: '1:1 쪽지',
      host: thread.peer.nickname,
      profile: { nickname: profile.nickname, ageBand: profile.ageBand, tags: profile.tags },
      peer: { nickname: thread.peer.nickname, ageBand: thread.peer.ageBand, tags: thread.peer.tags, context: thread.peer.context },
      message: text,
      history: thread.messages.slice(-6).map((item) => ({
        role: item.author === 'me' ? ('me' as const) : ('guest' as const),
        name: item.author === 'me' ? profile.nickname : thread.peer.nickname,
        text: item.text,
      })),
    })
    onAppend(thread.id, { id: `np-${Date.now()}`, author: 'peer', text: reply.reply, at: stamp() })
    setPending(false)
  }

  const submitReport = () => {
    if (!reportPeer) return
    onReport(reportPeer)
    setReportPeer(null)
    setReportDetail('')
  }

  return (
    <div className="fixed inset-0 z-[65] flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-6" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="닫기">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="serif text-[14px]">쪽지함</p>
            <p className="mt-0.5 text-[9.5px]" style={{ color: 'var(--muted)' }}>서로 수락해야 열리는 1:1 대화</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="닫기">
          <X size={17} />
        </button>
      </header>

      <div className="grid min-h-0 flex-1 md:grid-cols-[300px_minmax(0,1fr)]">
        <aside className={`flex min-h-0 flex-col border-r ${thread && tab === 'threads' ? 'max-md:hidden' : ''}`} style={{ borderColor: 'var(--line)' }}>
          <div className="flex shrink-0 gap-1 border-b p-2" style={{ borderColor: 'var(--line)' }}>
            {([
              ['incoming', `받은 요청 ${pendingRequests.length > 0 ? pendingRequests.length : ''}`],
              ['threads', `대화 ${notes.threads.length}`],
              ['outgoing', `보낸 요청 ${notes.outgoing.filter((item) => item.status === 'pending').length}`],
            ] as [Tab, string][]).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setTab(id)
                  if (id !== 'threads') setSelected(null)
                }}
                className="flex-1 rounded px-2 py-1.5 text-[10.5px] transition-colors"
                style={{
                  background: tab === id ? 'var(--surface-2)' : 'transparent',
                  color: tab === id ? 'var(--ink)' : 'var(--muted)',
                  fontWeight: tab === id ? 600 : 400,
                }}
                aria-pressed={tab === id}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
            {tab === 'incoming' && (
              <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
                {pendingRequests.length === 0 && (
                  <p className="p-5 text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                    대기 중인 요청이 없어요. 방에서 마음이 닿은 사람에게 먼저 청해보세요.
                  </p>
                )}
                {pendingRequests.map((request) => (
                  <article key={request.id} className="p-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={request.peer.avatar} size={34} />
                      <div className="min-w-0">
                        <p className="truncate text-[12px]">{request.peer.nickname}</p>
                        <p className="truncate text-[9px]" style={{ color: 'var(--muted)' }}>{request.peer.context}</p>
                      </div>
                    </div>
                    <p className="mt-2.5 border-l pl-2.5 text-[11px] leading-[1.7]" style={{ borderColor: 'var(--gold)', color: 'var(--ink-soft)' }}>
                      {request.message}
                    </p>
                    <div className="mt-3 flex gap-1.5">
                      <button type="button" onClick={() => accept(request.id)} className="btn btn-primary btn-sm flex-1">수락</button>
                      <button type="button" onClick={() => onDecline(request.id)} className="btn btn-outline btn-sm">정중히 거절</button>
                    </div>
                  </article>
                ))}
                {notes.incoming.some((item) => item.status === 'declined') && (
                  <div className="p-4">
                    <p className="kicker text-[7.5px]">거절한 요청</p>
                    {notes.incoming
                      .filter((item) => item.status === 'declined')
                      .map((item) => (
                        <p key={item.id} className="mt-2 text-[10.5px]" style={{ color: 'var(--muted)' }}>
                          {item.peer.nickname} · 거절함
                        </p>
                      ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'threads' && (
              <div>
                {notes.threads.length === 0 && (
                  <p className="p-5 text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                    열린 대화가 없습니다. 받은 요청을 수락하면 여기에 대화가 생겨요.
                  </p>
                )}
                {notes.threads.map((item) => {
                  const last = item.messages[item.messages.length - 1]
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelected(item.id)}
                      className="flex w-full items-center gap-2.5 border-b px-4 py-3 text-left transition-colors hover:bg-black/[0.03]"
                      style={{ borderColor: 'var(--line)', background: selected === item.id ? 'var(--surface-2)' : 'transparent' }}
                    >
                      <Avatar name={item.peer.avatar} size={34} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[12px]">{item.peer.nickname}</span>
                          <span className="shrink-0 text-[9px]" style={{ color: 'var(--muted)' }}>{last?.at ?? ''}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-[10px]" style={{ color: 'var(--muted)' }}>{last?.text ?? '대화를 시작해보세요'}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

            {tab === 'outgoing' && (
              <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
                {notes.outgoing.length === 0 && (
                  <p className="p-5 text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                    보낸 요청이 없습니다. 방에서 참여자를 눌러 쪽지를 청할 수 있어요.
                  </p>
                )}
                {notes.outgoing.map((request) => (
                  <div key={request.id} className="p-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={request.peer.avatar} size={30} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11.5px]">{request.peer.nickname}</p>
                        <p className="truncate text-[9px]" style={{ color: 'var(--muted)' }}>{request.peer.context}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-[10.5px]" style={{ color: 'var(--muted)' }}>
                      {request.message}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-[9.5px]" style={{ color: 'var(--burgundy)' }}>
                      <Lock size={9} />
                      상대 응답 대기 · 수락하면 대화가 열립니다
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t p-3 text-[9.5px] leading-[1.7]" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
            연락처·SNS·주소는 주고받지 않아요. 요구하는 대화는 신고해 주세요.
          </div>
        </aside>

        <main className={`flex min-h-0 flex-col ${thread && tab === 'threads' ? '' : 'max-md:hidden'}`}>
          {!thread ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                <MessageCircle size={20} style={{ color: 'var(--gold)' }} />
              </span>
              <div>
                <p className="serif text-[17px]">쪽지는 서로의 허락으로 열립니다</p>
                <p className="mx-auto mt-2 max-w-sm text-[11px] leading-[1.8]" style={{ color: 'var(--muted)' }}>
                  방에서 대화를 나눈 뒤, 마음이 닿으면 쪽지를 청합니다. 상대가 수락해야 1:1 대화가 열리고, 언제든 거절할 수 있어요.
                </p>
              </div>
              <div className="grid w-full max-w-md grid-cols-3 gap-2">
                {[
                  ['01', '방에서 대화'],
                  ['02', '서로 수락'],
                  ['03', '1:1 쪽지'],
                ].map(([num, label]) => (
                  <div key={num} className="card-soft px-2 py-3">
                    <p className="serif text-[9px]" style={{ color: 'var(--gold)' }}>{num}</p>
                    <p className="mt-1 text-[10px]" style={{ color: 'var(--ink-soft)' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2.5 sm:px-6" style={{ borderColor: 'var(--line)' }}>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="btn btn-ghost btn-icon md:hidden"
                    aria-label="쪽지 목록으로"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <Avatar name={thread.peer.avatar} size={34} ring />
                  <div>
                    <p className="text-[12.5px]">{thread.peer.nickname}</p>
                    <p className="text-[9px]" style={{ color: 'var(--muted)' }}>{thread.peer.context}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setReportPeer(thread.peer)} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--muted)' }}>
                  <ShieldAlert size={11} />
                  신고
                </button>
              </div>

              <div className="shrink-0 border-b px-4 py-2 sm:px-6" style={{ borderColor: 'var(--line)', background: 'var(--surface-2)' }}>
                <p className="flex items-start gap-1.5 text-[9.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  <Check size={10} className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
                  서로 수락한 대화입니다. 연락처·계좌·주소 요구는 살롱 규칙 위반이며, 신고 시 대화가 닫힙니다.
                </p>
              </div>

              <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                <div className="mx-auto max-w-2xl space-y-3">
                  {thread.messages.map((message) => {
                    const mine = message.author === 'me'
                    return (
                      <div key={message.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                        {!mine && <Avatar name={thread.peer.avatar} size={28} />}
                        <div className={`max-w-[76%] ${mine ? 'text-right' : ''}`}>
                          <p className="text-[9px]" style={{ color: 'var(--muted)' }}>{mine ? '나' : thread.peer.nickname} · {message.at}</p>
                          <p
                            className="mt-1 inline-block px-3.5 py-2.5 text-left text-[12.5px] leading-[1.75]"
                            style={{
                              background: mine ? 'var(--forest)' : 'var(--surface)',
                              color: mine ? 'var(--forest-ink)' : 'var(--ink)',
                              border: mine ? '1px solid transparent' : '1px solid var(--line)',
                              borderRadius: mine ? '12px 12px 3px 12px' : '3px 12px 12px 12px',
                            }}
                          >
                            {message.text}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {pending && (
                    <div className="flex items-center gap-2">
                      <Avatar name={thread.peer.avatar} size={26} />
                      <span className="rounded-full border px-3 py-1.5 text-[9.5px]" style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}>
                        답장을 쓰는 중…
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 border-t px-4 py-2.5 sm:px-6" style={{ borderColor: 'var(--line)', background: 'var(--surface)' }}>
                <div className="mx-auto flex max-w-2xl items-center gap-1.5">
                  <input
                    className="input flex-1 !py-2"
                    placeholder={`${thread.peer.nickname}에게 답장`}
                    value={draft}
                    maxLength={300}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.nativeEvent.isComposing) void send()
                    }}
                    aria-label="쪽지 입력"
                  />
                  <button type="button" onClick={() => void send()} disabled={pending || !draft.trim()} className="btn btn-primary btn-icon" aria-label="보내기">
                    <Send size={15} />
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {reportPeer && (
        <Modal onClose={() => setReportPeer(null)} label="신고하기" size="sm">
          <div className="p-6">
            <p className="kicker">Report</p>
            <h3 className="serif mt-2 text-[20px]">{reportPeer.nickname}님 신고</h3>
            <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              신고 내용은 저장되어 운영 검토에 쓰입니다. 상대에게 알림이 가지 않아요.
            </p>
            <div className="mt-4 space-y-2">
              {['성적 접근 · 원치 않는 연락', '불쾌한 언행 · 비하', '광고 · 홍보 목적', '연락처 · 개인정보 요구', '기타'].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setReportReason(reason)}
                  className="flex items-center gap-2.5 text-[11.5px]"
                  style={{ color: 'var(--ink-soft)' }}
                  aria-pressed={reportReason === reason}
                >
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border" style={{ borderColor: reportReason === reason ? 'var(--burgundy)' : 'var(--line-strong)' }}>
                    {reportReason === reason && <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--burgundy)' }} />}
                  </span>
                  {reason}
                </button>
              ))}
            </div>
            <textarea className="textarea mt-3" rows={3} placeholder="상황을 적어주세요 (선택)" value={reportDetail} maxLength={300} onChange={(event) => setReportDetail(event.target.value)} />
            <button type="button" onClick={submitReport} className="btn btn-burgundy mt-4 w-full">신고 접수</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
