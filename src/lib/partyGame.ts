// 미니게임 10종을 같은 방의 로그인 이용자끼리 함께 하는 실시간 탁자.
// Supabase Realtime Broadcast로 상태를 주고받고, 방에 처음 들어온 사람(정렬된 id의 첫 사람)이
// 진행자(host)로서 정답·차례·결과를 확정한다. 서버 테이블 없이도 새로고침 전까지 이어진다.
import { useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { GameId } from '../data/minigames'
import { BALANCE, BINGO, PICTURES, QUIZ, RIDDLES, ROULETTE } from '../data/minigames'

export type PartyPlayer = { id: string; nickname: string }
export type PartyAction = { type: string; [k: string]: unknown }
export type PartyLog = { id: string; text: string; at: number }
export type PartyState = {
  game: GameId
  round: number
  phase: 'waiting' | 'playing' | 'result'
  turn: string | null
  data: Record<string, unknown>
  log: PartyLog[]
  rev: number
  by: string
}

const rid = () => (globalThis.crypto?.randomUUID?.() ?? String(Math.random()).slice(2))
const push = (state: PartyState, text: string): PartyState => ({
  ...state,
  log: [{ id: rid(), text, at: Date.now() }, ...state.log].slice(0, 30),
})

export const GAME_HOWTO: Record<GameId, string> = {
  balance: '두 카드 중 하나를 고르면 모두의 선택이 모이고, 전원이 고르면 결과가 열려요.',
  quiz: 'O/X를 고르면 점수가 쌓여요. 전원이 답하면 다음 문제로 넘어갈 수 있어요.',
  word: '마지막 글자로 시작하는 단어를 번갈아 말해요. 차례가 아니면 기다려 주세요.',
  riddle: '힌트를 하나씩 열고 정답을 채팅으로 맞혀 보세요. 먼저 맞히면 점수.',
  picture: '그림을 보고 이름을 고르면 돼요. 전원이 고르면 다음 그림으로.',
  tictactoe: '두 사람이 X와 O를 나눠 가며 3×3 판에 놓아요. 차례는 자동으로 넘어가요.',
  twenty: '질문을 하나씩 올리고 모두가 예/아니오로 답해요. 20개까지.',
  roulette: '누가 돌려도 결과는 모두에게 똑같이 보여요. 오늘의 역할을 나눠 가져요.',
  dice: '둘 다 주사위를 굴려 합이 큰 사람이 한 판. 3판 먼저 이기면 승리!',
  bingo: '각자 카드에서 미션을 지워요. 누가 먼저 한 줄을 만들면 축하가 떠요.',
}

export function initState(game: GameId): PartyState {
  const base: PartyState = { game, round: 1, phase: 'playing', turn: null, data: {}, log: [], rev: 1, by: '' }
  switch (game) {
    case 'balance': return { ...base, data: { set: 0, votes: {}, line: '' } }
    case 'quiz': return { ...base, data: { q: 0, answers: {}, scores: {}, reveal: false } }
    case 'word': return { ...base, data: { words: ['사과'], turn: null, out: [] } }
    case 'riddle': return { ...base, data: { r: 0, hints: 1, solved: false } }
    case 'picture': return { ...base, data: { p: 0, answers: {}, scores: {}, reveal: false } }
    case 'tictactoe': return { ...base, data: { board: Array(9).fill(''), turn: 'X', winner: '' } }
    case 'twenty': return { ...base, data: { questions: [], answers: {}, count: 0 } }
    case 'roulette': return { ...base, data: { result: null } }
    case 'dice': return { ...base, data: { rolls: {}, wins: {}, round: 1 } }
    case 'bingo': return { ...base, data: { checked: {}, line: '' } }
  }
}

function order(players: PartyPlayer[]) {
  return [...players].sort((a, b) => a.id.localeCompare(b.id))
}

function lastName(word: string) {
  const clean = word.trim()
  return clean ? clean.slice(-1) : ''
}

/** host가 적용하는 규칙. 잘못된 동작은 로그만 남기고 상태를 유지한다. */
export function applyAction(state: PartyState, action: PartyAction, actor: PartyPlayer, players: PartyPlayer[]): PartyState {
  const d = { ...state.data } as Record<string, any>
  const all = players.length || 1
  const name = actor.nickname
  switch (state.game) {
    case 'balance': {
      if (action.type !== 'vote') return state
      const votes = { ...(d.votes as Record<string, string>) }
      votes[actor.id] = action.choice === 'b' ? 'b' : 'a'
      const done = Object.keys(votes).length >= all
      const set = BALANCE[(d.set as number) % BALANCE.length]
      return push({ ...state, data: { ...d, votes, line: done ? set.line : '' }, phase: done ? 'result' : 'playing', rev: state.rev + 1 }, done ? `모두 골랐어요. ${set.line}` : `${name}님이 ${votes[actor.id] === 'a' ? set.a : set.b}을(를) 골랐어요.`)
    }
    case 'quiz': {
      if (action.type === 'next') {
        const q = (d.q as number) + 1
        if (q >= QUIZ.length) return push({ ...state, phase: 'result', data: { ...d } }, '문제를 모두 풀었어요!')
        return push({ ...state, data: { ...d, q, answers: {}, reveal: false }, rev: state.rev + 1 }, '다음 문제로 넘어갔어요.')
      }
      if (action.type !== 'answer') return state
      const answers = { ...(d.answers as Record<string, boolean>) }
      answers[actor.id] = action.value === true
      const item = QUIZ[(d.q as number) % QUIZ.length]
      const scores = { ...(d.scores as Record<string, number>) }
      if (answers[actor.id] === item.answer) scores[actor.id] = (scores[actor.id] ?? 0) + 1
      const done = Object.keys(answers).length >= all
      return push({ ...state, data: { ...d, answers, scores, reveal: done }, rev: state.rev + 1 }, `${name}님 ${answers[actor.id] ? 'O' : 'X'} 선택${done ? ` · 정답은 ${item.answer ? 'O' : 'X'}` : ''}`)
    }
    case 'word': {
      if (action.type !== 'word') return state
      const text = String(action.text ?? '').trim()
      const words = (d.words as string[]) ?? []
      const last = lastName(words[words.length - 1] ?? '')
      const known = new Set(words.map((w) => w.trim()))
      if (!text) return state
      if (words.length > 1 && lastName(text) !== '') {
        if (text[0] !== last) return push(state, `'${last}(으)로 시작하는 단어를 말해 주세요.`)
      }
      if (known.has(text)) return push(state, `'${text}'는 이미 나왔어요.`)
      if (text.length < 2) return push(state, '두 글자 이상 단어로 이어 주세요.')
      return { ...push({ ...state, data: { ...d, words: [...words, text], turn: null }, rev: state.rev + 1 }, `${name}: ${text}`), turn: null }
    }
    case 'riddle': {
      if (action.type === 'hint') {
        const hints = Math.min((d.hints as number) + 1, RIDDLES[(d.r as number) % RIDDLES.length].hints.length)
        return push({ ...state, data: { ...d, hints }, rev: state.rev + 1 }, `힌트 ${hints}개째를 열었어요.`)
      }
      if (action.type === 'guess') {
        const item = RIDDLES[(d.r as number) % RIDDLES.length]
        const guess = String(action.text ?? '').trim()
        if (guess && guess === item.answer) {
          return push({ ...state, phase: 'result', data: { ...d, solved: true }, rev: state.rev + 1 }, `${name}님이 정답 '${item.answer}'을(를) 맞혔어요!`)
        }
        return push(state, `${name}: '${guess || '…'}' 아니에요. 다시!`)
      }
      return state
    }
    case 'picture': {
      if (action.type === 'next') {
        const p = (d.p as number) + 1
        if (p >= PICTURES.length) return push({ ...state, phase: 'result', data: { ...d } }, '그림을 모두 맞혔어요!')
        return push({ ...state, data: { ...d, p, answers: {}, reveal: false }, rev: state.rev + 1 }, '다음 그림으로 넘어갔어요.')
      }
      if (action.type !== 'pick') return state
      const item = PICTURES[(d.p as number) % PICTURES.length]
      const pick = Number(action.index)
      const answers = { ...(d.answers as Record<string, number>) }
      answers[actor.id] = pick
      const scores = { ...(d.scores as Record<string, number>) }
      if (item.options[pick] === item.answer) scores[actor.id] = (scores[actor.id] ?? 0) + 1
      const done = Object.keys(answers).length >= all
      return push({ ...state, data: { ...d, answers, scores, reveal: done }, rev: state.rev + 1 }, `${name}님이 '${item.options[pick] ?? '?'}' 선택${done ? ` · 정답은 ${item.answer}` : ''}`)
    }
    case 'tictactoe': {
      const seq = order(players)
      const mark = seq[0]?.id === actor.id ? 'X' : 'O'
      if (action.type === 'reset') return push({ ...initState('tictactoe') }, '판을 새로 폈어요.')
      if (action.type !== 'place') return state
      const board = [...(d.board as string[])]
      const index = Number(action.index)
      if (d.winner) return state
      if (board[index]) return state
      if (mark !== d.turn) return push(state, `지금은 ${d.turn} 차례예요.`)
      board[index] = mark
      const lines = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
      const win = lines.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c])
      if (win) return push({ ...state, phase: 'result', data: { ...d, board, winner: mark }, rev: state.rev + 1 }, `${mark === 'X' ? seq[0]?.nickname ?? 'X' : seq[1]?.nickname ?? 'O'}님이 이겼어요!`)
      if (board.every(Boolean)) return push({ ...state, phase: 'result', data: { ...d, board, winner: 'draw' }, rev: state.rev + 1 }, '무승부예요!')
      return { ...push({ ...state, data: { ...d, board, turn: mark === 'X' ? 'O' : 'X' }, rev: state.rev + 1 }, `${name}님이 ${index + 1}번 칸에 놓았어요.`), turn: null }
    }
    case 'twenty': {
      if (action.type === 'ask') {
        const questions = [...(d.questions as string[]), String(action.text ?? '').slice(0, 80)].filter(Boolean).slice(0, 20)
        return push({ ...state, data: { ...d, questions, answers: {}, count: questions.length }, rev: state.rev + 1 }, `${name}님 질문: ${action.text}`)
      }
      if (action.type !== 'answer') return state
      const answers = { ...(d.answers as Record<string, string>) }
      answers[actor.id] = action.value === 'yes' ? 'yes' : 'no'
      return push({ ...state, data: { ...d, answers }, rev: state.rev + 1 }, `${name}님 ${answers[actor.id] === 'yes' ? '예' : '아니오'}`)
    }
    case 'roulette': {
      if (action.type !== 'spin') return state
      const result = Math.floor(Math.random() * ROULETTE.length)
      return push({ ...state, data: { result }, phase: 'result', rev: state.rev + 1 }, `룰렛 결과: ${ROULETTE[result].label}`)
    }
    case 'dice': {
      if (action.type !== 'roll') return state
      const dice = Array.isArray(action.dice) ? (action.dice as number[]).map((n) => Math.min(6, Math.max(1, Number(n) || 1))) : [1, 1]
      const rolls = { ...(d.rolls as Record<string, number[]>) }
      rolls[actor.id] = dice
      const wins = { ...(d.wins as Record<string, number>) }
      let round = d.round as number
      let text = `${name}님 ${dice[0]}+${dice[1]}=${dice[0] + dice[1]}`
      if (Object.keys(rolls).length >= all) {
        const ranked = Object.entries(rolls).map(([id, v]) => ({ id, sum: v[0] + v[1] }))
        const best = Math.max(...ranked.map((r) => r.sum))
        const winners = ranked.filter((r) => r.sum === best)
        if (winners.length === 1) {
          wins[winners[0].id] = (wins[winners[0].id] ?? 0) + 1
          const nm = players.find((p) => p.id === winners[0].id)?.nickname ?? '이웃'
          text += ` · ${nm}님이 이번 판 승리 (${wins[winners[0].id]}승)`
        } else text += ' · 무승부예요'
        round += 1
        const champ = Object.entries(wins).find(([, n]) => n >= 3)
        if (champ) {
          const nm = players.find((p) => p.id === champ[0])?.nickname ?? '이웃'
          return push({ ...state, phase: 'result', data: { ...d, wins, rolls, round }, rev: state.rev + 1 }, `${nm}님이 3승으로 이겼어요!`)
        }
        return push({ ...state, data: { ...d, wins, rolls: {}, round }, rev: state.rev + 1 }, text)
      }
      return push({ ...state, data: { ...d, rolls }, rev: state.rev + 1 }, text)
    }
    case 'bingo': {
      if (action.type !== 'check') return state
      const checked = { ...(d.checked as Record<string, number[]>) }
      const mine = new Set(checked[actor.id] ?? [])
      const cell = Number(action.cell)
      if (mine.has(cell)) mine.delete(cell)
      else mine.add(cell)
      checked[actor.id] = [...mine]
      const lines = [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11], [12, 13, 14, 15], [0, 4, 8, 12], [1, 5, 9, 13], [2, 6, 10, 14], [3, 7, 11, 15], [0, 5, 10, 15], [3, 6, 9, 12]]
      const line = lines.find((l) => l.every((n) => mine.has(n)))
      if (line) return push({ ...state, phase: 'result', data: { ...d, checked, line: actor.id }, rev: state.rev + 1 }, `${name}님이 한 줄을 완성했어요! 🎉`)
      return push({ ...state, data: { ...d, checked }, rev: state.rev + 1 }, `${name}님이 ${BINGO[cell]?.text ?? '미션'} 칸을 ${mine.has(cell) ? '지웠어요' : '되돌렸어요'}.`)
    }
  }
}

