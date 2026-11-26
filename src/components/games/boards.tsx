import { useEffect, useMemo, useRef, useState } from 'react'
import { BALANCE, BINGO, PICTURES, QUIZ, RIDDLES, ROULETTE, WORDS } from '../../data/minigames'
import { ANSWERS, QUESTIONS, QUESTION_ALIASES, TWENTY_LIMIT, answersYes, type Trait } from '../../data/twenty'

type ExitFn = () => void

/* ── 공통: 결과 명패 ── */
function Result({ title, grade, lines, score, onRetry, onExit, retryLabel = '다시 하기' }: {
  title: string
  grade: string
  lines: string[]
  score?: string
  onRetry: () => void
  onExit: ExitFn
  retryLabel?: string
}) {
  return <div className="ddg-result" role="status">
    <div className="ddg-result-plate">
      <small>한 판 결과</small>
      <h3>{title}</h3>
      <p className="ddg-result-grade">{grade}</p>
      {score && <p className="ddg-result-score">{score}</p>}
      <ul>{lines.map((line) => <li key={line}>{line}</li>)}</ul>
      <div className="ddg-result-actions">
        <button type="button" className="ddg-btn ddg-btn-gold" onClick={onRetry}>{retryLabel}</button>
        <button type="button" className="ddg-btn" onClick={onExit}>탁자 닫기</button>
      </div>
    </div>
  </div>
}

function Pixel({ children }: { children: React.ReactNode }) {
  return <p className="ddg-pixel"><span className="ddg-pixel-face" aria-hidden="true">🦝</span><span>{children}</span></p>
}

