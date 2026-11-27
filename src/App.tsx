import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ChatMessage, Coupon, FeedComment, FeedPost, Inquiry, NoteRequest, NotesState, PartyEvent, Peer, Profile, RoomId } from './types'
import { PARTIES } from './data/themes'
import { ROOMS } from './data/rooms'
import { SEED_FEED } from './data/feed'
import { SEED_NOTES } from './data/media'
import { STORAGE_KEYS, loadJSON, saveJSON, usePersistentState } from './lib/storage'
import { buildICS, downloadText } from './lib/dates'
import { Header } from './components/Header'
import type { SalonView } from './components/Header'
import { Hero } from './components/Hero'
import { Program } from './components/Program'
import { DingdongSpaces } from './components/DingdongSpaces'
import { DINGDONG_STORAGE } from './data/dingdong'
import { PhotoWall } from './components/PhotoWall'
import { SponsorsSection } from './components/SponsorsSection'
import { CalendarSection } from './components/CalendarSection'
import { TownCalendar } from './components/TownCalendar'
import { EtiquetteSection, Footer } from './components/Footer'
import { MediaKit } from './components/MediaKit'
import { Onboarding } from './components/Onboarding'
import { RoomOverlay } from './components/RoomOverlay'
import { NotesOverlay } from './components/NotesOverlay'
import { ToastStack, useReveal } from './components/ui'

const COMMERCIAL_PREVIEW = false
const SECTION_IDS = ['rooms', 'party', 'program', 'wall', 'calendar', 'brand', 'etiquette']

function initialChats(): Record<RoomId, ChatMessage[]> {
  return {
    wine: [...ROOMS[0].messages],
    book: [...ROOMS[1].messages],
    cinema: [...ROOMS[2].messages],
    music: [...ROOMS[3].messages],
  }
}

