import { useState } from 'react'

type Mark = 'X' | 'O'
const lines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

export function BoardGame() {
  const [board, setBoard] = useState<(Mark | null)[]>(() => Array(9).fill(null))
  const turns = board.filter(Boolean).length
  const next: Mark = turns % 2 === 0 ? 'X' : 'O'
  const win = lines.find(([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c])
  const status = win ? `${board[win[0]]} 승리!` : turns === board.length ? '무승부예요.' : `${next} 차례`

  return <section aria-label="틱택토" className="dd-board-game">
    <p>한 기기에서 번갈아 두는 2인 게임</p>
    <p role="status">{status}</p>
    <div className="dd-board-grid" role="group" aria-label="틱택토 게임판">
      {board.map((mark, index) => <button
        type="button"
        key={index}
        aria-label={`${index + 1}번 칸 ${mark ?? '비어 있음'}`}
        disabled={Boolean(mark || win)}
        data-winning={win?.includes(index)}
        onClick={() => setBoard(board.map((value, cell) => cell === index ? next : value))}
      >{mark}</button>)}
    </div>
    <button type="button" onClick={() => setBoard(Array(9).fill(null))}>틱택토 새 판</button>
  </section>
}