function shuffle<T>(list: T[]): T[] {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/* ── 1. 밸런스 살롱 ── */
export function BalanceBoard({ onExit }: { onExit: ExitFn }) {
  const [round, setRound] = useState(0)
  const [picks, setPicks] = useState<Record<number, 'a' | 'b'>>({})
  const [done, setDone] = useState(false)
  const item = BALANCE[round]
  const picked = picks[round]
  const majority = item.vote[0] >= item.vote[1] ? 'a' : 'b'
  const agree = Object.entries(picks).filter(([key, side]) => side === (BALANCE[Number(key)].vote[0] >= BALANCE[Number(key)].vote[1] ? 'a' : 'b')).length
  const total = Object.keys(picks).length

  function choose(side: 'a' | 'b') {
    if (picked) return
    setPicks((prev) => ({ ...prev, [round]: side }))
  }

  if (done) {
    const grade = total === 0 ? '아직 마음을 정하지 않았어요' : agree / total >= 0.66 ? '살롱의 대세파' : agree / total <= 0.34 ? '취향이 또렷한 개척자' : '반반씩 나눠 든 균형파'
    return <Result
      title="밸런스 살롱 · 20세트 완료"
      grade={grade}
      score={`${total}세트 중 다수파 선택 ${agree}회`}
      lines={[`소수파 선택 ${total - agree}회`, '예시 투표 비율은 딩동이 만든 연출이에요. 실제 집계가 아닙니다.']}
      onRetry={() => { setPicks({}); setRound(0); setDone(false) }}
      onExit={onExit}
    />
  }

  return <section className="ddg-balance" aria-label="밸런스 게임">
    <div className="ddg-progress"><span>{round + 1} / {BALANCE.length}</span><i style={{ width: `${((round + (picked ? 1 : 0)) / BALANCE.length) * 100}%` }} /></div>
    <p className="ddg-question">둘 중 하나만 고른다면?</p>
    <div className={`ddg-pair${picked ? ' is-picked' : ''}`}>
      {(['a', 'b'] as const).map((side) => <button
        type="button"
        key={side}
        className={`ddg-card ddg-card-${side}${picked === side ? ' is-on' : ''}${picked && picked !== side ? ' is-off' : ''}`}
        onClick={() => choose(side)}
        aria-pressed={picked === side}
        disabled={Boolean(picked)}
      >
        <span className="ddg-card-pin" aria-hidden="true" />
        <em>{side.toUpperCase()}</em>
        <strong>{side === 'a' ? item.a : item.b}</strong>
        <small>{side === 'a' ? item.aTag : item.bTag}</small>
        {picked && <span className="ddg-card-vote">{item.vote[side === 'a' ? 0 : 1]}%</span>}
      </button>)}
      <span className="ddg-versus" aria-hidden="true">VS</span>
    </div>
    {picked && <>
      <Pixel>{picked === majority ? '다수파 쪽이네요. ' : '소수파의 취향, 저는 존중합니다. '}{item.line}</Pixel>
      <div className="ddg-actions">
        <button type="button" className="ddg-btn" onClick={() => setRound((value) => Math.min(BALANCE.length - 1, value + 1))} disabled={round === BALANCE.length - 1}>다음 세트</button>
        {round === BALANCE.length - 1 && <button type="button" className="ddg-btn ddg-btn-gold" onClick={() => setDone(true)}>결과 보기</button>}
        <span className="ddg-note">예시 투표 {item.vote[0]} : {item.vote[1]}</span>
      </div>
    </>}
    {!picked && <Pixel>카드 두 장 중 마음이 가는 쪽을 눌러 주세요. 정답은 없습니다.</Pixel>}
  </section>
}

/* ── 2. OX 퀴즈 ── */
export function QuizBoard({ onExit }: { onExit: ExitFn }) {
  const [order] = useState(() => shuffle(QUIZ))
  const [round, setRound] = useState(0)
  const [picked, setPicked] = useState<boolean | null>(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [best, setBest] = useState(0)
  const [done, setDone] = useState(false)
  const item = order[round]

  function choose(value: boolean) {
    if (picked !== null) return
    setPicked(value)
    if (value === item.answer) {
      setScore((s) => s + 1)
      setStreak((s) => { const next = s + 1; setBest((b) => Math.max(b, next)); return next })
    } else setStreak(0)
  }

  function next() {
    if (round >= order.length - 1) { setDone(true); return }
    setRound((value) => value + 1)
    setPicked(null)
  }

  if (done) {
    const grade = score >= 18 ? '퀴즈의 신' : score >= 14 ? '상식 부자' : score >= 10 ? '평균 이상' : '오늘은 운이 없던 날'
    return <Result
      title="OX 퀴즈 · 20문제 완료"
      grade={grade}
      score={`${score} / ${order.length} 정답`}
      lines={[`최고 연속 정답 ${best}문제`, '해설은 탁자 위에서 다시 볼 수 있어요.']}
      onRetry={() => { setRound(0); setPicked(null); setScore(0); setStreak(0); setBest(0); setDone(false) }}
      onExit={onExit}
    />
  }

  return <section className="ddg-quiz" aria-label="OX 퀴즈">
    <div className="ddg-progress"><span>{round + 1} / {order.length}</span><i style={{ width: `${((round + (picked !== null ? 1 : 0)) / order.length) * 100}%` }} /></div>
    <div className="ddg-quiz-score"><span>정답 <strong>{score}</strong></span><span>연속 <strong>{streak}</strong></span><span className="ddg-quiz-cat">{item.cat}</span></div>
    <p className="ddg-quiz-q">{item.q}</p>
    <div className="ddg-ox">
      <button type="button" className={`ddg-disc ddg-disc-o${picked === true ? ' is-on' : ''}${picked !== null && item.answer !== true ? ' is-wrong' : ''}`} onClick={() => choose(true)} disabled={picked !== null} aria-label="O, 맞다">
        <span aria-hidden="true">O</span><small>맞다</small>
      </button>
      <button type="button" className={`ddg-disc ddg-disc-x${picked === false ? ' is-on' : ''}${picked !== null && item.answer !== false ? ' is-wrong' : ''}`} onClick={() => choose(false)} disabled={picked !== null} aria-label="X, 아니다">
        <span aria-hidden="true">X</span><small>아니다</small>
      </button>
    </div>
    {picked !== null
      ? <div className={`ddg-explain${picked === item.answer ? ' is-right' : ' is-miss'}`}>
          <strong>{picked === item.answer ? '정답입니다!' : `아쉬워요. 정답은 ${item.answer ? 'O' : 'X'}`}</strong>
          <p>{item.why}</p>
          <div className="ddg-actions"><button type="button" className="ddg-btn ddg-btn-gold" onClick={next}>{round >= order.length - 1 ? '결과 보기' : '다음 문제'}</button></div>
        </div>
      : <Pixel>정답을 고르면 짧은 해설이 따라옵니다. 틀려도 웃으면 됩니다.</Pixel>}
  </section>
}

/* ── 3. 끝말잇기 ── */
export function WordBoard({ onExit }: { onExit: ExitFn }) {
  const LIMIT = 12
  const [chain, setChain] = useState<{ who: 'me' | 'pixel'; word: string }[]>([])
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState('')
  const [mine, setMine] = useState(0)
  const [done, setDone] = useState(false)
  const [win, setWin] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const pool = useMemo(() => Array.from(new Set(WORDS)), [])
  const last = chain.length ? chain[chain.length - 1].word : ''
  const needChar = last.slice(-1)

  useEffect(() => { if (box.current) box.current.scrollTop = box.current.scrollHeight }, [chain])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const word = draft.trim().replace(/\s+/g, '')
    if (!word) return
    if (!/^[가-힣]{2,12}$/.test(word)) { setNotice('한글 두 글자 이상으로 적어 주세요.'); return }
    if (chain.length && word[0] !== needChar) { setNotice(`'${needChar}'(으)로 시작하는 단어여야 해요.`); return }
    if (word === last || chain.some((entry) => entry.word === word)) { setNotice('이미 나온 단어예요. 다른 단어로 도전!'); return }
    const used = new Set(chain.map((entry) => entry.word).concat(word))
    const reply = pool.filter((candidate) => candidate[0] === word.slice(-1) && !used.has(candidate))
    const next: { who: 'me' | 'pixel'; word: string }[] = [...chain, { who: 'me', word }]
    setDraft('')
    setNotice('')
    setMine((value) => value + 1)
    if (!reply.length) {
      setChain(next)
      setWin(true)
      setDone(true)
      return
    }
    const ranked = reply.sort((a, b) => b.length - a.length)
    const pickWord = ranked[Math.floor(Math.random() * Math.min(4, ranked.length))]
    const after = [...next, { who: 'pixel' as const, word: pickWord }]
    setChain(after)
    if (after.length >= LIMIT) { setDone(true); setWin(false) }
  }

  function start() {
    const first = pool[Math.floor(Math.random() * pool.length)]
    const reply = pool.filter((candidate) => candidate[0] === first.slice(-1) && candidate !== first)
    setChain([{ who: 'pixel', word: first }, { who: 'pixel', word: reply[Math.floor(Math.random() * reply.length)] ?? first }])
    setMine(0); setDone(false); setWin(false); setNotice(''); setDraft('')
  }

  if (done) {
    return <Result
      title={win ? '픽셀이 단어를 찾지 못했어요!' : '12턴 릴레이 완주'}
      grade={win ? '완승' : mine >= 8 ? '단어 부자' : '좋은 승부였어요'}
      score={`내가 이은 단어 ${mine}개`}
      lines={[win ? '픽셀: “사전이 부족했어요. 한 판 더!”' : '끝까지 이어졌어요. 다음엔 더 길게 가 봐요.']}
      onRetry={start}
      onExit={onExit}
    />
  }

  return <section className="ddg-word" aria-label="끝말잇기">
    <div className="ddg-word-head">
      <span>턴 {chain.length} / {LIMIT}</span>
      <span>내 단어 <strong>{mine}</strong></span>
      <button type="button" className="ddg-btn ddg-btn-mini" onClick={() => { setDone(true); setWin(false) }}>그만두기</button>
    </div>
    {chain.length === 0
      ? <div className="ddg-word-empty">
          <Pixel>제가 먼저 시작할게요. 마지막 글자로 이어 주세요. 12턴까지 가면 완주!</Pixel>
          <div className="ddg-tiles" aria-hidden="true">{Array.from('끝말잇기').map((char, index) => <span key={index} style={{ ['--tilt' as string]: `${(index % 2 ? 1 : -1) * 2}deg` }}>{char}</span>)}</div>
          <button type="button" className="ddg-btn ddg-btn-gold" onClick={start}>한 판 시작</button>
        </div>
      : <>
          <div className="ddg-word-log" ref={box} role="log" aria-label="이어 온 단어">
            {chain.map((entry, index) => <div key={`${entry.word}-${index}`} className={`ddg-word-row is-${entry.who}`}>
              <span>{entry.who === 'me' ? '나' : '픽셀'}</span>
              <div className="ddg-tiles is-small">{Array.from(entry.word).map((char, cell) => <i key={cell}>{char}</i>)}</div>
            </div>)}
          </div>
          <form className="ddg-word-form" onSubmit={submit}>
            <label htmlFor="ddg-word-input" className="ddg-word-need"><span>시작 글자</span><strong>{needChar}</strong></label>
            <input id="ddg-word-input" aria-label="끝말잇기 단어" value={draft} maxLength={12} onChange={(event) => setDraft(event.target.value)} placeholder={`${needChar}(으)로 시작하는 단어`} autoComplete="off" />
            <button type="button" className="ddg-btn" onClick={() => {
              const used = new Set(chain.map((entry) => entry.word).concat(draft.trim() ? [draft.trim()] : []))
              const starts = pool.filter((candidate) => candidate[0] === needChar && !used.has(candidate))
              const alive = starts.filter((candidate) => pool.some((next) => next[0] === candidate.slice(-1) && next !== candidate && !used.has(next)))
              const pick = alive.length ? alive : starts
              if (pick.length) setDraft(pick[Math.floor(Math.random() * pick.length)])
              else setNotice('이 글자로 시작하는 연습 단어가 없어요. 다른 글자로 이어 보세요.')
            }}>힌트</button>
            <button type="submit" className="ddg-btn ddg-btn-gold" disabled={!draft.trim()}>잇기</button>
          </form>
          {notice && <p className="ddg-notice" role="alert">{notice}</p>}
          <p className="ddg-note">사전 검증 없이 딩동 연습 목록으로 진행하는 로컬 게임이에요.</p>
        </>}
  </section>
}

/* ── 4. 힌트 맞히기 ── */
export function RiddleBoard({ onExit }: { onExit: ExitFn }) {
  const [round, setRound] = useState(0)
  const [hints, setHints] = useState(1)
  const [draft, setDraft] = useState('')
  const [state, setState] = useState<'idle' | 'right' | 'wrong'>('idle')
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const item = RIDDLES[round]

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const value = draft.trim().replace(/\s+/g, '')
    if (!value) return
    if (value === item.answer) {
      setState('right')
      setScore((s) => s + Math.max(1, 5 - hints))
    } else setState('wrong')
  }

  function next() {
    if (round >= RIDDLES.length - 1) { setDone(true); return }
    setRound((value) => value + 1)
    setHints(1); setDraft(''); setState('idle')
  }

  if (done) {
    return <Result
      title="힌트 맞히기 · 10문제 완료"
      grade={score >= 30 ? '수수께끼 장인' : score >= 18 ? '눈치 빠른 손님' : '즐거운 추리였어요'}
      score={`${score}점`}
      lines={['힌트를 적게 볼수록 점수가 커집니다.', '정답은 탁자 위 수첩에 적어 두었어요.']}
      onRetry={() => { setRound(0); setHints(1); setScore(0); setDraft(''); setState('idle'); setDone(false) }}
      onExit={onExit}
    />
  }

  return <section className="ddg-riddle" aria-label="힌트 맞히기">
    <div className="ddg-progress"><span>{round + 1} / {RIDDLES.length}</span><i style={{ width: `${((round + (state === 'right' ? 1 : 0)) / RIDDLES.length) * 100}%` }} /></div>
    <div className="ddg-candle" aria-hidden="true"><i /><span>{item.category}</span></div>
    <ol className="ddg-hint-list">
      {item.hints.slice(0, hints).map((hint, index) => <li key={hint}><b>{index + 1}</b>{hint}</li>)}
    </ol>
    {hints < item.hints.length && state !== 'right' && <button type="button" className="ddg-btn" onClick={() => setHints((value) => value + 1)}>힌트 하나 더 (점수 -1)</button>}
    <form className="ddg-riddle-form" onSubmit={submit}>
      <input aria-label="수수께끼 정답" value={draft} maxLength={20} onChange={(event) => setDraft(event.target.value)} placeholder="정답이라고 생각하는 것" />
      <button type="submit" className="ddg-btn ddg-btn-gold" disabled={!draft.trim() || state === 'right'}>정답 확인</button>
    </form>
    {state === 'right' && <div className="ddg-explain is-right"><strong>정답! {item.answer}</strong><p>{item.note}</p><div className="ddg-actions"><button type="button" className="ddg-btn ddg-btn-gold" onClick={next}>{round >= RIDDLES.length - 1 ? '결과 보기' : '다음 수수께끼'}</button></div></div>}
    {state === 'wrong' && <p className="ddg-notice" role="alert">아직 아니에요. 힌트를 더 열거나 다른 답을 적어 보세요.</p>}
    <p className="ddg-note">현재 점수 {score}점</p>
  </section>
}

