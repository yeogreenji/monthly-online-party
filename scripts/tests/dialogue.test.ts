import { DIALOGUE_RESIDENTS, replyFor } from '../../src/data/residentDialogueV2'
let fail = 0
const bad = (m: string) => { console.log('FAIL', m); fail++ }
const ids = Object.keys(DIALOGUE_RESIDENTS)
if (ids.length !== 16) bad(`주민 수 ${ids.length}`)
let topics = 0
for (const id of ids) {
  const r = DIALOGUE_RESIDENTS[id]
  const u = r.utterances
  if (!u.greeting || !u.revisit || !u.farewell || !u.unknown) bad(`${id} 공통 대사 누락`)
  if (u.topics.length !== 6) bad(`${id} 주제 ${u.topics.length}`)
  for (const t of u.topics) {
    topics++
    if (!t.question || !t.follow_up) bad(`${id}/${t.intent} 대사 누락`)
    const q = replyFor(id, `${t.intent} 이야기 해요`, { asked: [] })
    if (q.text !== t.question) bad(`${id}/${t.intent} 질문 매칭 실패: ${q.text.slice(0, 30)}`)
    const again = replyFor(id, `${t.intent} 또 이야기해요`, { asked: [t.intent] })
    if (again.text !== t.follow_up) bad(`${id}/${t.intent} 후속 매칭 실패`)
  }
  const first = u.topics[0]
  const short = replyFor(id, '네', { asked: [first.intent], lastIntent: first.intent })
  if (short.text !== first.follow_up) bad(`${id} 짧은 대답 후속 실패`)
}
if (topics !== 96) bad(`주제 대사 ${topics}`)
const crisis = replyFor('cafe', '죽고 싶어요', { asked: [] })
if (!crisis.text.includes('119')) bad('위기 안내')
const cafeFirst = DIALOGUE_RESIDENTS.cafe.utterances.topics[0]
const rep = replyFor('cafe', '네', { asked: [cafeFirst.intent], lastIntent: cafeFirst.intent, lastText: cafeFirst.follow_up })
if (rep.text === cafeFirst.follow_up) bad('같은 문장 반복')
console.log(fail === 0 ? `OK 주민 ${ids.length}명 · 주제 대사 ${topics}개` : `FAILS ${fail}`)
process.exit(fail ? 1 : 0)
