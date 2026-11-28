// 3단계(실제 커뮤니티) 대비: 채팅 저장·전송을 UI에서 분리하는 인터페이스.
// 지금은 localStorage 구현만 있고, 서버 백엔드가 정해지면 같은 인터페이스로 교체한다.
// 아직 DingdongSpaces는 이 모듈을 쓰지 않는다(연결은 백엔드 결정 후 별도 작업).

export interface TransportMessage {
  id: string
  topicId: string
  text: string
  at: string
  by?: string
  userId?: string
  /** 화면에 보여 줄 사진 주소(서버 메시지는 짧은 signed URL). */
  image?: string
  /** Storage 객체 경로. 서버 사진 메시지에서만 채워진다. */
  imagePath?: string
  imageThumbPath?: string
  imageWidth?: number
  imageHeight?: number
  place?: { name: string; url?: string }
  spoiler?: boolean
  /** 답장 대상 메시지 id(같은 방 메시지만). */
  replyTo?: string
}

export interface ChatTransport {
  /** 주제방의 최근 메시지를 오래된 순으로 돌려준다. */
  load(topicId: string, limit?: number): Promise<TransportMessage[]>
  /** 메시지를 보낸다. 서버 구현에서는 서버가 부여한 id·시각을 돌려준다. */
  send(message: Omit<TransportMessage, 'id' | 'at'>): Promise<TransportMessage>
  /** 새 메시지를 구독한다. 반환값은 구독 해제 함수. */
  subscribe(topicId: string, onMessage: (message: TransportMessage) => void): () => void
}

const KEY = 'dd.messages.v1'
const MAX_PER_TOPIC = 50

function readAll(): Record<string, TransportMessage[]> {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Record<string, TransportMessage[]>) : {}
  } catch {
    return {}
  }
}

function writeAll(all: Record<string, TransportMessage[]>) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    // 저장 공간 부족·시크릿 모드: 이번 세션에서는 저장하지 않고 넘어간다.
  }
}

/** 기기 안에서만 동작하는 구현. 다른 사용자와는 공유되지 않는다. */
export function createLocalTransport(): ChatTransport {
  const listeners = new Map<string, Set<(m: TransportMessage) => void>>()
  return {
    async load(topicId, limit = MAX_PER_TOPIC) {
      return (readAll()[topicId] ?? []).slice(-limit)
    },
    async send(message) {
      const saved: TransportMessage = { ...message, id: crypto.randomUUID(), at: new Date().toISOString() }
      const all = readAll()
      all[message.topicId] = [...(all[message.topicId] ?? []), saved].slice(-MAX_PER_TOPIC)
      writeAll(all)
      listeners.get(message.topicId)?.forEach((fn) => fn(saved))
      return saved
    },
    subscribe(topicId, onMessage) {
      const set = listeners.get(topicId) ?? new Set()
      set.add(onMessage)
      listeners.set(topicId, set)
      return () => {
        set.delete(onMessage)
      }
    },
  }
}
