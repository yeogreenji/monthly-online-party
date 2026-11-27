import type { MenuAction, SpaceContent } from '../data/masterContent'

const ACTION_HINT: Record<MenuAction, string> = {
  party: '오늘의 초대장·파티 열기',
  calendar: '일정과 365일 편성 보기',
  photoWall: '포토월·사진 자랑',
  activities: '이 공간 활동 목록',
  create: '새 모임 열기',
  map: '마을 지도',
  bell: '초인종 울리기',
  wardrobe: '옷장 열기',
  minihome: '미니홈피',
  mail: '우편함',
  games: '게임 탁자',
  radio: '딩동 라디오',
  safety: '안전·이용 안내',
  menuCard: '오늘의 메뉴 카드',
  decor: '집 꾸미기',
}

/** 공간별 고유 메뉴판 + 정본 활동 10개. 소품(3D 메뉴판)을 눌러도 이 화면이 열린다.
    흰 네모 격자 대신 양피지·리본·도장이 있는 종이 메뉴판으로 그린다. */
export function SpaceMenuPanel({
  space,
  locked,
  resident,
  onTalk,
  onClose,
  onMenu,
  onActivity,
}: {
  space: SpaceContent
  locked: boolean
  resident?: string
  onTalk?: () => void
  onClose: () => void
  onMenu: (action: MenuAction) => void
  onActivity: (title: string) => void
}) {
  return (
    <div className="dd-world-pop dd-space-menu dd-craft-board" role="dialog" aria-label={`${space.name} 메뉴`} data-space={space.id}>
      <span className="dd-board-hook left" aria-hidden="true" />
      <span className="dd-board-hook right" aria-hidden="true" />
      <div className="dd-board-ribbon" aria-hidden="true"><span>공간 메뉴판</span></div>
      <button className="dd3-btn dd-board-close" onClick={onClose} aria-label="메뉴판 닫기">닫기</button>

      <header className="dd-board-title">
        <h3>{space.name} 메뉴판</h3>
        <p className="dd-space-concept">{space.concept}</p>
      </header>

      <div className="dd-board-rule" aria-hidden="true"><span>❦</span></div>

      <section className="dd-board-menus" role="group" aria-label={`${space.name} 고유 메뉴`}>
        {space.menu.map((item, index) => (
          <button
            key={item.label}
            type="button"
            className={'dd-board-menu' + (index === 0 ? ' is-signature' : '')}
            data-menu-label={item.label}
            data-menu-action={item.action}
            onClick={() => onMenu(item.action)}
          >
            <span className="dd-board-menu-name">{item.label}</span>
            {index === 0 && <span className="dd-board-stamp" aria-hidden="true">추천</span>}
            <span className="dd-board-leader" aria-hidden="true" />
            <small>{ACTION_HINT[item.action]}</small>
          </button>
        ))}
      </section>

      {resident && onTalk && (
        <button type="button" className="dd3-btn dd-talk-owner" onClick={onTalk}>
          {resident}와 대화하기
        </button>
      )}

      <div className="dd-board-section-head">
        <h3 className="dd-activity-head">
          이 공간의 활동 <small>{space.activities.length}개</small>
        </h3>
        <span className="dd-board-scribble" aria-hidden="true" />
      </div>
      {locked && (
        <p className="dd-space-locked" role="status">
          <strong>출입 안내</strong>
          연령·안전 확인 전에는 구경만 할 수 있어요. 활동 목록은 그대로 볼 수 있지만, 방을 열거나 대화에 들어갈 수는 없어요.
        </p>
      )}
      <ul className="dd-activity-grid" aria-label={`${space.name} 활동 ${space.activities.length}개`}>
        {space.activities.map((title) => (
          <li key={title}>
            <button type="button" data-activity={title} onClick={() => onActivity(title)}>
              <span className="dd-tag-hole" aria-hidden="true" />
              {title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
