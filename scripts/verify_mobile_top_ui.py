"""모바일(390x844) 상단·플로팅 버튼 겹침 0건 검증.

- 광장/실내(카페·게임·게임탁자)/미니룸(내 집)/구경 모드/채팅 전개/초대장 열림/도구 메뉴/재미 요소
  각 상태에서 보이는 플로팅 버튼끼리 bounding box가 1px도 겹치지 않아야 한다.
- 버튼은 뷰포트 밖으로 잘리지 않아야 한다.
- 초대장·도구 메뉴·팝업 패널이 열린 동안에는 뒤에 깔린 플로팅 버튼이 보이지 않아야 한다
  (열린 패널 자체는 레이어이므로 겹침 계산에서 제외).
"""
import sys
from playwright.sync_api import sync_playwright, expect

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:4173'

# 화면 위에 떠 있는 동작 버튼들
CONTROLS = ['.dd3-title', '.dd-quick-links', '.dd-map-views', '.dd-room-actions', '.dd-bell-shortcut',
            '.dd-home-actions', '.dd-camera-control', '.ddg-float-launch', '.dd-preview-notice',
            '.dd3-world-hint', '.dd-world-nav']
# 사용자가 연 패널(레이어) — 뒤 버튼이 가려지는 것이 정상
PANELS = ['.dd3-story', '.dd3-access-menu[open]', '.dd-fun-panel', '.dd-space-menu', '.dd-home-panel',
          '.dd-photo-lightbox', '.dd-app-panel']

JS = r"""
(args) => {
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 4 && r.height >= 4 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };
  const out = {controls: [], overlaps: [], clipped: [], panels: [], leaks: []};
  for (const s of args.controls) for (const el of document.querySelectorAll(s)) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    out.controls.push({s, box: [r.left, r.top, r.width, r.height]});
    if (r.left < -0.5 || r.top < -0.5 || r.right > innerWidth + 0.5 || r.bottom > innerHeight + 0.5) {
      out.clipped.push({s, box: [r.left, r.top, r.width, r.height]});
    }
  }
  for (let i = 0; i < out.controls.length; i++) for (let j = i + 1; j < out.controls.length; j++) {
    const A = out.controls[i].box, B = out.controls[j].box;
    const x = Math.min(A[0] + A[2], B[0] + B[2]) - Math.max(A[0], B[0]);
    const y = Math.min(A[1] + A[3], B[1] + B[3]) - Math.max(A[1], B[1]);
    if (x > 0.5 && y > 0.5) out.overlaps.push({a: out.controls[i].s, b: out.controls[j].s, ox: x, oy: y,
      abox: A.map(Math.round), bbox: B.map(Math.round)});
  }
  for (const s of args.panels) for (const el of document.querySelectorAll(s)) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    out.panels.push({s, box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]});
  }
  return out;
}
"""

FAILED = []

def check(page, tag):
    r = page.evaluate(JS, {'controls': CONTROLS, 'panels': PANELS})
    names = ", ".join(f"{c['s']}@{[round(v) for v in c['box']]}" for c in r['controls'])
    print(f"[{tag}] 버튼 {len(r['controls'])}개 · 겹침 {len(r['overlaps'])} · 잘림 {len(r['clipped'])}")
    print(f"    {names}")
    for o in r['overlaps']:
        print(f"    FAIL 겹침: {o['a']} {o['abox']} X {o['b']} {o['bbox']} ({o['ox']:.0f}x{o['oy']:.0f}px)")
        FAILED.append(f"{tag}: {o['a']} X {o['b']}")
    for c in r['clipped']:
        print(f"    FAIL 잘림: {c['s']} {[round(v) for v in c['box']]}")
        FAILED.append(f"{tag}: clipped {c['s']}")
    # 패널이 열려 있으면 뒤 버튼은 감춰져 있어야 한다
    if r['panels']:
        for p in r['panels']:
            print(f"    열린 패널: {p['s']} {p['box']} → 남은 버튼 {[c['s'] for c in r['controls']]}")
    return r

def tap(page, name, exact=True):
    page.get_by_role('button', name=name, exact=exact).tap()

def close_story(page):
    if page.locator('.dd3-story').count():
        page.locator('.dd3-story button').first.tap()
        page.wait_for_timeout(250)