/* ── 5. 그림 맞히기 ── */
function PictureArt({ id }: { id: string }) {
  switch (id) {
    case 'p1': return <svg viewBox="0 0 120 120" role="img" aria-label="그림"><path d="M15 64 Q60 -6 105 64 Q90 49 75 64 Q60 49 45 64 Q30 49 15 64Z" fill="#e6a7b9" /><path d="M60 34 V96 Q60 108 73 100" fill="none" stroke="#76566b" strokeWidth="4" strokeLinecap="round" /></svg>
    case 'p2': return <svg viewBox="0 0 120 120" role="img" aria-label="그림"><path d="M25 56 L23 17 L49 36 Q60 31 71 36 L97 17 L95 56 Q110 99 60 104 Q10 99 25 56Z" fill="#f2ce96" /><circle cx="43" cy="65" r="4" fill="#4a3b40" /><circle cx="77" cy="65" r="4" fill="#4a3b40" /><path d="M55 77 L65 77 L60 82Z" fill="#87684d" /></svg>
    case 'p3': return <svg viewBox="0 0 120 120" role="img" aria-label="그림"><rect x="24" y="47" width="72" height="55" rx="6" fill="#a9d6c3" /><rect x="18" y="36" width="84" height="17" rx="5" fill="#bce4d3" /><path d="M60 36 V102 M60 36 C18 33 31 5 60 36 C89 5 102 33 60 36" fill="none" stroke="#cf7592" strokeWidth="7" strokeLinecap="round" /></svg>
    case 'p4': return <svg viewBox="0 0 120 120" role="img" aria-label="그림"><circle cx="60" cy="86" r="26" fill="#f4f7fb" stroke="#cfdbe8" strokeWidth="3" /><circle cx="60" cy="52" r="19" fill="#f8fbff" stroke="#cfdbe8" strokeWidth="3" /><circle cx="60" cy="26" r="13" fill="#fdfdff" stroke="#cfdbe8" strokeWidth="3" /><path d="M73 24 L88 22 L73 29Z" fill="#e8814f" /><circle cx="55" cy="20" r="2" fill="#3a3350" /><circle cx="65" cy="20" r="2" fill="#3a3350" /><rect x="47" y="4" width="26" height="7" rx="2" fill="#b0546e" /><rect x="52" y="-2" width="16" height="8" rx="3" fill="#c96a83" /></svg>
    case 'p5': return <svg viewBox="0 0 120 120" role="img" aria-label="그림"><rect x="54" y="92" width="12" height="18" rx="3" fill="#8a5a34" /><path d="M60 30 L96 66 H24Z" fill="#2f8f5b" /><path d="M60 50 L102 88 H18Z" fill="#37a064" /><path d="M60 72 L108 104 H12Z" fill="#42b573" /><path d="M60 8 l4 9 10 1 -7 7 2 10 -9-5 -9 5 2-10 -7-7 10-1Z" fill="#f4c14e" /><circle cx="42" cy="82" r="3.4" fill="#e85c8e" /><circle cx="76" cy="94" r="3.4" fill="#4e91df" /><circle cx="88" cy="76" r="3" fill="#f4bb51" /></svg>
    case 'p6': return <svg viewBox="0 0 120 120" role="img" aria-label="그림"><path d="M28 50 h56 l-6 40 a8 8 0 0 1 -8 7 h-28 a8 8 0 0 1 -8 -7Z" fill="#fdfaf4" stroke="#c9a98a" strokeWidth="3" /><path d="M84 58 q18 2 14 16 q-3 10 -16 8" fill="none" stroke="#c9a98a" strokeWidth="4" /><ellipse cx="56" cy="100" rx="34" ry="7" fill="#e7d6c2" /><path d="M44 40 q6 -9 0 -18 M60 38 q6 -9 0 -18 M76 40 q6 -9 0 -18" fill="none" stroke="#d8c8b6" strokeWidth="3" strokeLinecap="round" /></svg>
    case 'p7': return <svg viewBox="0 0 120 120" role="img" aria-label="그림"><rect x="20" y="20" width="80" height="80" rx="14" fill="#fdf3e2" stroke="#c8a888" strokeWidth="4" /><circle cx="40" cy="40" r="5" fill="#6b4a5b" /><circle cx="60" cy="60" r="5" fill="#6b4a5b" /><circle cx="80" cy="80" r="5" fill="#6b4a5b" /><circle cx="80" cy="40" r="5" fill="#6b4a5b" /><circle cx="40" cy="80" r="5" fill="#6b4a5b" /></svg>
    default: return <svg viewBox="0 0 120 120" role="img" aria-label="그림"><path d="M60 8 l12 30 h32 l-26 20 10 32 -28-20 -28 20 10-32 -26-20 h32Z" fill="#f6cf62" stroke="#d9a93f" strokeWidth="3" /><circle cx="60" cy="60" r="8" fill="#fff4c9" /></svg>
  }
}

