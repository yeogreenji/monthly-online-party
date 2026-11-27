// 같은 방의 로그인 이용자끼리 미니게임 10종을 함께 하는 탁자.
// 혼자 놀 때는 기존 게임판(boards.tsx)을 그대로 쓰고, 2명 이상 함께 모드에서 이 화면이 열린다.
import { useState } from 'react'
import { Users, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import type { GameId } from '../../data/minigames'
import { BALANCE, BINGO, PICTURES, QUIZ, RIDDLES, ROULETTE } from '../../data/minigames'
import { GAME_HOWTO, usePartyGame, type PartyPlayer } from '../../lib/partyGame'

export type MultiTableProps = {
  game: GameId
  topicId: string | null
  me: PartyPlayer | null
  players: PartyPlayer[]
}

export function MultiTable({ game, topicId, me, players }: MultiTableProps) {
  const { state, connected, error, act, reset, isHost } = usePartyGame(topicId, game, me, players)
  const [text, setText] = useState('')
  const d = state.data as Record<string, any>
  const mine = me?.id ?? ''

  if (!me) return <div className="ddm-multi-empty"><Users size={26}/><p>함께 플레이는 로그인 후 이용할 수 있어요. 혼자 놀기는 그대로 됩니다.</p></div>
  const others = players.filter((p) => p.id !== mine)

  const rollWords = () => {
    const value = text.trim()
    if (!value) return
    act({ type: 'word', text: value })
    setText('')
  }
  const guess = () => {
    const value = text.trim()
    if (!value) return
    act({ type: 'guess', text: value })
    setText('')
  }

  const body = (() => {
    switch (game) {
      case 'balance': {
        const set = BALANCE[(d.set as number) ?? 0]
        const votes = (d.votes as Record<string, string>) ?? {}
        return <>
          <p className="ddm-multi-q">{set.a} <em>vs</em> {set.b}</p>
          <div className="ddm-multi-choices">
            <button type="button" aria-pressed={votes[mine] === 'a'} onClick={() => act({ type: 'vote', choice: 'a' })}><strong>{set.a}</strong><small>{set.aTag}</small></button>
            <button type="button" aria-pressed={votes[mine] === 'b'} onClick={() => act({ type: 'vote', choice: 'b' })}><strong>{set.b}</strong><small>{set.bTag}</small></button>
          </div>
          <ul className="ddm-votes">{players.map((p) => <li key={p.id}><span>{p.nickname}</span><em>{votes[p.id] ? (votes[p.id] === 'a' ? set.a : set.b) : '고르는 중…'}</em></li>)}</ul>
          {d.line && <p className="ddm-multi-result">{d.line}</p>}
        </>
      }
      case 'quiz': {
        const item = QUIZ[(d.q as number) ?? 0]
        const answers = (d.answers as Record<string, boolean>) ?? {}
        const scores = (d.scores as Record<string, number>) ?? {}
        return <>
          <p className="ddm-multi-q"><small>{item.cat}</small>{item.q}</p>
          <div className="ddm-multi-choices two">
            <button type="button" aria-pressed={answers[mine] === true} onClick={() => act({ type: 'answer', value: true })}><strong>O</strong><small>맞다</small></button>
            <button type="button" aria-pressed={answers[mine] === false} onClick={() => act({ type: 'answer', value: false })}><strong>X</strong><small>아니다</small></button>
          </div>
          <ul className="ddm-votes">{players.map((p) => <li key={p.id}><span>{p.nickname}</span><em>{answers[p.id] === undefined ? '생각 중…' : answers[p.id] ? 'O' : 'X'} · {scores[p.id] ?? 0}점</em></li>)}</ul>
          {d.reveal && <div className="ddm-multi-result"><strong>정답 {item.answer ? 'O' : 'X'}</strong><p>{item.why}</p>{isHost && <button type="button" onClick={() => act({ type: 'next' })}>다음 문제</button>}</div>}
        </>
      }
      case 'word': {
        const words = (d.words as string[]) ?? []
        return <>
          <p className="ddm-multi-q">마지막 글자 <strong>'{words[words.length - 1]?.slice(-1) ?? ''}'</strong>(으)로 이어 주세요.</p>
          <div className="ddm-chain">{words.map((w, i) => <span key={w + i}>{w}</span>)}</div>
          <div className="ddm-multi-input"><input aria-label="단어" value={text} maxLength={20} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') rollWords() }} placeholder="단어 입력"/><button type="button" onClick={rollWords}>말하기</button></div>
        </>
      }
      case 'riddle': {
        const item = RIDDLES[(d.r as number) ?? 0]
        const hints = Math.min((d.hints as number) ?? 1, item.hints.length)
        return <>
          <p className="ddm-multi-q"><small>{item.category} · 힌트 {hints}/{item.hints.length}</small>수수께끼의 답은?</p>
          <ul className="ddm-hints">{item.hints.slice(0, hints).map((h, i) => <li key={i}>{h}</li>)}</ul>
          {hints < item.hints.length && <button type="button" onClick={() => act({ type: 'hint' })}>힌트 하나 더 열기</button>}
          <div className="ddm-multi-input"><input aria-label="정답" value={text} maxLength={20} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') guess() }} placeholder="정답 입력"/><button type="button" onClick={guess}>말하기</button></div>
          {d.solved && <p className="ddm-multi-result">정답은 '{item.answer}'! · {item.note}</p>}
        </>
      }
      case 'picture': {
        const item = PICTURES[(d.p as number) ?? 0]
        const answers = (d.answers as Record<string, number>) ?? {}
        return <>
          <div className="ddm-picture" aria-label={item.caption}><span aria-hidden="true">🖼️</span><p>{item.caption}</p></div>
          <div className="ddm-multi-choices three">{item.options.map((o, i) => <button type="button" key={o} aria-pressed={answers[mine] === i} onClick={() => act({ type: 'pick', index: i })}><strong>{o}</strong></button>)}</div>
          {d.reveal && <div className="ddm-multi-result"><strong>정답 {item.answer}</strong>{isHost && <button type="button" onClick={() => act({ type: 'next' })}>다음 그림</button>}</div>}
        </>
      }
      case 'tictactoe': {
        const board = (d.board as string[]) ?? Array(9).fill('')
        const seq = [...players].sort((a, b) => a.id.localeCompare(b.id))
        const myMark = seq[0]?.id === mine ? 'X' : 'O'
        return <>
          <p className="ddm-multi-q">내 표시는 <strong>{myMark}</strong> · 지금 {d.winner ? '끝났어요' : `${d.turn} 차례`}</p>
          <div className="ddm-ttt" role="grid" aria-label="틱택토 판">{board.map((v, i) => <button type="button" role="gridcell" key={i} disabled={!!v || !!d.winner} onClick={() => act({ type: 'place', index: i })} aria-label={`${i + 1}번 칸 ${v || '비어 있음'}`}>{v}</button>)}</div>
          {d.winner && <p className="ddm-multi-result">{d.winner === 'draw' ? '무승부예요!' : `${d.winner} 승리!`}{isHost && <button type="button" onClick={() => act({ type: 'reset' })}>한 판 더</button>}</p>}
        </>
      }
      case 'twenty': {
        const questions = (d.questions as string[]) ?? []
        const answers = (d.answers as Record<string, string>) ?? {}
        return <>
          <p className="ddm-multi-q">스무고개 · 지금 {questions.length}번째 질문</p>
          {questions.length > 0 && <p className="ddm-ask">{questions[questions.length - 1]}</p>}
          <div className="ddm-multi-input"><input aria-label="질문" value={text} maxLength={80} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { act({ type: 'ask', text }); setText('') } }} placeholder="질문을 적어 보세요"/><button type="button" onClick={() => { act({ type: 'ask', text }); setText('') }}>묻기</button></div>
          {questions.length > 0 && <div className="ddm-row"><button type="button" onClick={() => act({ type: 'answer', value: 'yes' })}>예</button><button type="button" onClick={() => act({ type: 'answer', value: 'no' })}>아니오</button></div>}
          <ul className="ddm-votes">{players.map((p) => <li key={p.id}><span>{p.nickname}</span><em>{answers[p.id] === 'yes' ? '예' : answers[p.id] === 'no' ? '아니오' : '…'}</em></li>)}</ul>
        </>
      }
      case 'roulette': {
        const result = d.result as number | null
        return <>
          <p className="ddm-multi-q">오늘의 역할 룰렛 · 누가 돌려도 결과는 모두 같아요.</p>
          <div className={'ddm-roulette' + (result !== null ? ' is-spun' : '')} aria-live="polite">{result !== null ? <><span aria-hidden="true">🎉</span><strong>{ROULETTE[result].label}</strong><p>{ROULETTE[result].note}</p></> : <><span aria-hidden="true">🎡</span><p>돌려 주세요</p></>}</div>
          <button type="button" className="is-primary" onClick={() => act({ type: 'spin' })}>룰렛 돌리기</button>
        </>
      }
      case 'dice': {
        const rolls = (d.rolls as Record<string, number[]>) ?? {}
        const wins = (d.wins as Record<string, number>) ?? {}
        return <>
          <p className="ddm-multi-q">{d.round}판 · 3승 먼저!</p>
          <div className="ddm-dice">{players.map((p) => <div key={p.id}><span>{p.nickname}</span><em aria-label={rolls[p.id] ? `${rolls[p.id][0]}, ${rolls[p.id][1]}` : '아직 안 굴림'}>{rolls[p.id] ? `🎲${rolls[p.id][0]} 🎲${rolls[p.id][1]}` : '🎲 …'}</em><small>{wins[p.id] ?? 0}승</small></div>)}</div>
          <button type="button" className="is-primary" disabled={!!rolls[mine]} onClick={() => act({ type: 'roll', dice: [1 + Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 6)] })}>주사위 굴리기</button>
        </>
      }
      case 'bingo': {
        const checked = ((d.checked as Record<string, number[]>) ?? {})[mine] ?? []
        return <>
          <p className="ddm-multi-q">오늘 해 본 미션을 눌러 지워요. 한 줄이면 완성!</p>
          <div className="ddm-bingo">{BINGO.map((c, i) => <button type="button" key={c.id} aria-pressed={checked.includes(i)} onClick={() => act({ type: 'check', cell: i })} title={c.hint}><span>{c.text}</span></button>)}</div>
          {d.line && <p className="ddm-multi-result">한 줄 완성! 🎉</p>}
        </>
      }
    }
  })()

  return <div className="ddm-multi" data-testid="dd-multi-table" data-game={game}>
    <header className="ddm-multi-head">
      <span className="ddm-players">{players.map((p) => <b key={p.id} className={p.id === mine ? 'is-me' : ''}>{p.nickname}</b>)}</span>
      <span className={'ddm-conn' + (connected ? ' is-on' : '')}>{connected ? <Wifi size={14}/> : <WifiOff size={14}/>}{connected ? '실시간 연결' : '연결 중'}</span>
      {isHost && <button type="button" className="ddm-link" onClick={reset}><RefreshCw size={13}/> 판 새로 열기</button>}
    </header>
    <p className="ddm-howto">{GAME_HOWTO[game]}{others.length === 0 ? ' 지금은 나 혼자예요. 같은 방에 친구가 들어오면 함께 시작됩니다.' : ''}</p>
    {body}
    {state.log.length > 0 && <ul className="ddm-log" aria-label="게임 기록">{state.log.slice(0, 6).map((l) => <li key={l.id}>{l.text}</li>)}</ul>}
    {error && <p role="alert" className="ddm-error">{error}</p>}
  </div>
}