with sync_playwright() as p:
    browser = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width': 390, 'height': 844}, has_touch=True, is_mobile=True, reduced_motion='reduce')
    page.set_default_timeout(25000)
    page.goto(BASE)
    page.locator('#nickname').fill('모바일 겹침 검증')
    tap(page, '딩동 입장하기')
    expect(page.locator('.dd3-canvas canvas')).to_be_visible(timeout=30000)
    page.wait_for_timeout(2500)

    # 1) 광장
    check(page, '광장')
    expect(page.locator('.dd-room-actions')).to_be_visible()
    expect(page.locator('.dd-bell-shortcut')).to_be_visible()

    # 2) 초대장(이야기) 열림 → 뒤 플로팅 버튼은 모두 감춤
    tap(page, '초대장 열기')
    page.wait_for_timeout(400)
    r = check(page, '광장+초대장')
    expect(page.locator('.dd3-story')).to_be_visible()
    for sel in ('.dd-quick-links', '.dd-map-views', '.dd-room-actions', '.dd-bell-shortcut', '.dd-camera-control'):
        expect(page.locator(sel)).to_be_hidden()
    tap(page, '이야기 닫기')
    page.wait_for_timeout(300)

    # 3) 이동·공간 메뉴 열림
    tap(page, '설정')
    page.wait_for_timeout(500)
    check(page, '광장+도구메뉴')
    expect(page.locator('.dd3-access-menu[open]')).to_be_visible()
    for sel in ('.dd-quick-links', '.dd-map-views', '.dd-room-actions', '.dd-bell-shortcut'):
        expect(page.locator(sel)).to_be_hidden()
    tap(page, '설정')
    page.wait_for_timeout(400)

    # 4) 재미 요소 8종 패널
    tap(page, '재미 요소 8종')
    page.wait_for_timeout(700)
    check(page, '광장+재미요소')
    expect(page.locator('.dd-fun-panel')).to_be_visible()
    expect(page.locator('.dd-world-nav')).to_be_hidden()
    page.locator('.dd-fun-close').tap()
    page.wait_for_timeout(500)

    settings = page.get_by_role('button', name='설정', exact=True)
    dest = page.locator('#dd3-dest')

    def enter(room, preview=False):
        close_story(page)
        if not dest.is_visible():
            settings.tap()
        dest.select_option(room)
        page.get_by_role('button', name='공간 구경' if preview else '바로 입장', exact=True).tap()
        page.wait_for_timeout(2000)

    def leave():
        close_story(page)
        if not dest.is_visible():
            settings.tap()
        page.get_by_role('button', name='복도로 걷기', exact=True).tap()
        page.wait_for_timeout(1800)

    # 5) 실내(카페) — 채팅 전개 상태
    enter('cafe')
    check(page, '카페')
    expect(page.locator('.dd3-canvas canvas')).to_have_attribute('data-room', 'cafe', timeout=20000)
    leave()

    # 6) 게임 라운지 — 채팅 접고 게임 탁자 버튼 확인
    enter('games')
    check(page, '게임라운지')
    page.locator('.dd3-chat .dd3-collapse').first.tap()
    page.wait_for_timeout(900)
    check(page, '게임라운지+채팅접힘')
    if page.locator('.ddg-float-launch').count():
        tap(page, '게임 탁자 열기')
        page.wait_for_timeout(1200)
        check(page, '게임탁자')
        page.keyboard.press('Escape')
        page.wait_for_timeout(600)
    leave()

    # 7) 미니룸(내 집)
    enter('home')
    check(page, '내집')
    leave()

    # 8) 구경 모드(입장 잠금 공간)
    enter('jazz', preview=True)
    check(page, '재즈바 구경')
    expect(page.locator('.dd-preview-notice')).to_be_visible()
    leave()

    # 9) 채팅 전체 화면
    enter('cafe')
    tap(page, '채팅 전체 화면')
    page.wait_for_timeout(800)
    check(page, '카페+채팅전체')
    expect(page.locator('.dd-chat-full')).to_be_visible()

    # 10) 채팅 전체 화면에서 빠져나와 광장으로 돌아간 뒤, 다른 폭에서도 확인 (360·430)
    if page.get_by_role('button', name='채팅에서 광장으로 돌아가기', exact=True).count():
        page.get_by_role('button', name='채팅에서 광장으로 돌아가기', exact=True).tap()
    else:
        tap(page, '채팅 전체 화면')
    page.wait_for_timeout(1800)
    check(page, '카페 복귀')
    for w, h in ((360, 800), (430, 932)):
        page.set_viewport_size({'width': w, 'height': h})
        page.wait_for_timeout(1200)
        check(page, f'{w}x{h}')

    browser.close()

if FAILED:
    print("\nFAIL:", len(FAILED), "건")
    for f in FAILED:
        print("  -", f)
    sys.exit(1)
print("\nPASS: 모바일(390x844) 상단·플로팅 버튼 겹침 0건 · 잘림 0건 · 패널 열림 시 뒤 버튼 숨김 확인")
