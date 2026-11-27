"""딩동 3단계 E2E — 130개 활동·공간 메뉴판·365일 편성·주민 대화·사진 채팅·재미 요소 8종.

실행:
  npm run build
  PORT=4173 node scripts/serve.mjs &
  python3 scripts/verify_step3.py                 # 전체 (DD_PHASE=all)
  DD_PHASE=spaces python3 scripts/verify_step3.py  # 13공간·130활동만
  DD_PHASE=features python3 scripts/verify_step3.py # 나머지 기능만

확인 항목
  1. 13개 공간 메뉴판: 정본(content-master-v1.json)의 활동 수·메뉴 이름과 화면이 일치(합계 130/48)
  2. 잠금 공간(혼술·싱글)은 활동 목록을 보여 주되 방 열기는 안내로 막힘
  3. 오늘의 365일 편성 카드가 정본 365-events-v1.json의 오늘 행사와 일치
  4. 3D 소품(공간 메뉴판)을 눌러 메뉴판이 열림
  5. 활동을 눌러 실제 모임방이 열림
  6. 16주민 맥락 대화: 주제 질문 → 같은 주제 재질문은 후속 대사 → 짧은 대답은 후속
  7. 365일 패널 날짜 이동(12/25 크리스마스)
  8. 12월 크리스마스 상세 편성 카드(8구간·8활동)
  9. 사진 채팅: 첨부 → 전송 → 말풍선 사진 → 확대 보기 → 방 사진첩
 10. 재미 요소 8종 렌더·티켓 생성·미래 편지·전시 등록
 11. 모바일에서 메뉴판·활동 10개
 12. 콘솔 페이지 오류 없음
"""
import datetime
import json
import os
import sys

from playwright.sync_api import sync_playwright

URL = os.environ.get('DD_URL', 'http://127.0.0.1:4173')
OUT = os.environ.get('DD_SHOT_DIR', 'artifacts/step3')
PHASE = os.environ.get('DD_PHASE', 'all')
os.makedirs(OUT, exist_ok=True)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTER = json.load(open(os.path.join(ROOT, 'content/dingdong/content-master-v1.json'), encoding='utf-8'))
EVENTS = json.load(open(os.path.join(ROOT, 'content/dingdong/365-events-v1.json'), encoding='utf-8'))

log = []
fails = []


def check(name, ok, detail=''):
    log.append(('PASS' if ok else 'FAIL', name, detail))
    if not ok:
        fails.append(f'{name} {detail}')


def shot(page, name):
    try:
        page.screenshot(path=f'{OUT}/{name}.png', timeout=20000)
    except Exception:
        pass


def expand(page):
    body = page.locator('.dd3-chat .dd-chat-body')
    if body.count() and body.first.get_attribute('hidden') is not None:
        page.locator('.dd3-collapse').first.click()
        page.wait_for_timeout(300)


def open_move_menu(page):
    if not page.locator('.dd3-access-menu[open]').count():
        page.get_by_role('button', name='설정', exact=True).click()
        page.wait_for_timeout(250)


def enter_space(page, space_id):
    open_move_menu(page)
    page.locator('#dd3-dest').select_option(space_id)
    page.wait_for_timeout(120)
    page.locator('.dd-direct-entry').click()
    page.wait_for_timeout(550)


def open_space_menu(page):
    page.get_by_role('button', name='메뉴', exact=True).click()
    page.wait_for_selector('.dd-space-menu', timeout=10000)
    page.wait_for_timeout(150)


def close_space_menu(page):
    btn = page.locator('.dd-space-menu .dd3-btn', has_text='닫기')
    if btn.count():
        btn.first.click()
        page.wait_for_timeout(150)


def login(page, nickname):
    page.goto(URL, wait_until='domcontentloaded')
    page.get_by_role('button', name='딩동 입장하기', exact=True).wait_for(timeout=30000)
    page.locator('#nickname').fill(nickname)
    page.get_by_role('button', name='딩동 입장하기', exact=True).click()
    page.locator('.dd-world-app').wait_for(timeout=30000)
    page.wait_for_timeout(2200)


def seoul_today():
    now = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=9)
    return now


