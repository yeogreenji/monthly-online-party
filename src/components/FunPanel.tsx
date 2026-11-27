import { useRef, useState } from 'react'
import { Camera, Download, ImagePlus, Music4, Ticket, Trash2, X } from 'lucide-react'
import type { Profile } from '../types'
import { usePersistentState } from '../lib/storage'
import { resizeImageFile } from '../lib/image'
import type { Memory } from './MemoryAlbum'
import { CHRISTMAS, dayEvent, monthlyFestival, seoulDate, seoulParts, weeklyPlan } from '../data/events365'

export interface FunTicket {
  id: string
  party: string
  date: string
  dataUrl: string
  at: string
}
export interface FutureLetter {
  id: string
  text: string
  deliverOn: string
  at: string
}
export interface Exhibit {
  id: string
  title: string
  image: string
  at: string
}
export interface FourCut {
  id: string
  dataUrl: string
  at: string
}

const ART = '모의 디자인 · 실제 입장권·상품이 아니에요.'

function drawTicket(party: string, date: string, nickname: string): string | null {
  const canvas = document.createElement('canvas')
  canvas.width = 720
  canvas.height = 280
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const g = ctx.createLinearGradient(0, 0, 720, 280)
  g.addColorStop(0, '#fff8e6')
  g.addColorStop(0.55, '#ffe6b8')
  g.addColorStop(1, '#f6cf8b')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 720, 280)
  ctx.strokeStyle = '#8b5c34'
  ctx.lineWidth = 8
  ctx.strokeRect(14, 14, 692, 252)
  ctx.fillStyle = '#8b5c34'
  ctx.font = '700 20px system-ui, sans-serif'
  ctx.fillText('DINGDONG · PARTY TICKET', 46, 66)
  ctx.fillStyle = '#3d2814'
  ctx.font = '900 44px system-ui, sans-serif'
  ctx.fillText(party.slice(0, 18), 46, 132)
  ctx.font = '600 24px system-ui, sans-serif'
  ctx.fillStyle = '#5a3c1e'
  ctx.fillText(date, 46, 178)
  ctx.fillText(`${nickname} 님`, 46, 214)
  ctx.font = '600 16px system-ui, sans-serif'
  ctx.fillStyle = '#7a5a30'
  ctx.fillText(ART, 46, 246)
  ctx.save()
  ctx.translate(612, 140)
  ctx.fillStyle = '#c98b3a'
  ctx.beginPath()
  ctx.arc(0, 0, 58, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#fff8e6'
  ctx.font = '900 30px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('딩동', 0, 11)
  ctx.restore()
  return canvas.toDataURL('image/png')
}

function drawFourCut(photos: string[], nickname: string): Promise<string | null> {
  const canvas = document.createElement('canvas')
  canvas.width = 420
  canvas.height = 4 * 300 + 90
  const ctx = canvas.getContext('2d')
  if (!ctx) return Promise.resolve(null)
  ctx.fillStyle = '#fffdf6'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#e4d3b6'
  ctx.lineWidth = 6
  ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6)
  const load = (src: string) =>
    new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = src
    })
  return Promise.all(photos.slice(0, 4).map(load)).then((images) => {
    images.forEach((img, i) => {
      const y = 24 + i * 300
      ctx.fillStyle = '#f2e7d2'
      ctx.fillRect(24, y, canvas.width - 48, 264)
      if (img) {
        const scale = Math.max((canvas.width - 48) / img.width, 264 / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.save()
        ctx.beginPath()
        ctx.rect(24, y, canvas.width - 48, 264)
        ctx.clip()
        ctx.drawImage(img, 24 + ((canvas.width - 48) - w) / 2, y + (264 - h) / 2, w, h)
        ctx.restore()
      }
    })
    ctx.fillStyle = '#6b4a1e'
    ctx.font = '600 18px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${nickname} · ${seoulDate()} · 딩동 네컷(모의)`, canvas.width / 2, canvas.height - 34)
    return canvas.toDataURL('image/jpeg', 0.85)
  })
}