export function PictureBoard({ onExit }: { onExit: ExitFn }) {
  const [order] = useState(() => shuffle(PICTURES))
  const [round, setRound] = useState(0)
  const [choice, setChoice] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const item = order[round]

  if (done) {
    return <Result
      title="그림 맞히기 · 8점 만점"
      grade={score >= 7 ? '눈썰미 최고' : score >= 5 ? '괜찮은 관찰력' : '그림이 조금 억울합니다'}
      score={`${score} / ${order.length}`}
      lines={['그림은 모두 딩동이 직접 그린 자체 도안이에요.']}
      onRetry={() => { setRound(0); setChoice(null); setScore(0); setDone(false) }}
      onExit={onExit}
    />
  }

  return <section className="ddg-picture" aria-label="그림 맞히기">
    <div className="ddg-progress"><span>{round + 1} / {order.length}</span><i style={{ width: `${((round + (choice ? 1 : 0)) / order.length) * 100}%` }} /></div>
    <div className="ddg-easel">
      <div className="ddg-canvas"><PictureArt id={item.id} /></div>
      <p>{item.caption}</p>
      <i aria-hidden="true" /><i aria-hidden="true" />
    </div>
    <div className="ddg-plaques">
      {item.options.map((option) => <button
        type="button"
        key={option}
        className={`ddg-plaque${choice === option ? ' is-on' : ''}${choice && option === item.answer ? ' is-answer' : ''}`}
        disabled={Boolean(choice)}
        onClick={() => { setChoice(option); if (option === item.answer) setScore((value) => value + 1) }}
      >{option}</button>)}
    </div>
    {choice && <>
      <p className={`ddg-notice${choice === item.answer ? ' is-good' : ''}`} role="status">{choice === item.answer ? '정답이에요! ' : `정답은 ${item.answer}이에요. `}그림 {round + 1}번째.</p>
      <div className="ddg-actions"><button type="button" className="ddg-btn ddg-btn-gold" onClick={() => {
        if (round >= order.length - 1) { setDone(true); return }
        setRound((value) => value + 1); setChoice(null)
      }}>{round >= order.length - 1 ? '결과 보기' : '다음 그림'}</button></div>
    </>}
  </section>
}

