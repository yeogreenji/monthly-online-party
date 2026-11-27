import { useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Look } from '../data/avatarLook'

/**
 * 딩동 실시간 접속(Presence + Broadcast).
 * - Presence: 이 공간에 누가 접속해 있고 어느 모임(topic)에 들어가 있는지. 참여 인원 집계의 기준이다.
 *   Supabase presence rate limit이 낮아서 접속/모임 이동 때만 보낸다.
 * - Broadcast 'pos': 캐릭터의 위치·자세. 0.6초 간격으로 보내고 상태(state)가 아니라 ref에 담아
 *   3D 화면이 매 프레임 읽는다(사람이 많아도 React 렌더가 폭주하지 않게).
 * - Broadcast 'bubble': 최근 채팅 말풍선.
 * 로그인하지 않았거나 서버가 설정되지 않으면 아무것도 하지 않고 화면은 기존 로컬 체험으로 동작한다.
 */

export type PresencePose = 'standing' | 'seated' | 'lying'

export type PresenceSelf = {
  id: string
  nickname: string
  avatar: string
  look: Look | null
  space: string
  topicId: string | null
}

export type PresencePeer = PresenceSelf & { bubble?: string; bubbleAt?: number }
export type PeerPosition = { x: number; z: number; pose: PresencePose }

export type PresenceHandlers = {
  onBubble?: (peerId: string, text: string) => void
}

type SelfBase = {
  id: string
  nickname: string
  avatar: string
  look: Look | null
  space: string
}

const TRACK_MIN_GAP = 4000
const POS_MS = 600
const POS_MIN_GAP = 400

