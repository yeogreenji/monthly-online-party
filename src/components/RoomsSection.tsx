import { ArrowUpRight, Users } from 'lucide-react'
import type { RoomId } from '../types'
import { ROOMS } from '../data/rooms'
import { SectionHead } from './ui'

const ROOM_IMAGES: Record<RoomId, string> = {
  wine: '/img/feed-wine.jpg',
  book: '/img/feed-book.jpg',
  cinema: '/img/feed-movie.jpg',
  music: '/img/feed-music.jpg',
}

const ROOM_TAG: Record<RoomId, string> = {
  wine: '성인 에티켓 · 논알콜 함께',
  book: '이번 주 책 한 권',
  cinema: '스포일러 토글',
  music: 'BGM 재생 · 신청곡',
}

export function RoomsSection({ onEnter }: { onEnter: (room: RoomId) => void }) {
  return (
    <section id="rooms" className="px-5 py-16 sm:px-8 sm:py-20" style={{ borderTop: '1px solid var(--line)', background: 'var(--bg-deep)' }}>
      <div className="mx-auto max-w-[1280px]">
        <SectionHead
          kicker="Four Rooms"
          title={
            <>
              파티가 없는 밤에도,{' '}
              <br className="hidden sm:block" />
              네 개의 방은 열려 있습니다
            </>
          }
          description="술을 마시지 않아도, 책을 다 읽지 않아도 들어올 수 있어요. 오늘 기분에 맞는 방 하나면 충분합니다."
          action={
            <div className="hidden items-center gap-2 text-[11px] md:flex" style={{ color: 'var(--muted)' }}>
              <span className="live-dot" />
              매일 21:00 – 24:00 · 프리뷰 오픈
            </div>
          }
        />

        <div className="grid gap-5 sm:grid-cols-2">
          {ROOMS.map((room, index) => (
            <article key={room.id} className="reveal group card overflow-hidden">
              <button
                type="button"
                onClick={() => onEnter(room.id)}
                className="grid w-full text-left sm:grid-cols-[0.9fr_1.1fr]"
                aria-label={`${room.name} 방 들어가기`}
              >
                <div className="relative min-h-[190px] overflow-hidden">
                  <img
                    src={ROOM_IMAGES[room.id]}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] tracking-[0.12em]" style={{ background: 'rgba(20,26,22,0.55)', color: '#F7F1E6', backdropFilter: 'blur(6px)' }}>
                    <span className="live-dot" style={{ background: '#E3C98F', width: 5, height: 5 }} />
                    {String(index + 1).padStart(2, '0')} · OPEN 21:00
                  </span>
                </div>

                <div className="flex flex-col justify-between gap-4 p-4.5 sm:p-5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="kicker text-[8px]">{room.en}</span>
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--muted)' }}>
                        <Users size={10} />
                        {room.live}명
                      </span>
                    </div>
                    <h3 className="serif mt-1.5 text-[17.5px] leading-snug">{room.name}</h3>
                    <p className="mt-1.5 text-[11.5px] leading-[1.7]" style={{ color: 'var(--muted)' }}>
                      {room.tagline}
                    </p>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border px-2 py-0.5 text-[9.5px]" style={{ borderColor: 'var(--line)', color: 'var(--ink-soft)' }}>
                        {ROOM_TAG[room.id]}
                      </span>
                      <span className="rounded-full border px-2 py-0.5 text-[9.5px]" style={{ borderColor: 'var(--line)', color: 'var(--ink-soft)' }}>
                        호스트 {room.host}
                      </span>
                    </div>
                    <span className="mt-3 flex items-center gap-1 text-[11px]" style={{ color: 'var(--ink)' }}>
                      방 들어가기
                      <ArrowUpRight size={12} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </button>
            </article>
          ))}
        </div>

        <p className="mt-6 text-[10.5px] leading-relaxed" style={{ color: 'var(--muted)' }}>
          오픈 전 프리뷰입니다. 방의 지난 대화는 살롱 스태프가 준비한 예시이고, 보내신 말에는 호스트가 답합니다. 쪽지는 서로 수락해야 열립니다.
        </p>
      </div>
    </section>
  )
}