/* ── 6. 틱택토 ── */
const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
type Mark = 'X' | 'O'
type Cell = Mark | null

function winningLine(cells: Cell[]): number[] | null {
  for (const line of LINES) {
    const [a, b, c] = line
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) return line
  }
  return null
}

function pixelMove(cells: Cell[]): number {
  const free = cells.map((cell, index) => (cell ? -1 : index)).filter((index) => index >= 0)
  for (const mark of ['O', 'X'] as const) {
    for (const index of free) {
      const trial = [...cells]
      trial[index] = mark
      if (winningLine(trial)) return index
    }
  }
  if (!cells[4]) return 4
  const corners = [0, 2, 6, 8].filter((index) => !cells[index])
  if (corners.length && Math.random() > 0.25) return corners[Math.floor(Math.random() * corners.length)]
  return free[Math.floor(Math.random() * free.length)]
}

export function TicTacToeBoard({ onExit }: { onExit: ExitFn }) {
  const [cells, setCells] = useState<Cell[]>(Array(9).fill(null))
  const [busy, setBusy] = useState(false)
  const [record, setRecord] = useState({ win: 0, lose: 0, draw: 0 })
  const [roundOver, setRoundOver] = useState<'win' | 'lose' | 'draw' | null>(null)
  const win = winningLine(cells)
  const filled = cells.filter(Boolean).length
  const timer = useRef<number | null>(null)

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])

  function settle(next: Cell[]) {
    const line = winningLine(next)
    if (line) {
      const mark = next[line[0]]
      setRoundOver(mark === 'X' ? 'win' : 'lose')
      setRecord((value) => ({ ...value, [mark === 'X' ? 'win' : 'lose']: value[mark === 'X' ? 'win' : 'lose'] + 1 }))
      return true
    }
    if (next.every(Boolean)) {
      setRoundOver('draw')
      setRecord((value) => ({ ...value, draw: value.draw + 1 }))
      return true
    }
    return false
  }

  function play(index: number) {
    if (busy || roundOver || cells[index]) return
    const next = [...cells]
    next[index] = 'X'
    setCells(next)
    if (settle(next)) return
    setBusy(true)
    timer.current = window.setTimeout(() => {
      const after = [...next]
      after[pixelMove(next)] = 'O'
      setCells(after)
      settle(after)
      setBusy(false)
    }, 520)
  }

  function again() {
    setCells(Array(9).fill(null))
    setRoundOver(null)
    setBusy(false)
  }

  const status = roundOver === 'win' ? '내가 이겼어요!' : roundOver === 'lose' ? '픽셀이 이겼어요.' : roundOver === 'draw' ? '무승부예요.' : busy ? '픽셀이 생각 중…' : '내 차례예요 (X)'

  return <section className="ddg-tictactoe" aria-label="틱택토">
    <div className="ddg-ttt-score"><span>나 <strong>{record.win}</strong></span><span>픽셀 <strong>{record.lose}</strong></span><span>무승부 <strong>{record.draw}</strong></span></div>
    <div className="ddg-ttt-board" role="group" aria-label="틱택토 판">
      {cells.map((mark, index) => <button
        type="button"
        key={index}
        aria-label={`${index + 1}번 칸 ${mark ?? '비어 있음'}`}
        data-mark={mark ?? ''}
        data-win={win?.includes(index) ? 'true' : 'false'}
        disabled={Boolean(mark) || Boolean(roundOver) || busy}
        onClick={() => play(index)}
      ><span>{mark === 'X' ? '✕' : mark === 'O' ? '◯' : ''}</span></button>)}
    </div>
    <p className="ddg-ttt-status" role="status">{status}<small>{filled}칸 채움</small></p>
    <div className="ddg-actions">
      <button type="button" className="ddg-btn ddg-btn-gold" onClick={again}>{roundOver ? '다음 판' : '판 비우기'}</button>
      {roundOver && <button type="button" className="ddg-btn" onClick={onExit}>탁자 닫기</button>}
    </div>
  </section>
}

