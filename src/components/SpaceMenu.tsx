import type { MenuAction, SpaceContent } from '../data/masterContent'
import { ACTIVITY_TOTAL, MENU_TOTAL } from '../data/masterContent'

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

/** 공간별 고유 메뉴판 + 정본 활동 10개. 소품(3D 메뉴판)을 눌러도 이 화면이 열린다. */
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
    <div className="dd-world-pop dd-space-menu" role="dialog" aria-label={`${space.name} 메뉴`} data-space={space.id}>
      <div className="dd-pop-title">
        <strong>{space.name} 메뉴판</strong>
        <button className="dd3-btn" onClick={onClose}>닫기</button>
      </div>
      <p className="dd-space-concept">{space.concept}</p>
      <p className="dd-menu-count">
        이 공간 메뉴 {space.menu.length}개 · 활동 {space.activities.length}개
        <small> (마을 전체 활동 {ACTIVITY_TOTAL}개 · 메뉴 {MENU_TOTAL}개)</small>
      </p>
      {resident && onTalk && (
        <button type="button" className="dd3-btn dd-talk-owner" onClick={onTalk}>
          {resident}와 대화하기
        </button>
      )}
      <div className="dd-menu-grid" role="group" aria-label={`${space.name} 고유 메뉴`}>
        {space.menu.map((item) => (
          <button
            key={item.label}
            type="button"
            data-menu-label={item.label}
            data-menu-action={item.action}
            onClick={() => onMenu(item.action)}
          >
            <strong>{item.label}</strong>
            <small>{ACTION_HINT[item.action]}</small>
          </button>
        ))}
      </div>
      <h3 className="dd-activity-head">
        이 공간의 활동 <small>{space.activities.length}개</small>
      </h3>
      {locked && (
        <p className="dd-space-locked" role="status">
          연령·안전 확인 전에는 구경만 할 수 있어요. 활동 목록은 그대로 볼 수 있지만, 방을 열거나 대화에 들어갈 수는 없어요.
        </p>
      )}
      <ul className="dd-activity-grid" aria-label={`${space.name} 활동 ${space.activities.length}개`}>
        {space.activities.map((title) => (
          <li key={title}>
            <button type="button" data-activity={title} onClick={() => onActivity(title)}>
              <span aria-hidden="true">·</span>
              {title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
