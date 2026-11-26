import { useState } from 'react'

const questions = [
  ['animal', '동물인가요?'],
  ['pet', '반려동물로 키우기도 하나요?'],
  ['fur', '털이 있나요?'],
  ['wings', '날개가 있나요?'],
  ['wheels', '바퀴가 있나요?'],
  ['outdoors', '보통 야외에서 쓰나요?'],
  ['handheld', '한 손에 들고 쓸 수 있나요?'],
  ['electric', '전기가 필요한가요?'],
  ['sound', '소리를 내는 데 쓰나요?'],
  ['paper', '주로 종이로 만드나요?'],
] as const

type Trait = typeof questions[number][0]
const answers: { name: string; traits: Trait[] }[] = [
  { name: '우산', traits: ['outdoors', 'handheld'] },
  { name: '고양이', traits: ['animal', 'pet', 'fur'] },
  { name: '참새', traits: ['animal', 'wings'] },
  { name: '책', traits: ['paper', 'handheld'] },
  { name: '손전등', traits: ['electric', 'handheld'] },
  { name: '스피커', traits: ['electric', 'sound'] },
  { name: '자전거', traits: ['wheels', 'outdoors'] },
  { name: '호루라기', traits: ['handheld', 'sound'] },
]
const limit = 20

export function TwentyQuestions() {
  const [round, setRound] = useState(0)
  const [asked, setAsked] = useState<Trait[]>([])
  const [guesses, setGuesses] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState('')
  const answer = answers[round]
  const used = asked.length + guesses.length
  const solved = guesses.includes(answer.name)
  const finished = solved || used >= limit

  function restart() {
    setRound(index => (index + 1) % answers.length)
    setAsked([])
    setGuesses([])
    setDraft('')
    setFeedback('')
  }

  return <section aria-label="스무고개 게임">
    <p>픽셀이 고른 단어를 맞혀 보세요. 질문과 추측을 합쳐 20번까지 할 수 있어요.</p>
    <p role="status">{used}/{limit}회 사용{feedback && ' · ' + feedback}</p>
    {finished ? <p>{solved ? '정답' : '이번 판의 정답'}은 <strong>{answer.name}</strong>이에요.</p> : <>
      <nav aria-label="예·아니오 질문">
        {questions.map(([trait, label]) => <button
          type="button"
          key={trait}
          disabled={asked.includes(trait)}
          onClick={() => {
            setAsked([...asked, trait])
            setFeedback(answer.traits.includes(trait) ? '픽셀: 네.' : '픽셀: 아니오.')
          }}
        >{label}</button>)}
      </nav>
      <form onSubmit={event => {
        event.preventDefault()
        const guess = draft.trim().normalize('NFC').replace(/\s+/g, '')
        if (!guess || finished) return
        if (guesses.includes(guess)) {
          setFeedback('이미 추측한 단어예요.')
          return
        }
        setGuesses([...guesses, guess])
        setDraft('')
        setFeedback(guess === answer.name ? '정답이에요!' : '다른 단어를 생각해 보세요.')
      }}>
        <input aria-label="스무고개 답안" placeholder="정답 추측" value={draft} maxLength={30} onChange={event => setDraft(event.target.value)} />
        <button disabled={!draft.trim()}>정답 제출</button>
      </form>
    </>}
    {asked.length > 0 && <ul aria-label="질문 기록">
      {asked.map(trait => <li key={trait}>{questions.find(([key]) => key === trait)?.[1]} <strong>{answer.traits.includes(trait) ? '네' : '아니오'}</strong></li>)}
    </ul>}
    <button type="button" onClick={restart}>스무고개 새 판</button>
  </section>
}