export function FunPanel({
  profile,
  spaceName,
  memories,
  peers,
  doorOpen,
  silent,
  onDoorToggle,
  onSilentToggle,
  onCapture,
  onToast,
  onClose,
}: {
  profile: Profile
  spaceName: string
  memories: Memory[]
  peers: number
  doorOpen: boolean
  silent: boolean
  onDoorToggle: (next: boolean) => void
  onSilentToggle: (next: boolean) => void
  onCapture: () => string | null
  onToast: (text: string) => void
  onClose: () => void
}) {
  const [tickets, setTickets] = usePersistentState<FunTicket[]>('dd.tickets.v1', [])
  const [letters, setLetters] = usePersistentState<FutureLetter[]>('dd.letters.v1', [])
  const [exhibits, setExhibits] = usePersistentState<Exhibit[]>('dd.exhibition.v1', [])
  const [fourCuts, setFourCuts] = usePersistentState<FourCut[]>('dd.fourcuts.v1', [])
  const [photos, setPhotos] = useState<string[]>([])
  const [letterText, setLetterText] = useState('')
  const [letterDate, setLetterDate] = useState('')
  const [exhibitTitle, setExhibitTitle] = useState('')
  const [radioNote, setRadioNote] = usePersistentState<Record<string, string>>('dd.radio.v1', {})
  const captureRef = useRef<HTMLInputElement>(null)
  const exhibitRef = useRef<HTMLInputElement>(null)
  const exhibitTitleRef = useRef<HTMLInputElement>(null)

  const today = dayEvent()
  const monthly = monthlyFestival(today.month)
  const weekly = weeklyPlan(seoulParts().weekday)

  function makeTicket() {
    const party = today.title || `${spaceName}의 작은 파티`
    const dataUrl = drawTicket(party, `${today.month}월 ${today.day}일 · ${spaceName}`, profile.nickname)
    if (!dataUrl) {
      onToast('티켓을 만들지 못했어요.')
      return
    }
    setTickets((prev) => [{ id: crypto.randomUUID(), party, date: seoulDate(), dataUrl, at: new Date().toISOString() }, ...prev].slice(0, 6))
    onToast('파티 기념 티켓을 만들었어요. 내려받아 보관할 수 있어요.')
  }

  async function addFourCutPhoto(file: File) {
    try {
      const image = await resizeImageFile(file, 520, 0.8)
      setPhotos((prev) => [...prev, image].slice(0, 4))
    } catch {
      onToast('사진을 열지 못했어요.')
    }
  }

  function grabScene() {
    const image = onCapture()
    if (!image) {
      onToast('3D 화면 담기는 겨울 포토존에 도착한 뒤에 할 수 있어요. 지금은 사진을 골라 주세요.')
      return
    }
    setPhotos((prev) => [...prev, image].slice(0, 4))
  }

  async function saveFourCut() {
    if (photos.length < 4) {
      onToast('네 장을 채워 주세요. 지금은 ' + photos.length + '장이에요.')
      return
    }
    const dataUrl = await drawFourCut(photos, profile.nickname)
    if (!dataUrl) {
      onToast('네컷을 만들지 못했어요.')
      return
    }
    setFourCuts((prev) => [{ id: crypto.randomUUID(), dataUrl, at: new Date().toISOString() }, ...prev].slice(0, 4))
    setPhotos([])
    onToast('딩동 네컷을 완성했어요.')
  }

  async function addExhibit(file: File) {
    // 파일을 고른 직후에도 방금 입력한 이름을 읽도록 입력값을 직접 확인한다.
    const title = (exhibitTitleRef.current?.value ?? exhibitTitle).trim()
    if (!title) {
      onToast('전시할 작품 이름을 먼저 적어 주세요.')
      return
    }
    try {
      const image = await resizeImageFile(file, 760, 0.8)
      setExhibits((prev) => [{ id: crypto.randomUUID(), title: title.slice(0, 40), image, at: new Date().toISOString() }, ...prev].slice(0, 12))
      setExhibitTitle('')
      onToast('마을 작은 전시회에 작품을 걸었어요. 인기 순위는 매기지 않아요.')
    } catch {
      onToast('사진을 열지 못했어요.')
    }
  }

  function saveLetter() {
    if (!letterText.trim() || !letterDate) {
      onToast('편지 내용과 받을 날짜를 정해 주세요.')
      return
    }
    if (letterDate < seoulDate()) {
      onToast('오늘 이후 날짜를 골라 주세요.')
      return
    }
    setLetters((prev) => [{ id: crypto.randomUUID(), text: letterText.trim().slice(0, 600), deliverOn: letterDate, at: new Date().toISOString() }, ...prev].slice(0, 20))
    setLetterText('')
    onToast(`${letterDate}에 도착하는 미래 편지를 맡겼어요.`)
  }

  const boxes = new Map<string, Memory[]>()
  for (const memory of memories) {
    const key = (memory.date ?? '').slice(0, 7) || '기록 없음'
    boxes.set(key, [...(boxes.get(key) ?? []), memory])
  }

  return (
    <div className="dd-world-pop dd-fun-panel dd-craft-fun" role="dialog" aria-label="딩동 재미 요소 8종">
      <header className="dd-fun-head">
        <span className="dd-fun-kicker" aria-hidden="true">DINGDONG LITTLE JOYS</span>
        <h3>딩동의 작은 재미 8가지</h3>
        <p className="dd-fun-lead">마을에서 주워 온 소품들. 모두 이 기기에만 저장되고, 실제 상품·결제·순위는 없어요.</p>
        <button className="dd3-btn dd-fun-close" onClick={onClose}>닫기</button>
      </header>

      <div className="dd-fun-wall">
        <section className="dd-fun-card dd-prop dd-prop-door" data-fun="door">
          <span className="dd-prop-art" aria-hidden="true"><i /></span>
          <h4><em>01</em> 문 열어두기</h4>
          <p>{doorOpen ? '지금은 문을 열어 두었어요. 친구가 놀러 올 수 있어요.' : '문을 닫았어요. 혼자 조용히 쉬는 중이에요.'}</p>
          <button type="button" className="dd3-btn" aria-pressed={doorOpen} onClick={() => onDoorToggle(!doorOpen)}>
            {doorOpen ? '문 닫고 혼자 쉬기' : '문 열어두기(친구 공개)'}
          </button>
        </section>

        <section className="dd-fun-card dd-prop dd-prop-silent" data-fun="silent">
          <span className="dd-prop-art" aria-hidden="true"><i /></span>
          <h4><em>02</em> 말없이 함께 있기</h4>
          <p>채팅 없이 같은 공간에 머무는 시간이에요. 지금 이 공간에 {peers + 1}명이 있어요.</p>
          <button type="button" className="dd3-btn" aria-pressed={silent} onClick={() => onSilentToggle(!silent)}>
            {silent ? '말없이 함께 있는 중 · 그만두기' : '말없이 함께 있기'}
          </button>
        </section>

        <section className="dd-fun-card dd-prop dd-prop-ticket" data-fun="ticket">
          <span className="dd-ticket-stub" aria-hidden="true">DINGDONG · ADMIT ONE</span>
          <h4><em>03</em> 파티 기념 티켓</h4>
          <p>오늘의 파티 이름과 날짜로 티켓을 만들어 보관해요.</p>
          <button type="button" className="dd3-btn" onClick={makeTicket}><Ticket size={16}/> 티켓 만들기</button>
          <div className="dd-fun-thumbs">
            {tickets.map((t) => (
              <figure key={t.id}>
                <img src={t.dataUrl} alt={`${t.party} 기념 티켓`} />
                <figcaption>{t.party} · {t.date}</figcaption>
                <a href={t.dataUrl} download={`dingdong-ticket-${t.date}.png`}><Download size={14}/> 저장</a>
                <button type="button" aria-label="티켓 지우기" onClick={() => setTickets((prev) => prev.filter((x) => x.id !== t.id))}><Trash2 size={14}/></button>
              </figure>
            ))}
          </div>
        </section>

        <section className="dd-fun-card dd-prop dd-prop-fourcut" data-fun="fourcut">
          <h4><em>04</em> 딩동 네컷</h4>
          <p>네 장을 모아 한 장으로 붙여요. 함께 찍은 사진은 서로 동의한 것만 올려 주세요.</p>
          <div className="dd-fun-actions">
            <button type="button" className="dd3-btn" onClick={grabScene}><Camera size={16}/> 3D 화면 담기</button>
            <button type="button" className="dd3-btn" onClick={() => captureRef.current?.click()}><ImagePlus size={16}/> 사진 고르기</button>
            <input ref={captureRef} type="file" accept="image/*" hidden aria-label="네컷 사진 고르기" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void addFourCutPhoto(file) }} />
          </div>
          <div className="dd-fourcut-slots">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="dd-fourcut-slot">
                {photos[i] ? <img src={photos[i]} alt={`네컷 ${i + 1}번째 사진`} /> : <span>+</span>}
              </div>
            ))}
          </div>
          <button type="button" className="dd3-btn" onClick={() => void saveFourCut()}>네컷 완성하기</button>
          {fourCuts.map((cut) => (
            <figure key={cut.id} className="dd-fourcut-result">
              <img src={cut.dataUrl} alt="완성한 딩동 네컷" />
              <a href={cut.dataUrl} download={`dingdong-fourcut-${cut.at.slice(0, 10)}.jpg`}><Download size={14}/> 저장</a>
              <button type="button" aria-label="네컷 지우기" onClick={() => setFourCuts((prev) => prev.filter((x) => x.id !== cut.id))}><Trash2 size={14}/></button>
            </figure>
          ))}
        </section>

        <section className="dd-fun-card dd-prop dd-prop-radio" data-fun="radio">
          <span className="dd-radio-dial" aria-hidden="true"><i/><i/><i/></span>
          <h4><em>05</em> 딩동 라디오</h4>
          <p className="dd-radio-now"><Music4 size={15}/> 도레의 오늘 방송 · {today.title || '오늘의 작은 파티'}</p>
          <ul className="dd-radio-list">
            <li>오늘의 마을 행사: {today.title || '—'} ({today.space})</li>
            <li>이번 달 축제: {monthly?.title ?? '—'} · {monthly?.events.slice(0, 3).join(', ') ?? ''}</li>
            <li>요일 편성: {weekly.day} 낮 {weekly.daytime} / 저녁 {weekly.evening}</li>
            <li>{today.month === 12 ? `12월 편성: ${CHRISTMAS.schedule[0].program}` : '공식 음악 링크는 연결 전이라 주제와 사연만 소개해요.'}</li>
          </ul>
          <label className="dd-fun-field">
            <span>오늘의 사연</span>
            <textarea maxLength={200} value={radioNote[seoulDate()] ?? ''} onChange={(e) => setRadioNote((prev) => ({ ...prev, [seoulDate()]: e.target.value }))} aria-label="라디오 사연" />
          </label>
          <small>사연은 이 기기에만 저장돼요. 실제 방송·심사는 없어요.</small>
        </section>

        <section className="dd-fun-card dd-prop dd-prop-letter" data-fun="letter">
          <span className="dd-letter-stamp" aria-hidden="true">딩동<br/>우표</span>
          <h4><em>06</em> 미래의 나에게 보내는 편지</h4>
          <label className="dd-fun-field"><span>편지</span><textarea maxLength={600} value={letterText} onChange={(e) => setLetterText(e.target.value)} aria-label="미래 편지 내용" /></label>
          <label className="dd-fun-field"><span>받을 날짜</span><input type="date" value={letterDate} min={seoulDate()} onChange={(e) => setLetterDate(e.target.value)} aria-label="미래 편지 받을 날짜" /></label>
          <button type="button" className="dd3-btn" onClick={saveLetter}>편지 맡기기</button>
          <ul className="dd-letter-list">
            {letters.map((letter) => {
              const arrived = letter.deliverOn <= seoulDate()
              return (
                <li key={letter.id} data-arrived={arrived ? 'true' : 'false'}>
                  <strong>{arrived ? '도착한 편지' : '배달 예정'} · {letter.deliverOn}</strong>
                  {arrived ? <p>{letter.text}</p> : <p>아직 봉투를 열 수 없어요. {letter.deliverOn}에 다시 열어 보세요.</p>}
                  <button type="button" aria-label="편지 지우기" onClick={() => setLetters((prev) => prev.filter((x) => x.id !== letter.id))}><Trash2 size={14}/></button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="dd-fun-card dd-prop dd-prop-box" data-fun="memorybox">
          <span className="dd-box-lid" aria-hidden="true" />
          <h4><em>07</em> 우리들의 추억 상자</h4>
          <p>남긴 기록을 월별로 모아 봐요. 사진 {memories.reduce((n, m) => n + m.photos.length, 0)}장 · 기록 {memories.length}개 · 티켓 {tickets.length}장 · 편지 {letters.length}통</p>
          <div className="dd-memory-months">
            {[...boxes.entries()].slice(0, 6).map(([month, list]) => (
              <div key={month}>
                <strong>{month}</strong>
                <small>{list.length}개 기록 · 사진 {list.reduce((n, m) => n + m.photos.length, 0)}장</small>
                {list.flatMap((m) => m.photos.slice(0, 1)).slice(0, 3).map((photo, i) => <img key={i} src={photo} alt={`${month} 추억 사진`} />)}
              </div>
            ))}
            {memories.length === 0 && <p>아직 모은 기록이 없어요. 모임에서 사진첩에 저장해 보세요.</p>}
          </div>
        </section>

        <section className="dd-fun-card dd-prop dd-prop-frame" data-fun="exhibit">
          <h4><em>08</em> 마을 작은 전시회</h4>
          <p>그림·반려동물 사진·미니룸을 자발적으로 걸어 두는 곳이에요. 인기 순위는 없어요.</p>
          <label className="dd-fun-field"><span>작품 이름</span><input ref={exhibitTitleRef} maxLength={40} value={exhibitTitle} onChange={(e) => setExhibitTitle(e.target.value)} aria-label="전시 작품 이름" /></label>
          <button type="button" className="dd3-btn" onClick={() => exhibitRef.current?.click()}><ImagePlus size={16}/> 작품 올리기</button>
          <input ref={exhibitRef} type="file" accept="image/*" hidden aria-label="전시 작품 사진" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void addExhibit(file) }} />
          <div className="dd-exhibit-grid">
            {exhibits.map((item) => (
              <figure key={item.id}>
                <img src={item.image} alt={`${item.title} 전시 작품`} />
                <figcaption>{item.title}</figcaption>
                <button type="button" aria-label={`${item.title} 내리기`} onClick={() => setExhibits((prev) => prev.filter((x) => x.id !== item.id))}><X size={14}/></button>
              </figure>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
