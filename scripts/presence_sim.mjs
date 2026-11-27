// 검증용 실시간 접속 시뮬레이터.
// 실제 Supabase Presence 채널(dd-space:<space>)에 가상의 접속자를 올려,
// 다른 이용자의 캐릭터·말풍선 표시와 20명 정원 집계를 브라우저에서 확인할 때 쓴다.
// Supabase Realtime은 소켓 하나에 같은 토픽 채널을 여러 개 붙일 수 없어서, 접송자 한 명당 클라이언트 하나를 쓴다.
//
// 사용:
//   SB_URL=https://<project>.supabase.co SB_KEY=<anon key> SIM_TOPIC=<topic uuid> SIM_COUNT=20 \
//     node scripts/presence_sim.mjs [초]
import { createClient } from '@supabase/supabase-js'

const url = process.env.SB_URL
const key = process.env.SB_KEY
const space = process.env.SIM_SPACE || 'fandom'
const topicId = process.env.SIM_TOPIC || null
const count = Number(process.env.SIM_COUNT || 1)
const bubble = process.env.SIM_BUBBLE || ''
const seconds = Number(process.argv[2] || 90)
const avatarKeys = ['cat', 'fox', 'rabbit', 'bear', 'owl', 'penguin']

if (!url || !key) {
  console.error('SB_URL, SB_KEY 환경변수가 필요합니다.')
  process.exit(2)
}

const peers = []

for (let i = 0; i < count; i += 1) {
  await new Promise((resolve) => setTimeout(resolve, 90))
  const client = createClient(url, key, { auth: { persistSession: false } })
  const peerId = `sim-${i + 1}`
  const ch = client.channel(`dd-space:${space}`, { config: { presence: { key: peerId } } })
  ch.subscribe((status) => {
    if (status !== 'SUBSCRIBED') return
    void ch.track({
      id: peerId,
      nickname: `시뮬이웃${i + 1}`,
      avatar: avatarKeys[i % avatarKeys.length],
      look: null,
      space,
      topicId,
      x: 1.2 + (i % 5) * 0.8,
      z: -2 + Math.floor(i / 5) * 0.8,
      pose: 'standing',
    })
  })
  peers.push({ client, ch })
}

if (bubble && peers[0]) {
  setTimeout(() => {
    void peers[0].ch.send({ type: 'broadcast', event: 'bubble', payload: { id: 'sim-1', text: bubble, at: Date.now() } })
  }, 3000)
}

console.log(`presence sim: space=${space} topic=${topicId} peers=${count} for ${seconds}s`)
setTimeout(() => {
  for (const { client, ch } of peers) void client.removeChannel(ch)
  console.log('presence sim: stopped')
  process.exit(0)
}, seconds * 1000)