def run_spaces(page):
    ev = None
    now = seoul_today()
    for item in EVENTS['events']:
        if item['month'] == now.month and item['day'] == now.day:
            ev = item
            break
    card = page.locator('[data-today-event]').first
    check('365일 오늘 카드 노출', card.count() == 1)
    if ev and card.count():
        check('365일 오늘 행사 id 일치', card.get_attribute('data-today-event') == ev['id'], card.get_attribute('data-today-event'))
        check('365일 오늘 행사 제목 일치', ev['title'] in card.inner_text(), ev['title'])

    total_activities = 0
    total_menus = 0
    for space in MASTER['spaces']:
        sid = space['id']
        enter_space(page, sid)
        open_space_menu(page)
        panel = page.locator('.dd-space-menu')
        check(f'{sid} 메뉴판 열림', panel.count() == 1)
        if panel.count():
            check(f'{sid} 메뉴판 공간 일치', panel.first.get_attribute('data-space') == sid)
            acts = panel.locator('[data-activity]')
            labels = panel.locator('[data-menu-label]')
            n_act, n_menu = acts.count(), labels.count()
            total_activities += n_act
            total_menus += n_menu
            check(f'{sid} 활동 수', n_act == len(space['topics']), f'{n_act}/{len(space["topics"])}')
            check(f'{sid} 메뉴 수', n_menu == len(space['menu']), f'{n_menu}/{len(space["menu"])}')
            dom_acts = [acts.nth(i).inner_text().strip('· ').strip() for i in range(n_act)]
            check(f'{sid} 활동 이름 정본 일치', dom_acts == space['topics'], str(dom_acts[:2]))
            dom_menus = [labels.nth(i).get_attribute('data-menu-label') for i in range(n_menu)]
            check(f'{sid} 메뉴 이름 정본 일치', dom_menus == space['menu'], str(dom_menus))
            if sid in ('jazz', 'single'):
                check(f'{sid} 잠금 안내', panel.locator('.dd-space-locked').count() == 1)
        if sid == 'cafe':
            shot(page, '02-space-menu-cafe')
            close_space_menu(page)
            page.locator('.dd-space-menu [data-activity="도란도란 수다방"]').count()
        close_space_menu(page)
    check('마을 전체 활동 130개', total_activities == 130, str(total_activities))
    check('마을 전체 메뉴 48개', total_menus == 48, str(total_menus))