/* ── 7. 스무고개 ── */
export function TwentyBoard({ onExit }: { onExit: ExitFn }) {
  const [pool] = useState(() => shuffle(ANSWERS.map((_, index) => index)))
  const [turn, setTurn] = useState(0)
  const [asked, setAsked] = useState<Trait[]>([])
  const [guesses, setGuesses] = useState<string[]>([])
  const [draft, setDraft] = useState('')
  const [feedback, setFeedback] = useState('')
  const [tally, setTally] = useState({ solved: 0, played: 0 })
  const answer = ANSWERS[pool[turn % pool.length]]
  const used = asked.length + guesses.length
  const solved = guesses.includes(answer.name)
  const finished = solved || used >= TWENTY_LIMIT
  const remain = ANSWERS.filter((candidate) => !guesses.includes(candidate.name) && asked.every((trait) => answersYes(candidate, trait) === answersYes(answer, trait))).length

  function ask(trait: Trait) {
    if (finished) return
    if (asked.includes(trait)) { setFeedback('이미 물어본 질문이에요.'); return }
    setAsked([...asked, trait])
    setFeedback(answersYes(answer, trait) ? '네.' : '아니오.')
  }

  function next() {
    setTally((value) => ({ solved: value.solved + (solved ? 1 : 0), played: value.played + 1 }))
    setTurn((value) => value + 1)
    setAsked([]); setGuesses([]); setDraft(''); setFeedback('')
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const guess = draft.trim().normalize('NFC').replace(/\s+/g, '')
    if (!guess || finished) return
    const question = guess.replace(/[?？.!。]+$/, '').replace(/^(그러면|그렇다면|그럼)/, '')
    const exact = QUESTIONS.find(([, label]) => label.replace(/[?\s]/g, '') === question)
    const alias = exact?.[0] ?? QUESTION_ALIASES.find(([pattern]) => pattern.test(question))?.[1]
    setDraft('')
    if (alias) { ask(alias); return }
    if (ANSWERS.some((item) => item.name === question)) {
      if (guesses.includes(question)) { setFeedback('이미 추측한 단어예요.'); return }
      setGuesses([...guesses, question])
      setFeedback(question === answer.name ? '정답이에요!' : '그 단어는 아니에요.')
      return
    }
    if (/[?？]/.test(guess) || /(입니까|인가요|나요|있어요|이에요|예요)$/.test(question)) {
      setFeedback('그 질문에는 답할 수 없어요. 아래 질문 카드 중에서 골라 주세요.')
      return
    }
    if (guesses.includes(guess)) { setFeedback('이미 추측한 단어예요.'); return }
    setGuesses([...guesses, guess])
    setFeedback(guess === answer.name ? '정답이에요!' : '그 단어는 아니에요.')
  }

  return <section className="ddg-twenty" aria-label="스무고개">
    <div className="ddg-word-head">
      <span>질문·추측 {used} / {TWENTY_LIMIT}</span>
      <span>맞힌 판 <strong>{tally.solved}</strong> / {tally.played}</span>
    </div>
    {!finished && asked.length > 0 && <p className="ddg-note">조건에 맞는 후보 {remain}개 남음</p>}
    {asked.length > 0 && <ol className="ddg-notes" aria-label="질문 기록">
      {asked.map((trait) => <li key={trait}><span>{QUESTIONS.find(([key]) => key === trait)?.[1]}</span><b>{answersYes(answer, trait) ? '네' : '아니오'}</b></li>)}
    </ol>}
    {guesses.length > 0 && <ol className="ddg-notes is-guess" aria-label="추측 기록">
      {guesses.map((word) => <li key={word}><span>{word}</span><b>{word === answer.name ? '정답' : '오답'}</b></li>)}
    </ol>}
    {finished
      ? <div className="ddg-explain is-right">
          <strong>{solved ? '정답입니다!' : '이번 판의 정답은'} {answer.name}</strong>
          <p>{answer.hint} · {answersYes(answer, 'animal') ? '동물' : answersYes(answer, 'person') ? '사람' : '물건'} 쪽 단어였어요.</p>
          <div className="ddg-actions">
            <button type="button" className="ddg-btn ddg-btn-gold" onClick={next}>다음 판</button>
            <button type="button" className="ddg-btn" onClick={onExit}>탁자 닫기</button>
          </div>
        </div>
      : <>
          {feedback && <Pixel>{feedback}</Pixel>}
          <form className="ddg-twenty-form" onSubmit={submit}>
            <input aria-label="스무고개 답안" placeholder="질문 또는 정답 단어" value={draft} maxLength={30} onChange={(event) => setDraft(event.target.value)} />
            <button type="submit" className="ddg-btn ddg-btn-gold" disabled={!draft.trim()}>보내기</button>
          </form>
          <details className="ddg-twenty-ask" open>
            <summary>예·아니오 질문 카드</summary>
            <div className="ddg-ask-list">
              {QUESTIONS.map(([trait, label]) => <button
                type="button"
                key={trait}
                className="ddg-token"
                disabled={asked.includes(trait)}
                onClick={() => ask(trait)}
              >{label}</button>)}
            </div>
          </details>
        </>}
    <p className="ddg-note">픽셀이 고른 단어를 질문 20번 안에 맞히는 게임이에요.</p>
  </section>
}