export function useSpacePresence(
  base: SelfBase | null,
  topicId: string | null,
  getPose: () => { x: number; z: number; pose: PresencePose },
  handlers: PresenceHandlers = {},
): { peers: PresencePeer[]; positions: { current: Map<string, PeerPosition> }; bubble: (text: string) => void; connected: boolean } {
  const [peers, setPeersRaw] = useState<PresencePeer[]>([])
  const [connected, setConnected] = useState(false)
  const peersRef = useRef<PresencePeer[]>([])
  const positions = useRef<Map<string, PeerPosition>>(new Map())
  const channelRef = useRef<RealtimeChannel | null>(null)
  const bubbleRef = useRef<(text: string) => void>(() => {})
  const onBubbleRef = useRef(handlers.onBubble)
  onBubbleRef.current = handlers.onBubble
  const baseRef = useRef(base)
  baseRef.current = base
  const topicRef = useRef(topicId)
  topicRef.current = topicId
  const poseRef = useRef(getPose)
  poseRef.current = getPose
  const lookKey = JSON.stringify(base?.look ?? null)

  const spaceId = base?.space ?? null
  const userId = base?.id ?? null

  const setPeers = (next: PresencePeer[]) => {
    peersRef.current = next
    setPeersRaw(next)
  }

  useEffect(() => {
    if (!supabase || !spaceId || !userId) {
      setPeers([])
      positions.current.clear()
      setConnected(false)
      bubbleRef.current = () => {}
      return
    }
    const client = supabase
    const channel = client.channel(`dd-space:${spaceId}`, { config: { presence: { key: userId } } })
    channelRef.current = channel
    let alive = true

    const presencePayload = (): PresenceSelf | null => {
      const b = baseRef.current
      if (!b) return null
      return { id: b.id, nickname: b.nickname.slice(0, 12), avatar: b.avatar, look: b.look, space: b.space, topicId: topicRef.current }
    }

    let lastTrack = 0
    const trackNow = () => {
      const p = presencePayload()
      lastTrack = Date.now()
      if (p && alive) void channel.track(p)
    }
    /** presence는 접속·모임 이동 때만. 서버 rate limit 때문에 최소 4초 간격을 둔다. */
    const track = () => {
      if (Date.now() - lastTrack >= TRACK_MIN_GAP) trackNow()
    }

    let lastPos = 0
    const sendPos = (force = false) => {
      if (!alive) return
      const now = Date.now()
      if (!force && now - lastPos < POS_MIN_GAP) return
      lastPos = now
      const p = poseRef.current()
      const b = baseRef.current
      if (!b) return
      void channel.send({
        type: 'broadcast',
        event: 'pos',
        payload: { id: userId, x: Math.round(p.x * 100) / 100, z: Math.round(p.z * 100) / 100, pose: p.pose },
      })
    }

    const readState = () => {
      if (!alive) return
      const state = channel.presenceState() as Record<string, unknown[]>
      const list: PresencePeer[] = []
      for (const entries of Object.values(state)) {
        for (const raw of entries) {
          const p = raw as unknown as PresenceSelf
          if (!p || !p.id || p.id === userId) continue
          if (list.some((x) => x.id === p.id)) continue
          const old = peersRef.current.find((x) => x.id === p.id)
          list.push(old?.bubble ? { ...p, bubble: old.bubble, bubbleAt: old.bubbleAt } : { ...p })
        }
      }
      setPeers(list)
      for (const id of [...positions.current.keys()]) if (!list.some((p) => p.id === id)) positions.current.delete(id)
    }

    channel
      .on('presence', { event: 'sync' }, readState)
      .on('presence', { event: 'join' }, readState)
      .on('presence', { event: 'leave' }, readState)
      .on('broadcast', { event: 'pos' }, (msg) => {
        const p = msg.payload as { id?: string; x?: number; z?: number; pose?: PresencePose }
        if (!p?.id || p.id === userId) return
        if (typeof p.x !== 'number' || typeof p.z !== 'number') return
        positions.current.set(p.id, { x: p.x, z: p.z, pose: p.pose ?? 'standing' })
      })
      .on('broadcast', { event: 'bubble' }, (msg) => {
        const p = msg.payload as { id?: string; text?: string }
        if (!p?.id || !p.text || p.id === userId) return
        const text = String(p.text).slice(0, 60)
        setPeers(peersRef.current.map((x) => (x.id === p.id ? { ...x, bubble: text, bubbleAt: Date.now() } : x)))
        onBubbleRef.current?.(p.id, text)
      })
      .on('broadcast', { event: 'hello' }, (msg) => {
        const p = msg.payload as { id?: string }
        if (!p?.id || p.id === userId) return
        track() // 새로 온 사람에게 내 접속 정보를 다시 알린다(4초 스로틀)
        sendPos(true)
      })
      .subscribe((status) => {
        if (!alive) return
        const ok = status === 'SUBSCRIBED'
        setConnected(ok)
        if (ok) {
          trackNow()
          sendPos(true)
          void channel.send({ type: 'broadcast', event: 'hello', payload: { id: userId } })
        }
      })

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') sendPos()
    }, POS_MS)

    bubbleRef.current = (text: string) => {
      const clean = String(text || '').trim().slice(0, 60)
      if (!clean || !alive) return
      void channel.send({ type: 'broadcast', event: 'bubble', payload: { id: userId, text: clean, at: Date.now() } })
    }

    return () => {
      alive = false
      window.clearInterval(timer)
      setConnected(false)
      setPeers([])
      positions.current.clear()
      channelRef.current = null
      bubbleRef.current = () => {}
      void client.removeChannel(channel)
    }
  }, [spaceId, userId])

  // 모임(방)을 옮기면 인원 집계가 바로 맞도록 알린다(look은 매 렌더 새 객체라 문자열로 비교).
  useEffect(() => {
    const channel = channelRef.current
    if (!channel || !baseRef.current) return
    const p = presencePayloadOf(baseRef.current, topicRef.current)
    if (p) void channel.track(p)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, base?.nickname, base?.avatar, lookKey])

  return { peers, positions, bubble: (text: string) => bubbleRef.current(text), connected }
}

function presencePayloadOf(b: SelfBase, topicId: string | null): PresenceSelf {
  return { id: b.id, nickname: b.nickname.slice(0, 12), avatar: b.avatar, look: b.look, space: b.space, topicId }
}

/** 같은 모임(방)에 있는 사람 수. 나를 포함한다. */
export function countInRoom(peers: PresencePeer[], topicId: string | null): number {
  if (!topicId) return 0
  return 1 + peers.filter((p) => p.topicId === topicId).length
}