def run_features(page):
    start = page.locator('[data-today-event]')
    if start.count():
        shot(page, '01-365-today')

    png = os.path.join(OUT, 'sample-photo.png')
    from PIL import Image
    Image.new('RGB', (640, 480), (214, 168, 116)).save(png)

    # 활동 → 모임방
    enter_space(page, 'cafe')
    open_space_menu(page)
    page.locator('.dd-space-menu [data-activity="도란도란 수다방"]').click()
    page.wait_for_timeout(1100)
    header = page.locator('.dd-message-header h3')
    check('활동 클릭 → 모임방 열림', header.count() == 1 and '도란도란 수다방' in header.first.inner_text(), header.first.inner_text() if header.count() else 'none')
    shot(page, '03-activity-room')

    # 사진 채팅 (기기 모드)
    expand(page)
    page.locator('.dd-attach-plus').first.click()
    page.wait_for_timeout(200)
    page.locator('input[aria-label="사진 첨부 파일"]').set_input_files(png)
    try:
        page.wait_for_selector('.dd-chat-attachment img', timeout=8000)
    except Exception:
        pass
    check('사진 미리보기', page.locator('.dd-chat-attachment img').count() == 1)
    page.locator('.dd-send').first.click()
    page.wait_for_timeout(1100)
    photo_btn = page.locator('.dd-own-message .dd-chat-photo')
    check('사진 말풍선 표시', photo_btn.count() >= 1, str(photo_btn.count()))
    if photo_btn.count():
        photo_btn.first.click()
        page.wait_for_timeout(400)
        check('사진 확대 보기', page.locator('.dd-photo-lightbox').count() == 1)
        shot(page, '04-photo-lightbox')
        page.get_by_role('button', name='사진 닫기').click()
        page.wait_for_timeout(300)
        check('확대 후 채팅 유지', page.locator('.dd-message-header h3').count() == 1)
    page.get_by_role('button', name='방 사진첩').click()
    page.wait_for_timeout(700)
    check('방 사진첩 열림', page.locator('.dd-room-album').count() == 1)
    check('사진첩 사진 1장', page.locator('.dd-room-album .dd-album-grid img').count() == 1, str(page.locator('.dd-room-album .dd-album-grid img').count()))
    shot(page, '05-room-album')
    if page.locator('.dd-room-album .dd3-btn', has_text='닫기').count():
        page.locator('.dd-room-album .dd3-btn', has_text='닫기').first.click()
        page.wait_for_timeout(200)

    # 3D 소품(공간 메뉴판) → 메뉴판
    open_move_menu(page)
    prop = page.locator('.dd3-props button', has_text='공간 메뉴판')
    check('3D 소품 목록에 공간 메뉴판', prop.count() >= 1)
    if prop.count():
        prop.first.click()
        try:
            page.wait_for_selector('.dd-space-menu', timeout=40000)
            opened = page.locator('.dd-space-menu').count() == 1
        except Exception:
            opened = False
        check('3D 소품 클릭 → 메뉴판 열림', opened)
        if opened:
            shot(page, '06-prop-menu')
            close_space_menu(page)

    # 주민 대화 (모카)
    enter_space(page, 'cafe')
    open_space_menu(page)
    talk = page.locator('.dd-space-menu .dd-talk-owner')
    check('메뉴판에 주민 대화 버튼', talk.count() == 1)
    if talk.count():
        talk.first.click()
        page.wait_for_selector('.dd-host-chat', timeout=10000)
        convo = page.locator('.dd-host-chat')
        box = convo.locator('input[aria-label="주민에게 할 말"]')
        send = convo.locator('button[aria-label="주민에게 전송"]')
        turns = convo.locator('.dd-host-turn.resident p')
        box.fill('커피 한 잔 마시고 싶어요')
        send.click()
        page.wait_for_timeout(350)
        first_reply = turns.last.inner_text()
        check('주민 주제 질문 응답', '커피' in first_reply or '음료' in first_reply or '차' in first_reply, first_reply[:60])
        box.fill('커피요')
        send.click()
        page.wait_for_timeout(350)
        second_reply = turns.last.inner_text()
        check('같은 주제 재질문 → 후속 대사', second_reply != first_reply, second_reply[:60])
        box.fill('네 좋아요')
        send.click()
        page.wait_for_timeout(350)
        third_reply = turns.last.inner_text()
        check('짧은 대답 → 후속 대답', bool(third_reply.strip()) and third_reply != second_reply, third_reply[:60])
        check('대화 기억 기본 꺼짐', convo.locator('.dd-host-memory input').is_checked() is False)
        shot(page, '07-resident-dialogue')
        convo.locator('button[aria-label="대화 닫기"]').click()
        page.wait_for_timeout(200)

    # 365일 패널 12/25
    page.get_by_role('button', name='이벤트', exact=True).click()
    page.wait_for_selector('.dd-world-pop', timeout=10000)
    # 딩동 종이 달력: 날짜칸 → 다음 달 → 25일
    page.locator('.dd-world-pop .dd-datepicker-field').first.click()
    page.wait_for_timeout(250)
    page.locator('.dd-datepicker-pop button[aria-label="다음 달"]').click()
    page.wait_for_timeout(200)
    page.locator('.dd-datepicker-grid button[data-date="2026-12-25"]').click()
    page.wait_for_timeout(450)
    festival = page.locator('.dd-world-pop .card')
    text = festival.inner_text() if festival.count() else ''
    check('365일 패널 12/25 행사', '메리 크리스마스' in text, text[:80].replace('\n', ' '))
    check('365일 패널 기획 표시', '준비 중인 기획' in text or '공식 일정' in text, text[:60].replace('\n', ' '))
    shot(page, '08-365-panel')
    page.locator('.dd-world-pop .dd-pop-title .dd3-btn', has_text='닫기').first.click()
    page.wait_for_timeout(200)

    # 크리스마스 상세 편성
    enter_space(page, 'season')
    expand(page)
    xmas = page.locator('.dd-christmas-card')
    check('크리스마스 카드 노출', xmas.count() == 1)
    if xmas.count():
        check('12월 편성 8구간', xmas.locator('details li').count() == 8, str(xmas.locator('details li').count()))
        check('크리스마스 활동 8개', xmas.locator('.dd-christmas-acts li').count() == len(MASTER['christmas']['activities']), str(xmas.locator('.dd-christmas-acts li').count()))
        shot(page, '09-christmas')

    # 재미 요소 8종
    page.get_by_role('button', name='재미 요소 8종').click()
    page.wait_for_selector('.dd-fun-panel', timeout=10000)
    check('재미 요소 8장', page.locator('.dd-fun-panel [data-fun]').count() == 8, str(page.locator('.dd-fun-panel [data-fun]').count()))
    page.get_by_role('button', name='티켓 만들기').click()
    page.wait_for_timeout(600)
    check('파티 기념 티켓 생성', page.locator('.dd-fun-card[data-fun="ticket"] .dd-fun-thumbs img').count() == 1)
    page.locator('.dd-fun-card[data-fun="letter"] input[aria-label="미래 편지 받을 날짜"]').fill('2027-01-01')
    page.locator('.dd-fun-card[data-fun="letter"] textarea[aria-label="미래 편지 내용"]').fill('내년의 나에게: 잘 지내고 있나요?')
    page.locator('.dd-fun-card[data-fun="letter"] .dd3-btn', has_text='편지 맡기기').click()
    page.wait_for_timeout(400)
    check('미래 편지 저장', page.locator('.dd-fun-card[data-fun="letter"] .dd-letter-list li').count() == 1)
    page.locator('.dd-fun-card[data-fun="exhibit"] input[aria-label="전시 작품 이름"]').fill('겨울 창가')
    page.wait_for_timeout(200)
    page.locator('.dd-fun-card[data-fun="exhibit"] input[aria-label="전시 작품 사진"]').set_input_files(png)
    # 사진 압축은 기기 성능에 따라 몇 초 걸린다. 화면에 실제로 걸릴 때까지 짧게 기다린다.
    exhibit_count = 0
    for _ in range(20):
        page.wait_for_timeout(700)
        exhibit_count = page.locator('.dd-fun-card[data-fun="exhibit"] .dd-exhibit-grid figure').count()
        if exhibit_count:
            break
    check('작은 전시회 등록', exhibit_count == 1, 'count=%s notice=%s ls=%s' % (exhibit_count, page.locator('.dd-chat-notice').inner_text() if page.locator('.dd-chat-notice').count() else '', (page.evaluate("localStorage.getItem('dd.exhibition.v1')") or '')[:60]))
    shot(page, '10-fun-panel')
    page.locator('.dd-fun-panel .dd3-btn', has_text='닫기').first.click()
    page.wait_for_timeout(200)