export function usePartyGame(topicId: string | null, game: GameId, me: PartyPlayer | null, players: PartyPlayer[]) {
  const [state, setState] = useState<PartyState>(() => initState(game))
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')
  const channelRef = useRef<RealtimeChannel | null>(null)
  const stateRef = useRef<PartyState>(state)
  const playersRef = useRef(players)
  playersRef.current = players
  const meRef = useRef(me)
  meRef.current = me
  const seq = order(players)
  const hostId = seq[0]?.id ?? null
  const isHost = !!me && hostId === me.id

  useEffect(() => {
    if (!supabase || !topicId) { setConnected(false); return }
    const client = supabase
    const ch = client.channel(`dd-game:${topicId}:${game}`, { config: { broadcast: { self: false } } })
    channelRef.current = ch
    const local = initState(game)
    stateRef.current = local
    setState(local)
    const sendState = () => {
      if (!meRef.current) return
      void ch.send({ type: 'broadcast', event: 'state', payload: { ...stateRef.current, by: meRef.current.id } })
    }
    const apply = (s: PartyState) => { stateRef.current = s; setState(s) }
    ch.on('broadcast', { event: 'hello' }, () => { if (hostId === meRef.current?.id) sendState() })
    ch.on('broadcast', { event: 'state' }, (msg) => {
      const next = msg.payload as PartyState
      if (!next || next.game !== game) return
      if (next.rev >= stateRef.current.rev) apply(next)
    })
    ch.on('broadcast', { event: 'action' }, (msg) => {
      const p = msg.payload as { action: PartyAction; actor: PartyPlayer }
      if (!p?.actor) return
      if (hostId !== meRef.current?.id) return
      const next = applyAction(stateRef.current, p.action, p.actor, playersRef.current)
      apply(next)
      sendState()
    })
    ch.on('broadcast', { event: 'reset' }, () => { if (hostId === meRef.current?.id) { const next = initState(game); apply(next); sendState() } })
    ch.subscribe((status) => {
      const ok = status === 'SUBSCRIBED'
      setConnected(ok)
      if (ok) void ch.send({ type: 'broadcast', event: 'hello', payload: { id: meRef.current?.id } })
    })
    return () => { channelRef.current = null; void client.removeChannel(ch) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, game])

  const act = (action: PartyAction) => {
    const actor = meRef.current
    if (!actor) { setError('로그인하면 함께 플레이할 수 있어요.'); return }
    if (!channelRef.current) { setError('실시간 연결을 기다려 주세요.'); return }
    setError('')
    if (hostId === actor.id) {
      const next = applyAction(stateRef.current, action, actor, playersRef.current)
      stateRef.current = next
      setState(next)
      void channelRef.current.send({ type: 'broadcast', event: 'state', payload: { ...next, by: actor.id } })
    } else {
      void channelRef.current.send({ type: 'broadcast', event: 'action', payload: { action, actor } })
    }
  }
  const reset = () => {
    const actor = meRef.current
    if (!actor || hostId !== actor.id) { setError('방장만 판을 새로 열 수 있어요.'); return }
    const next = initState(game)
    stateRef.current = next
    setState(next)
    void channelRef.current?.send({ type: 'broadcast', event: 'reset', payload: {} })
    void channelRef.current?.send({ type: 'broadcast', event: 'state', payload: { ...next, by: actor.id } })
  }
  return { state, connected, error, act, reset, hostId, isHost, players: seq }
}
