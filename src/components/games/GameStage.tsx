import { useEffect, useRef } from 'react'
import { GAMES, GAME_BY_ID, type GameId } from '../../data/minigames'
import {
  BalanceBoard, BingoBoard, DiceBoard, PictureBoard, QuizBoard, RiddleBoard, RouletteBoard, TicTacToeBoard, TwentyBoard, WordBoard,
} from './boards'

export type GameStageProps = {
  game: GameId
  onChange: (id: GameId) => void
  onClose: () => void
  /** 게임을 열어 준 공간 이름 (예: 게임 라운지) */
  roomLabel?: string
}

/** 3D 방 위에 놓인 게임 탁자. 바깥 3D 월드는 그대로 살아 있고, 탁자와 소품만 입체로 얹힌다. */
export function GameStage({ game, onChange, onClose, roomLabel = '게임 라운지' }: GameStageProps) {
  const meta = GAME_BY_ID[game]
  const shell = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  const board = (() => {
    switch (game) {
      case 'balance': return <BalanceBoard onExit={onClose} />
      case 'quiz': return <QuizBoard onExit={onClose} />
      case 'word': return <WordBoard onExit={onClose} />
      case 'riddle': return <RiddleBoard onExit={onClose} />
      case 'picture': return <PictureBoard onExit={onClose} />
      case 'tictactoe': return <TicTacToeBoard onExit={onClose} />
      case 'twenty': return <TwentyBoard onExit={onClose} />
      case 'roulette': return <RouletteBoard onExit={onClose} />
      case 'dice': return <DiceBoard onExit={onClose} />
      case 'bingo': return <BingoBoard onExit={onClose} />
    }
  })()

  return <div className="ddg-stage" role="dialog" aria-label={`${meta.title} 게임 탁자`} ref={shell}>
    <div className="ddg-lamp" aria-hidden="true" />
    <div className="ddg-frame" style={{ ['--ddg-felt' as string]: meta.felt, ['--ddg-rim' as string]: meta.rim }}>
      <header className="ddg-head">
        <div className="ddg-head-title">
          <small>{roomLabel} · 픽셀의 탁자</small>
          <h2><span aria-hidden="true">{meta.icon}</span> {meta.title}</h2>
        </div>
        <div className="ddg-head-tools">
          <span className="ddg-tag">{meta.tag}</span>
          <button type="button" className="ddg-x" onClick={onClose} ref={closeRef} aria-label="게임 탁자 닫기">닫기</button>
        </div>
      </header>

      <div className="ddg-table">
        <div className="ddg-felt">
          <div className="ddg-board">{board}</div>
          <div className="ddg-table-corner" aria-hidden="true"><i /><i /><i /></div>
        </div>
      </div>

      <nav className="ddg-dock" aria-label="게임 바꾸기">
        <span className="ddg-dock-label">탁자 위 게임</span>
        <div className="ddg-dock-list">
          {GAMES.map((item) => <button
            type="button"
            key={item.id}
            aria-pressed={item.id === game}
            className="ddg-dock-btn"
            style={{ ['--chip' as string]: item.felt }}
            onClick={() => item.id !== game && onChange(item.id)}
          >
            <span aria-hidden="true">{item.icon}</span>
            <small>{item.title}</small>
          </button>)}
        </div>
      </nav>
    </div>
  </div>
}
