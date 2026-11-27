"""딩동 채팅 입력 E2E — 게임 라운지와 일반 방에서 실제 입력·전송·표시까지 확인한다.

실행:
  npm run dev -- --host 127.0.0.1 --port 4173 &
  python3 scripts/verify_chat_e2e.py            # 기본 http://127.0.0.1:4173
  DD_URL=http://127.0.0.1:4174 python3 scripts/verify_chat_e2e.py

확인 항목(데스크톱 1280x900, 모바일 390x844):
  1. 입력창이 화면 안에 들어오는지(잘리지 않는지)
  2. 한국어 타이핑 → Enter 전송 → 내 말풍선이 한 번만 표시
  3. 한국어 타이핑 → 전송 버튼 → 내 말풍선 표시
  4. 게임 라운지에서는 '게임 탁자' 트레이가 접혀 있어도 입력창이 보이는지
  5. 모임 열기 폼의 '모임 열기' 버튼이 화면 안에서 눌리는지
"""
import os, sys
os.makedirs('artifacts', exist_ok=True)
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get('DD_URL', 'http://127.0.0.1:4173')
MESSAGE_ENTER = '엔터로 보내는 첫 인사'
MESSAGE_BUTTON = '버튼으로 보내는 두 번째 인사'


SHOTS = os.environ.get('DD_SHOTS', '1') != '0'


def shot(page, path):
    """스크린샷은 검증 항목이 아니다 — 느린 렌더러/CI에서는 DD_SHOTS=0으로 끈다."""
    if not SHOTS:
        return
    try:
        page.screenshot(path=path, timeout=20000)
    except Exception:
        pass


def enter(page):
    page.goto(URL, wait_until='domcontentloaded')
    expect(page.get_by_role('button', name='딩동 입장하기', exact=True)).to_be_visible(timeout=20000)
    page.locator('#nickname').fill('채팅테스트')
    page.get_by_role('button', name='딩동 입장하기', exact=True).click()
    expect(page.locator('.dd-world-app')).to_be_visible(timeout=20000)


def open_menu(page):
    if not page.locator('.dd3-access-menu[open]').count():
        page.get_by_role('button', name='설정', exact=True).click()
        page.wait_for_timeout(350)


def close_menu(page):
    if page.locator('.dd3-access-menu[open]').count():
        page.get_by_role('button', name='설정', exact=True).click()
        page.wait_for_timeout(250)


def go(page, space):
    open_menu(page)
    page.locator('#dd3-dest').select_option(space)
    page.wait_for_timeout(200)
    page.get_by_role('button', name='바로 입장', exact=True).click()
    close_menu(page)
    page.wait_for_timeout(700)


def open_chat(page):
    button = page.locator('.dd3-collapse')
    expect(button).to_be_visible(timeout=8000)
    if '펼치기' in button.inner_text():
        button.click()
        page.wait_for_timeout(500)


def send_and_check(page, text, use_enter, label):
    field = page.get_by_role('textbox', name='메시지', exact=True)
    expect(field).to_be_visible(timeout=8000)
    # 입력창이 화면 안에 있는지(잘리지 않았는지) 확인
    box = field.bounding_box()
    view = page.viewport_size
    assert box is not None, f'{label}: 입력창 좰표를 읽지 못함'
    assert box['y'] >= 0 and box['y'] + box['height'] <= view['height'] + 1, (
        f'{label}: 입력창이 화면 밖 y={box["y"]:.0f} 화면높이={view["height"]}')
    field.click()
    field.fill('')
    page.keyboard.type(text, delay=12)
    assert field.input_value() == text, f'{label}: 타이핑이 입력되지 않음'
    if use_enter:
        page.keyboard.press('Enter')
    else:
        send = page.get_by_role('button', name='전송', exact=True)
        send_box = send.bounding_box()
        assert send_box['y'] + send_box['height'] <= view['height'] + 1, f'{label}: 전송 버튼이 화면 밖'
        send.click()
    expect(page.locator('.dd-message-log').get_by_text(text, exact=True)).to_be_visible(timeout=8000)
    page.wait_for_timeout(300)
    count = page.locator('.dd-message-log').get_by_text(text, exact=True).count()
    assert count == 1, f'{label}: 말풍선이 {count}개(중복 전송)'


with sync_playwright() as p:
    browser = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    for width, height, tag in [(1280, 900, 'desktop'), (390, 844, 'mobile')]:
        page = browser.new_page(viewport={'width': width, 'height': height}, reduced_motion='reduce')
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        enter(page)
        shot(page, f'artifacts/chat-{tag}-01-street.png')

        # 1) 게임 라운지 — 게임 탁자 트레이 + 채팅 입력
        go(page, 'games')
        open_chat(page)
        page.locator('.dd-room-join').first.click()
        page.wait_for_timeout(700)
        expect(page.locator('.ddg-tray > summary')).to_be_visible(timeout=8000)
        shot(page, f'artifacts/chat-{tag}-02-games-room.png')
        send_and_check(page, MESSAGE_ENTER, True, f'{tag} 게임 라운지 엔터')
        send_and_check(page, MESSAGE_BUTTON, False, f'{tag} 게임 라운지 전송 버튼')

        # 트레이를 펼친 뒤에도 입력창이 남아 있어야 한다
        page.locator('.ddg-tray > summary').click()
        page.wait_for_timeout(450)
        field = page.get_by_role('textbox', name='메시지', exact=True)
        box = field.bounding_box()
        assert box['y'] + box['height'] <= height + 1, f'{tag}: 트레이 펼침 뒤 입력창이 화면 밖'
        shot(page, f'artifacts/chat-{tag}-03-tray-open.png')
        page.locator('.ddg-tray > summary').click()

        # 2) 일반 방(카페) — 채팅 입력
        go(page, 'cafe')
        open_chat(page)
        shot(page, f'artifacts/chat-{tag}-04-cafe-lobby.png')
        page.locator('.dd-room-join').first.click()
        page.wait_for_timeout(700)
        send_and_check(page, MESSAGE_ENTER, True, f'{tag} 카페 엔터')
        send_and_check(page, MESSAGE_BUTTON, False, f'{tag} 카페 전송 버튼')
        shot(page, f'artifacts/chat-{tag}-05-cafe-room.png')

        # 3) 모임 열기 폼 — 버튼이 화면 안
        page.get_by_role('button', name='모임 목록', exact=True).click()
        page.wait_for_timeout(500)
        page.get_by_role('button', name='모임 열기', exact=True).click()
        page.wait_for_timeout(500)
        form = page.locator('.dd-create-meeting')
        form.scroll_into_view_if_needed()
        page.wait_for_timeout(350)
        go_button = page.locator('.dd-create-foot .dd-go')
        gbox = go_button.bounding_box()
        assert gbox['y'] + gbox['height'] <= height + 1, f'{tag}: 모임 열기 버튼이 화면 밖'
        shot(page, f'artifacts/chat-{tag}-06-create.png')
        page.locator('.dd-create-body input').nth(0).fill('폰에서 여는 모임')
        go_button.click()
        page.wait_for_timeout(800)
        expect(page.get_by_role('textbox', name='메시지', exact=True)).to_be_visible(timeout=8000)
        send_and_check(page, '새로 연 모임에서 인사', True, f'{tag} 새 모임 엔터')

        assert not errs, errs
        print(f'PASS {width}x{height}: 게임 라운지·카페·새 모임 채팅 입력/전송/표시')
        page.close()
    browser.close()