export default function App() {
  const [profile, setProfile] = usePersistentState<Profile | null>(STORAGE_KEYS.profile, null)
  const [night, setNight] = usePersistentState<boolean>(STORAGE_KEYS.night, false)
  const [monthId, setMonthId] = usePersistentState<string>(STORAGE_KEYS.month, 'dec')
  const [rsvps, setRsvps] = usePersistentState<Record<string, boolean>>(STORAGE_KEYS.rsvp, {})
  const [alarms, setAlarms] = usePersistentState<Record<string, boolean>>(STORAGE_KEYS.alarms, {})
  const [feed, setFeed] = usePersistentState<FeedPost[]>(STORAGE_KEYS.feed, SEED_FEED)
  const [notes, setNotes] = usePersistentState<NotesState>(STORAGE_KEYS.notes, SEED_NOTES)
  const [coupons, setCoupons] = usePersistentState<Coupon[]>(STORAGE_KEYS.coupons, [])
  const [chats, setChats] = usePersistentState<Record<RoomId, ChatMessage[]>>('ms.chats.v1', initialChats())

  const [panelOpen,setPanelOpen]=useState(false)
  const [view, setView] = useState<SalonView>('home')
  const [section, setSection] = useState('rooms')
  const [editing, setEditing] = useState(false)
  const [roomId, setRoomId] = useState<RoomId | null>(null)
  const [notesOpen, setNotesOpen] = useState(false)
  const [threadTarget, setThreadTarget] = useState<string | null>(null)
  const [toasts, setToasts] = useState<{ id: number; text: string; tone?: 'default' | 'success' }[]>([])
  const [now, setNow] = useState(() => Date.now())
  const toastId = useRef(0)

  const party = PARTIES.find((item) => item.id === monthId) ?? PARTIES[0]

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useReveal(view)

  useEffect(() => {
    document.documentElement.dataset.theme = night ? 'night' : 'day'
  }, [night])

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    const frame = window.requestAnimationFrame(() => window.scrollTo(0, 0))
    return () => window.cancelAnimationFrame(frame)
  }, [view])

  useEffect(() => {
    if (view !== 'home'||section!=='legacy') return
    const nodes = SECTION_IDS.map((id) => document.getElementById(id)).filter((node): node is HTMLElement => Boolean(node))
    if (nodes.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setSection(entry.target.id)
        })
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0 },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [view,section])

  const toast = useCallback((text: string, tone: 'default' | 'success' = 'default') => {
    toastId.current += 1
    const id = toastId.current
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }])
    window.setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), 3400)
  }, [])

  const navigate = (target: string) => {
    if(target==='rooms'||target==='top'){setPanelOpen(false);setView('home');return}
    setPanelOpen(true)
    if (target === 'top') {
      setView('home')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (!COMMERCIAL_PREVIEW && (target === 'sponsor-zone' || target === 'brand')) return
    if (target === 'sponsor-zone') {
      setView('home')
      setSection('brand')
      window.setTimeout(() => {
        document.getElementById('brand')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 60)
      return
    }
    if (target === 'brand') {
      setView('mediakit')
      window.scrollTo({ top: 0, behavior: 'auto' })
      return
    }
    setView('home')
    setSection(target)
    window.setTimeout(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)
  }

  const saveProfile = (next: Profile) => {
    setProfile(next)
    setEditing(false)
  }

  const resetProfile = () => {
    [...Object.values(STORAGE_KEYS), ...DINGDONG_STORAGE].forEach((key) => {
      try {
        window.localStorage.removeItem(key)
      } catch {
        // 저장소를 지우지 못해도 화면은 초기 상태로 돌아갑니다
      }
    })
    try {
      window.localStorage.removeItem('ms.chats.v1')
      window.localStorage.removeItem('ms.reports.v1')
    } catch {
      // 무시
    }
    setProfile(null)
    setPanelOpen(false)
    setEditing(false)
    setFeed(SEED_FEED)
    setNotes(SEED_NOTES)
    setCoupons([])
    setChats(initialChats())
    setRsvps({})
    setAlarms({})
    setRoomId(null)
    setNotesOpen(false)
    toast('이 브라우저의 프로필과 활동 기록을 지웠어요.')
  }

  const toggleRsvp = (id: string) => {
    const target = PARTIES.find((item) => item.id === id)
    setRsvps((prev) => ({ ...prev, [id]: !prev[id] }))
    if (target) {
      toast(
        rsvps[id]
          ? '초대장 예약을 취소했어요.'
          : `${target.dateLabel} ${target.weekday} 파티 초대장을 예약했어요. 당일 입장 화면에서 먼저 보여드릴게요.`,
        rsvps[id] ? 'default' : 'success',
      )
    }
  }

  const downloadParty = (target: PartyEvent) => {
    const ics = buildICS({
      id: `dingdong-${target.id}`,
      title: `딩동 · ${target.title}`,
      dateISO: target.dateISO,
      durationHours: 3,
      description: `${target.subtitle}\n${target.timeLabel} · ${target.place}\n${target.program.map((item) => `${item.time} ${item.title}`).join(' / ')}`,
      location: '온라인 · 딩동',
    })
    downloadText(`dingdong-${target.id}.ics`, ics)
    toast('캘린더 파일을 내려받았어요. 열어서 일정에 추가해 주세요.', 'success')
  }

  const toggleAlarm = (eventId: string) => {
    setAlarms((prev) => ({ ...prev, [eventId]: !prev[eventId] }))
    toast(alarms[eventId] ? '알림 신청을 해제했어요.' : '알림을 신청했어요. 이 브라우저에 저장됩니다.')
  }

  const openRoom = (_id: RoomId) => {
    toast('기존 취향방은 1단계 체험에서 준비중입니다. 혼술 라운지는 안전 확인 전 잠금입니다.')
  }

  const appendChat = (id: RoomId, message: ChatMessage) => {
    setChats((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), message] }))
  }

  const publishPost = (post: FeedPost) => {
    const next = [post, ...feed]
    if (!saveJSON(STORAGE_KEYS.feed, next)) {
      toast('사진 용량이 커서 이번 화면에만 게시됩니다. 더 작은 사진을 쓰면 저장돼요.')
    }
    setFeed(next)
  }

  const likePost = (id: string) => {
    setFeed((prev) =>
      prev.map((post) => (post.id === id ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) } : post)),
    )
  }

  const commentPost = (id: string, comment: FeedComment) => {
    setFeed((prev) => prev.map((post) => (post.id === id ? { ...post, comments: [...post.comments, comment] } : post)))
    toast('댓글을 남겼어요.', 'success')
  }

  const removePost = (id: string) => {
    if (!window.confirm('내가 올린 사진을 포토월에서 지울까요?')) return
    setFeed((prev) => prev.filter((post) => post.id !== id))
    toast('사진을 지웠어요.')
  }

  const requestNote = (peer: Peer, message: string) => {
    const request: NoteRequest = {
      id: `out-${Date.now()}`,
      peer,
      message,
      at: new Date().toISOString(),
      status: 'pending',
    }
    setNotes((prev) => ({ ...prev, outgoing: [request, ...prev.outgoing] }))
    toast(`${peer.nickname}님에게 쪽지 요청을 보냈어요. 수락하면 대화가 열립니다.`, 'success')
  }

  const acceptNote = (id: string) => {
    setNotes((prev) => {
      const request = prev.incoming.find((item) => item.id === id)
      if (!request) return prev
      const threadId = `thread-${id}`
      return {
        ...prev,
        incoming: prev.incoming.map((item) => (item.id === id ? { ...item, status: 'accepted' as const } : item)),
        threads: prev.threads.some((thread) => thread.id === threadId)
          ? prev.threads
          : [
              {
                id: threadId,
                peer: request.peer,
                messages: [{ id: `seed-${id}`, author: 'peer' as const, text: request.message, at: request.at.slice(11, 16) }],
              },
              ...prev.threads,
            ],
      }
    })
    setThreadTarget(`thread-${id}`)
  }

  const declineNote = (id: string) => {
    setNotes((prev) => ({
      ...prev,
      incoming: prev.incoming.map((item) => (item.id === id ? { ...item, status: 'declined' as const } : item)),
    }))
    toast('요청을 정중히 거절했어요. 상대에게는 별도 알림이 가지 않습니다.')
  }

  const appendThread = (threadId: string, message: { id: string; author: 'me' | 'peer'; text: string; at: string }) => {
    setNotes((prev) => ({
      ...prev,
      threads: prev.threads.map((thread) =>
        thread.id === threadId ? { ...thread, messages: [...thread.messages, message] } : thread,
      ),
    }))
  }

  const reportPeer = (target: string, reason: string, detail: string) => {
    const existing = loadJSON<{ id: string; target: string; reason: string; detail: string; at: string }[]>('ms.reports.v1', [])
    saveJSON('ms.reports.v1', [...existing, { id: `report-${Date.now()}`, target, reason, detail, at: new Date().toISOString() }])
    toast('신고 체험 기록을 이 브라우저에 저장했어요. 운영자에게 전송되지는 않습니다.', 'success')
  }

  const issueCoupon = (coupon: Coupon) => {
    setCoupons((prev) => (prev.some((item) => item.code === coupon.code) ? prev : [coupon, ...prev].slice(0, 12)))
  }

  const openNotes = (threadId: string | null = null) => {
    setThreadTarget(threadId)
    setNotesOpen(true)
  }

    useEffect(() => {
    if (!panelOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPanelOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panelOpen])

const pendingNotes = notes.incoming.filter((item) => item.status === 'pending').length

  return (
    <div className="dd-app-root" style={{ background: 'var(--bg)' }}>
      {profile&&!editing&&<DingdongSpaces profile={profile} key={profile.joinedAt} onLegacy={openRoom} onParty={()=>navigate('party')} onEditProfile={()=>setEditing(true)} onMenu={navigate}/>}
      {profile&&panelOpen&&<div className="dd-app-panel" role="dialog" aria-label="딩동 안내 메뉴" onClick={e=>{if(e.target===e.currentTarget)setPanelOpen(false)}}><button className="dd-app-panel-close" type="button" onClick={()=>setPanelOpen(false)}>× 마을로 돌아가기</button>
      {section==='calendar'?<TownCalendar parties={PARTIES} rsvps={rsvps} alarms={alarms} onRsvp={toggleRsvp} onAlarm={toggleAlarm} onDownload={downloadParty} onParty={id=>{setMonthId(id);setSection('party')}}/>:section==='party'||section==='program'?<div className="dd-party-pop"><div className="dd-calendar-cover"><div><small>PARTY INVITATION</small><h2>{party.title}</h2><p>{party.dateLabel} · {party.timeLabel}</p></div></div><p>{party.subtitle}</p><div className="dd-cal-actions"><button onClick={()=>toggleRsvp(party.id)}>{rsvps[party.id]?'예약 취소':'초대장 예약'}</button><button onClick={()=>downloadParty(party)}>일정 저장</button><button onClick={()=>setSection('calendar')}>달력</button></div>{party.program.map(p=><div className="dd-cal-event" key={p.time}><strong>{p.time}</strong><div><h3>{p.title}</h3><p>{p.detail}</p></div></div>)}</div>:section==='wall'?<PhotoWall feed={feed} profile={profile} onPublish={publishPost} onLike={likePost} onComment={commentPost} onRemove={removePost} onToast={toast}/>:section==='etiquette'?<div className="dd-party-pop"><h2>딩동 마을 안내</h2><p>바닥을 누르거나 방향키로 골목을 돌아다니세요. 가게의 문과 안내판을 눌러 방문할 수 있어요.</p><p>성인용 로컬 개발 체험판이며 실제 친구·채팅·연령 확인은 연결되지 않았습니다.</p><EtiquetteSection/></div>:<>
      <Header
        view={view}
        section={section}
        profile={profile ?? { nickname: '손님', avatar: 'fox', ageBand: '비공개', tags: [], joinedAt: '' }}
        night={night}
        notesCount={pendingNotes}
        onNavigate={navigate}
        onEditProfile={() => setEditing(true)}
        onToggleNight={() => setNight((prev) => !prev)}
        onOpenNotes={() => toast('친구·쪽지는 마을의 친구 버튼에서 이용할 수 있어요. 서로 수락한 친구와만 대화가 열립니다.')}
      />

      {(view === 'home' || !COMMERCIAL_PREVIEW) ? (
        <main>

          <Hero
            party={party}
            now={now}
            profile={profile ?? { nickname: '손님', avatar: 'fox', ageBand: '비공개', tags: [], joinedAt: '' }}
            rsvp={Boolean(rsvps[party.id])}
            onMonthChange={(id) => setMonthId(id)}
            onRsvp={() => toggleRsvp(party.id)}
            onDownload={() => downloadParty(party)}
            onExploreRooms={() => navigate('rooms')}
            onBrandKit={() => setView('mediakit')}
            showCommercial={COMMERCIAL_PREVIEW}
          />
          <Program party={party} />
          <PhotoWall
            feed={feed}
            profile={profile ?? { nickname: '손님', avatar: 'fox', ageBand: '비공개', tags: [], joinedAt: '' }}
            onPublish={publishPost}
            onLike={likePost}
            onComment={commentPost}
            onRemove={removePost}
            onToast={toast}
          />
          <CalendarSection
            parties={PARTIES}
            now={now}
            rsvps={rsvps}
            alarms={alarms}
            onToggleAlarm={toggleAlarm}
            onRsvp={toggleRsvp}
            onDownload={downloadParty}
            onSelectParty={(id) => {
              setMonthId(id)
              window.setTimeout(() => document.getElementById('party')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
              toast('메인 파티 화면으로 이동했어요.')
            }}
          />
          {COMMERCIAL_PREVIEW && <SponsorsSection
            party={party}
            coupons={coupons}
            onIssue={issueCoupon}
            onOpenKit={() => {
              setView('mediakit')
              window.scrollTo({ top: 0 })
            }}
            onToast={toast}
          />}
          <EtiquetteSection />
        </main>
      ) : (
        <main>
          <MediaKit
            onBack={() => {
              setView('home')
              window.setTimeout(() => document.getElementById('party')?.scrollIntoView({ behavior: 'smooth' }), 80)
            }}
            onInquiry={(inquiry: Inquiry) => {
              const existing = loadJSON<Inquiry[]>(STORAGE_KEYS.inquiries, [])
              saveJSON(STORAGE_KEYS.inquiries, [inquiry, ...existing].slice(0, 20))
            }}
            onToast={toast}
          />
        </main>
      )}

      <Footer
        showCommercial={COMMERCIAL_PREVIEW}
        onBrandKit={() => {
          setView('mediakit')
          window.scrollTo({ top: 0 })
        }}
        onNavigate={navigate}
      />

      </>}
      </div>}
      {roomId && profile && (
        <RoomOverlay
          roomId={roomId}
          party={party}
          profile={profile}
          messages={chats[roomId] ?? []}
          onAppend={appendChat}
          onClose={() => setRoomId(null)}
          onSwitchRoom={openRoom}
          onRequestNote={requestNote}
          onReport={reportPeer}
          onOpenNotes={() => openNotes()}
          onToast={toast}
          notesCount={pendingNotes}
        />
      )}

      {notesOpen && profile && (
        <NotesOverlay
          notes={notes}
          profile={profile}
          initialThreadId={threadTarget}
          onClose={() => {
            setNotesOpen(false)
            setThreadTarget(null)
          }}
          onAccept={acceptNote}
          onDecline={declineNote}
          onAppend={appendThread}
          onReport={(peer) => reportPeer(peer.nickname, '쪽지 대화 신고', peer.context)}
          onToast={toast}
        />
      )}

      {(!profile || editing) && (
        <Onboarding
          initial={profile}
          editMode={Boolean(profile)}
          onSave={saveProfile}
          onClose={() => setEditing(false)}
          onReset={resetProfile}
        />
      )}

      <ToastStack toasts={toasts} />
    </div>
  )
}
