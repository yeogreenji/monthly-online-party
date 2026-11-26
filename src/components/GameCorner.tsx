import { GAMES, type GameId } from '../data/minigames'

/** 주제방 안에서 게임 탁자를 여는 입체 카드 진열대. 실제 플레이는 GameStage(3D 방 위 탁자)에서 진행한다. */
export function GameCorner({ onOpen, highlight }: { onOpen: (id: GameId) => void; highlight?: GameId }) {
  const ordered = highlight ? [GAMES.find((game) => game.id === highlight)!, ...GAMES.filter((game) => game.id !== highlight)] : GAMES
  return <section className="ddg-corner" aria-label="픽셀의 게임 탁자">
    <div className="ddg-corner-head">
      <span className="ddg-corner-lamp" aria-hidden="true" />
      <div>
        <strong>픽셀의 게임 탁자</strong>
        <small>{GAMES.length}가지 게임 · 3D 방 위에서 바로 시작</small>
      </div>
    </div>
    <div className="ddg-corner-grid">
      {ordered.map((game) => <button
        type="button"
        key={game.id}
        className={`ddg-corner-card${highlight === game.id ? ' is-hot' : ''}`}
        style={{ ['--chip' as string]: game.felt, ['--chip-rim' as string]: game.rim }}
        onClick={() => onOpen(game.id)}
        aria-label={`${game.title} 시작`}
      >
        <span aria-hidden="true">{game.icon}</span>
        <strong>{game.title}</strong>
        <small>{game.tag}</small>
      </button>)}
    </div>
  </section>
}