def run_mobile(browser, errors):
    mobile = browser.new_page(viewport={'width': 390, 'height': 844}, reduced_motion='reduce')
    mobile.set_default_timeout(30000)
    mobile.on('pageerror', lambda e: errors.append(str(e)))
    login(mobile, '모바일점검')
    # 상단 버튼 겹침 0건 (390px)
    overlaps = mobile.evaluate('''() => {
      const sels = ['.dd3-title', '.dd-map-views', '.dd-quick-links', '.dd-bell-shortcut', '.dd-camera-control']
      const boxes = sels.map(s => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return {s, x:r.x, y:r.y, w:r.width, h:r.height} }).filter(Boolean)
      const hits = []
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j]
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y)
        if (ox > 0 && oy > 0) hits.push(a.s + ' X ' + b.s + ' ' + Math.round(ox * oy))
      }
      return {hits, scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, buttons: boxes.length}
    }''')
    check('모바일 상단 버튼 겹침 0건', len(overlaps['hits']) == 0, str(overlaps['hits'][:3]))
    check('모바일 가로 넘침 없음', overlaps['scroll'] <= overlaps['client'] + 1, f"{overlaps['scroll']}/{overlaps['client']}")
    check('모바일 상단 버튼 모두 배치', overlaps['buttons'] >= 4, str(overlaps['buttons']))
    mobile.get_by_role('button', name='메뉴', exact=True).click()
    mobile.wait_for_selector('.dd-space-menu', timeout=10000)
    check('모바일 메뉴판 열림', mobile.locator('.dd-space-menu').count() == 1)
    check('모바일 활동 10개', mobile.locator('.dd-space-menu [data-activity]').count() == 10, str(mobile.locator('.dd-space-menu [data-activity]').count()))
    shot(mobile, '11-mobile-menu')
    mobile.close()


with sync_playwright() as pw:
    browser = pw.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width': 1440, 'height': 900}, reduced_motion='reduce')
    page.set_default_timeout(30000)
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    login(page, '3단계점검')

    if PHASE in ('all', 'spaces'):
        run_spaces(page)
    if PHASE in ('all', 'features'):
        run_features(page)
        page.close()
        run_mobile(browser, errors)

    check('콘솔 페이지 오류 없음', len(errors) == 0, ' | '.join(errors[:3]))
    browser.close()

with open(os.path.join(OUT, f'result-{PHASE}.txt'), 'w', encoding='utf-8') as f:
    for status, name, detail in log:
        f.write(f'{status} {name} {detail}\n')

passed = sum(1 for row in log if row[0] == 'PASS')
print(f'\n{passed}/{len(log)} PASS')
for status, name, detail in log:
    if status == 'FAIL':
        print(f'FAIL {name} {detail}')
sys.exit(0 if not fails else 1)
