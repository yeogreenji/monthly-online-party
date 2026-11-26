import { supabase, serverEnabled } from './supabase'
import { createLocalTransport, type ChatTransport, type TransportMessage } from './chatTransport'

type Row = {
  id: string
  topic_id: string
  nickname: string
  body: string
  place_name: string | null
  place_url: string | null
  spoiler: boolean
  created_at: string
}

const fromRow = (r: Row): TransportMessage => ({
  id: r.id,
  topicId: r.topic_id,
  text: r.body,
  at: r.created_at,
  by: r.nickname,
  place: r.place_name ? { name: r.place_name, url: r.place_url ?? undefined } : undefined,
  spoiler: r.spoiler,
})

/** 서버 채팅. 이미지는 서버에 올리지 않는다(첨부 이미지는 이 구현에서 무시된다). */
export function createSupabaseTransport(): ChatTransport {
  const client = supabase
  if (!client) throw new Error('Supabase is not configured')
  return {
    async load(topicId, limit = 50) {
      const { data, error } = await client
        .from('messages')
        .select('id,topic_id,nickname,body,place_name,place_url,spoiler,created_at')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw new Error(error.message)
      return (data as Row[]).map(fromRow).reverse()
    },
    async send(message) {
      const { data, error } = await client
        .from('messages')
        .insert({
          topic_id: message.topicId,
          body: message.text,
          nickname: message.by ?? '',
          place_name: message.place?.name ?? null,
          place_url: message.place?.url ?? null,
          spoiler: message.spoiler ?? false,
        })
        .select('id,topic_id,nickname,body,place_name,place_url,spoiler,created_at')
        .single()
      if (error) {
        if (error.message.includes('too_many_messages')) throw new Error('너무 빨리 보내고 있어요. 잠시 후 다시 보내 주세요.')
        if (error.message.includes('profile_required')) throw new Error('닉네임을 먼저 정해 주세요.')
        if (error.code === '23514') throw new Error('보낼 수 없는 내용이에요. 연락처나 외부 연락 요청은 보낼 수 없어요.')
        throw new Error('메시지를 보내지 못했어요. 잠시 후 다시 시도해 주세요.')
      }
      return fromRow(data as Row)
    },
    subscribe(topicId, onMessage) {
      const channel = client
        .channel(`topic:${topicId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `topic_id=eq.${topicId}` }, (payload) =>
          onMessage(fromRow(payload.new as Row)),
        )
        .subscribe()
      return () => {
        void client.removeChannel(channel)
      }
    },
  }
}

/** 환경변수가 있으면 서버 채팅, 없으면 기기 안 저장. 화면 코드는 이 함수만 부른다. */
export function createTransport(): ChatTransport {
  return serverEnabled ? createSupabaseTransport() : createLocalTransport()
}

export async function reportMessage(messageId: string, reason: 'contact' | 'abuse' | 'ad' | 'privacy' | 'other', note?: string) {
  if (!supabase) return false
  const { error } = await supabase.from('reports').insert({ message_id: messageId, reason, note: note?.slice(0, 300) ?? null })
  return !error
}

export async function blockUser(blockedId: string) {
  if (!supabase) return false
  const { error } = await supabase.from('blocks').upsert({ blocked_id: blockedId })
  return !error
}