/* ── 8. 룰렛 ── */
export function RouletteBoard({ onExit }: { onExit: ExitFn }) {
  const [angle, setAngle] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const timer = useRef<number | null>(null)
  const slice = 360 / ROULETTE.length

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current) }, [])

  function spin() {
    if (spinning) return
    const pick = Math.floor(Math.random() * ROULETTE.length)
    const target = 360 * 5 + (360 - (pick * slice + slice / 2))
    setSpinning(true)
    setResult(null)
    setAngle((value) => value + target + ((value % 360) * -1))
    timer.current = window.setTimeout(() => {
      setSpinning(false)
      setResult(pick)
      setHistory((value) => [ROULETTE[pick].label, ...value].slice(0, 5))
    }, 3600)
  }

  return <section className="ddg-roulette" aria-label="룰렛 뽑기">
    <div className="ddg-wheel-wrap">
      <span className="ddg-wheel-pin" aria-hidden="true" />
      <div
        className="ddg-wheel"
        style={{
          transform: `rotate(${angle}deg)`,
          transition: spinning ? 'transform 3.5s cubic-bezier(.16,.84,.16,1)' : 'none',
          background: `conic-gradient(${ROULETTE.map((spot, index) => `${spot.color} ${index * slice}deg ${(index + 1) * slice}deg`).join(',')})`,
        }}
        aria-hidden="true"
      >
        {ROULETTE.map((spot, index) => <span key={spot.label} style={{ transform: `rotate(${index * slice + slice / 2}deg) translateY(-88px)` }}>{spot.label.split(' ')[0]}</span>)}
      </div>
      <div className="ddg-wheel-hub" aria-hidden="true"><small>딩동</small></div>
    </div>
    <div className="ddg-actions">
      <button type="button" className="ddg-btn ddg-btn-gold ddg-spin" onClick={spin} disabled={spinning}>{spinning ? '돌아가는 중…' : result === null ? '룰렛 돌리기' : '한 번 더'}</button>
      <button type="button" className="ddg-btn" onClick={onExit}>탁자 닫기</button>
    </div>
    {result !== null && <div className="ddg-explain is-right" role="status">
      <small>오늘의 역할</small>
      <strong>{ROULETTE[result].label}</strong>
      <p>{ROULETTE[result].note}</p>
    </div>}
    {history.length > 0 && <p className="ddg-note">최근 뽑기 · {history.join(' → ')}</p>}
    <p className="ddg-note">운세나 실제 배정이 아니라 파티를 위한 역할 놀이예요.</p>
  </section>
}

/* ── 9. 주사위 대결 ── */
const PIPS: Record<number, number[]> = {
  1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8],
}

function Die({ value, rolling, tone }: { value: number; rolling: boolean; tone: 'me' | 'pixel' }) {
  return <div className={`ddg-die is-${tone}${rolling ? ' is-rolling' : ''}`} aria-label={`주사위 ${value}`}>
    {Array.from({ length: 9 }, (_, index) => <i key={index} className={PIPS[value]?.includes(index) ? 'on' : ''} />)}
  </div>
}

