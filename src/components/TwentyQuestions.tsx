import { useState } from 'react'

const questions = [
  ['animal', '동물인가요?'],
  ['object', '물건인가요?'],
  ['person', '사람인가요?'],
  ['pet', '반려동물로 키우기도 하나요?'],
  ['fur', '털이 있나요?'],
  ['wings', '날개가 있나요?'],
  ['wheels', '바퀴가 있나요?'],
  ['outdoors', '보통 야외에서 쓰나요?'],
  ['handheld', '한 손에 들고 쓸 수 있나요?'],
  ['electric', '전기가 필요한가요?'],
  ['sound', '소리를 내는 데 쓰나요?'],
  ['paper', '주로 종이로 만드나요?'],
  ['flies', '하늘을 날 수 있나요?'],
  ['rain', '비 오는 날에 쓰나요?'],
  ['light', '빛을 내나요?'],
  ['read', '읽을 수 있나요?'],
  ['write', '글씨를 쓰는 데 쓰나요?'],
  ['water', '물에서 사나요?'],
  ['tall', '목이 길어요?'],
  ['celebration', '연말 이야기에서 만날 수 있나요?'],
] as const

type Trait = typeof questions[number][0]
const answers: { name: string; traits: Trait[] }[] = [
  { name: '우산', traits: ['outdoors', 'handheld', 'rain'] },
  { name: '고양이', traits: ['animal', 'pet', 'fur'] },
  { name: '참새', traits: ['animal', 'wings', 'flies'] },
  { name: '책', traits: ['paper', 'handheld', 'read'] },
  { name: '손전등', traits: ['electric', 'handheld', 'light'] },
  { name: '스피커', traits: ['electric', 'sound'] },
  { name: '자전거', traits: ['wheels', 'outdoors'] },
  { name: '호루라기', traits: ['handheld', 'sound'] },
  { name: '연필', traits: ['handheld', 'write'] },
  { name: '돌고래', traits: ['animal', 'water'] },
  { name: '기린', traits: ['animal', 'fur', 'tall'] },
  { name: '산타클로스', traits: ['person', 'celebration'] },
]
const limit = 20
function answersYes(answer: typeof answers[number], trait: Trait) {
  if (trait === 'object') return !answer.traits.includes('animal') && !answer.traits.includes('person')
  return answer.traits.includes(trait)
}

const questionAliases: [RegExp, Trait][] = [
  [/^(사람|인간)(이)?(입니까|인가요|이에요|이야|인가|일까요)?$/, 'person'],
  [/^(동물|짐승)(이)?(입니까|인가요|이에요|이야|인가|일까요)?$/, 'animal'],
  [/^(반려동물|애완동물)(인가요|입니까|이에요|이야)?$/, 'pet'],
  [/^털(이)?(있나요|있습니까|있어요|있어)$/, 'fur'],
  [/^날개(가)?(있나요|있습니까|있어요|있어)$/, 'wings'],
  [/^(물건|사물)(인가요|입니까|이에요|이야)$/, 'object'],
  [/^(비올때|비오는날|비가올때)(쓰나요|쓰는건가요|써요|사용하나요)$/, 'rain'],
  [/^(하늘을)?(날수있나요|날아요|날아다니나요)$/, 'flies'],
  [/^바퀴(가)?(있나요|있습니까|있어요|있어)$/, 'wheels'],
]

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
  const remaining = answers.filter(candidate =>
    !guesses.includes(candidate.name) && asked.every(trait => answersYes(candidate, trait) === answersYes(answer, trait))
  ).length

  function ask(trait: Trait) {
    if (finished) return
    const reply = answersYes(answer, trait) ? '네.' : '아니오.'
    if (asked.includes(trait)) {
      setFeedback('픽셀: ' + reply + ' 이미 물어본 질문이에요.')
      return
    }
    setAsked([...asked, trait])
    setFeedback('픽셀: ' + reply)
  }

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
    {!finished && asked.length > 0 && <p>지금까지의 답과 맞는 후보 {remaining}개</p>}
    {asked.length > 0 && <ol className="dd-twenty-history" aria-label="질문 기록">
      {asked.map(trait => <li key={trait}>{questions.find(([key]) => key === trait)?.[1]} <strong>{answersYes(answer, trait) ? '네' : '아니오'}</strong></li>)}
    </ol>}
    {finished ? <p>{solved ? '정답' : '이번 판의 정답'}은 <strong>{answer.name}</strong>이에요.</p> : <>
      <form onSubmit={event => {
        event.preventDefault()
        const guess = draft.trim().normalize('NFC').replace(/\s+/g, '')
        if (!guess || finished) return
        const question = guess.replace(/[?？.!。]+$/, '').replace(/^(그러면|그렇다면|그럼)/, '')
        const exactQuestion = questions.find(([, label]) => label.replace(/[?\s]/g, '') === question)
        const trait = exactQuestion?.[0] ?? questionAliases.find(([pattern]) => pattern.test(question))?.[1]
        if (trait) {
          ask(trait)
          setDraft('')
          return
        }
        if (/[?？]/.test(guess) || /(입니까|인가요|나요|있어요|이에요|예요)$/.test(question)) {
          setFeedback('이 질문에는 답할 수 없어요. 위의 질문 중 하나를 골라 주세요.')
          return
        }
        if (guesses.includes(guess)) {
          setFeedback('이미 추측한 단어예요.')
          return
        }
        setGuesses([...guesses, guess])
        setDraft('')
        setFeedback(guess === answer.name ? '정답이에요!' : '그 단어는 아니에요.')
      }}>
        <input onKeyDown={event => { if (event.key === 'Enter' && event.nativeEvent.isComposing) event.preventDefault() }} aria-label="스무고개 답안" placeholder="질문 또는 정답" value={draft} maxLength={30} onChange={event => setDraft(event.target.value)} />
        <button disabled={!draft.trim()}>입력 보내기</button>
      </form>
      <details className="dd-twenty-prompts" open><summary>추천 질문</summary><nav aria-label="예·아니오 질문">
        {questions.map(([trait, label]) => <button
          type="button"
          key={trait}
          disabled={asked.includes(trait)}
          onClick={() => ask(trait)}
        >{label}</button>)}
      </nav></details>
    </>}
    <button type="button" onClick={restart}>스무고개 새 판</button>
  </section>
}