export function DiceBoard({ onExit }: { onExit: ExitFn }) {
  const [mine, setMine] = useState<[number, number]>([1, 1])
  const [theirs, setTheirs] = useState<[number, number]>([1, 1])
  const [rolling, setRolling] = useState(false)
  const [rounds, setRounds] = useState<{ me: number; pixel: number }[]>([])
  const [message, setMessage] = useState('주사위를 굴려 픽셀보다 큰 눈이 나오면 이기는 판이에요.')
  const timers = useRef<number[]>([])

  useEffect(() => () => { timers.current.forEach((id) => window.clearInterval(id)) }, [])

  const myTotal = mine[0] + mine[1]
  const theirTotal = theirs[0] + theirs[1]
  const wins = rounds.filter((round) => round.me > round.pixel).length
  const losses = rounds.filter((round) => round.me < round.pixel).length
  const over = wins >= 3 || losses >= 3

  function roll() {
    if (rolling || over) return
    setRolling(true)
    setMessage('주사위가 구르는 중…')
    const spin = window.setInterval(() => {
      setMine([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)])
      setTheirs([1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)])
    }, 90)
    timers.current.push(spin)
    const stop = window.setTimeout(() => {
      window.clearInterval(spin)
      const nextMine: [number, number] = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]
      const nextTheirs: [number, number] = [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)]
      setMine(nextMine); setTheirs(nextTheirs); setRolling(false)
      const a = nextMine[0] + nextMine[1]
      const b = nextTheirs[0] + nextTheirs[1]
      setRounds((value) => [...value, { me: a, pixel: b }])
      setMessage(a > b ? `내가 ${a} : ${b}로 이겼어요!` : a < b ? `픽셀이 ${a} : ${b}로 이겼어요.` : `${a} : ${b} 무승부, 다시 굴려요.`)
    }, 950)
    timers.current.push(stop)
  }

  function reset() {
    setRounds([]); setMine([1, 1]); setTheirs([1, 1]); setMessage('새 판을 시작합니다. 3승 먼저!')
  }

  return <section className="ddg-dice" aria-label="주사위 대결">
    <div className="ddg-dice-score"><span>나 <strong>{wins}</strong></span><span>픽셀 <strong>{losses}</strong></span><span>판수 <strong>{rounds.length}</strong></span></div>
    <div className="ddg-dice-arena">
      <div className="ddg-dice-side">
        <small>나</small>
        <div className="ddg-dice-row"><Die value={mine[0]} rolling={rolling} tone="me" /><Die value={mine[1]} rolling={rolling} tone="me" /></div>
        <b>{rolling ? '?' : myTotal}</b>
      </div>
      <span className="ddg-versus" aria-hidden="true">VS</span>
      <div className="ddg-dice-side">
        <small>픽셀</small>
        <div className="ddg-dice-row"><Die value={theirs[0]} rolling={rolling} tone="pixel" /><Die value={theirs[1]} rolling={rolling} tone="pixel" /></div>
        <b>{rolling ? '?' : theirTotal}</b>
      </div>
    </div>
    <p className={`ddg-notice${over ? ' is-good' : ''}`} role="status">{over ? (wins >= 3 ? '3승! 주사위 대결 승리!' : '3패. 픽셀이 오늘은 운이 좋네요.') : message}</p>
    <div className="ddg-actions">
      <button type="button" className="ddg-btn ddg-btn-gold" onClick={roll} disabled={rolling || over}>주사위 굴리기</button>
      <button type="button" className="ddg-btn" onClick={reset}>{over ? '새 승부' : '기록 지우기'}</button>
      {over && <button type="button" className="ddg-btn" onClick={onExit}>탁자 닫기</button>}
    </div>
    {rounds.length > 0 && <p className="ddg-note">{rounds.map((round, index) => `${index + 1}판 ${round.me}:${round.pixel}`).join(' · ')}</p>}
  </section>
}

/* ── 미션 빙고 (탁자 위 종이 카드) ── */
export function BingoBoard({ onExit }: { onExit: ExitFn }) {
  const [checked, setChecked] = useState<string[]>([])
  const [round, setRound] = useState(0)
  const size = 4
  const lines = useMemo(() => {
    const rows: string[][] = []
    for (let row = 0; row < size; row += 1) rows.push(BINGO.slice(row * size, row * size + size).map((cell) => cell.id))
    for (let col = 0; col < size; col += 1) rows.push(Array.from({ length: size }, (_, row) => BINGO[row * size + col].id))
    rows.push(Array.from({ length: size }, (_, index) => BINGO[index * size + index].id))
    rows.push(Array.from({ length: size }, (_, index) => BINGO[index * size + (size - 1 - index)].id))
    return rows
  }, [])
  const done = lines.filter((line) => line.every((id) => checked.includes(id))).length

  return <section className="ddg-bingo" aria-label="미션 빙고" key={round}>
    <div className="ddg-word-head">
      <span>빙고 <strong>{done}</strong>줄</span>
      <span>{checked.length} / {BINGO.length} 미션</span>
      <button type="button" className="ddg-btn ddg-btn-mini" onClick={() => { setChecked([]); setRound((value) => value + 1) }}>새 카드</button>
    </div>
    <div className="ddg-bingo-card">
      {BINGO.map((cell) => <button
        type="button"
        key={cell.id}
        aria-pressed={checked.includes(cell.id)}
        className={`ddg-bingo-cell${checked.includes(cell.id) ? ' is-on' : ''}`}
        onClick={() => setChecked((value) => value.includes(cell.id) ? value.filter((id) => id !== cell.id) : [...value, cell.id])}
      >
        <strong>{cell.text}</strong>
        <small>{cell.hint}</small>
        <i aria-hidden="true">✓</i>
      </button>)}
    </div>
    <p className={`ddg-notice${done >= 2 ? ' is-good' : ''}`} role="status">{done === 0 ? '오늘 해 본 미션을 눌러 지워 보세요. 한 줄이 완성되면 빙고!' : done >= 2 ? `${done}줄 빙고! 오늘 파티 장인입니다.` : '한 줄 완성! 두 줄에 도전해 보세요.'}</p>
    <div className="ddg-actions"><button type="button" className="ddg-btn" onClick={onExit}>탁자 닫기</button></div>
    <p className="ddg-note">미션은 모두 딩동이 만든 로컬 놀이이며, 인증이나 순위 집계는 없어요.</p>
  </section>
}
