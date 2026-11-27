"""친구 1:1 실시간 채팅 E2E — 두 계정(브라우저 컨텍스트 2개)으로 실제 주고받기를 확인한다.

준비:
  DD_SESSION_FILE=tmp-dingdong/tokens.json   (두 계정의 access/refresh 토큰)
  npm run build && PORT=4173 node scripts/serve.mjs &
  python3 scripts/verify_friend_chat.py

확인 항목
  1. 친구 목록에 [1:1 채팅] 버튼이 보인다
  2. 누르면 수락 절차 없이 채팅방이 열린다(친구)
  3. 한쪽에서 보낸 메시지가 다른 쪽에 실시간으로 나타난다(양방향)
  4. 새로고침 없이 도착하고, 보낸 사람 말풍선은 오른쪽에 붙는다
  5. 콘솔 페이지 오류 없음
"""
import json
import os
import sys

from playwright.sync_api import sync_playwright

URL = os.environ.get('DD_URL', 'http://127.0.0.1:4173')
OUT = os.environ.get('DD_SHOT_DIR', 'artifacts/friend-chat')
SESSIONS = json.load(open(os.environ.get('DD_SESSION_FILE', 'tmp-dingdong/tokens.json'), encoding='utf-8'))
PROJECT = 'ksctvweuhnfjrqnuokmn'
os.makedirs(OUT, exist_ok=True)

log = []
fails = []


def shot(page, name):
    try:
        page.screenshot(path=f'{OUT}/{name}.png', animations='disabled', timeout=20000)
    except Exception:
        pass


def check(name, ok, detail=''):
    log.append(('PASS' if ok else 'FAIL', name, detail))
    if not ok:
        fails.append(f'{name} {detail}')


def session_script(sess):
    store = {
        'access_token': sess['access_token'],
        'token_type': 'bearer',
        'expires_in': sess.get('expires_in', 3600),
        'expires_at': sess.get('expires_at'),
        'refresh_token': sess['refresh_token'],
        'user': sess['user'],
    }
    return "try{localStorage.setItem('sb-%s-auth-token', %s)}catch(e){}" % (PROJECT, json.dumps(json.dumps(store)))


def open_world(ctx, nickname):
    page = ctx.new_page()
    page.set_default_timeout(30000)
    page.goto(URL, wait_until='domcontentloaded')
    page.wait_for_timeout(1500)
    if page.locator('.dd-world-app').count() == 0:
        try:
            page.get_by_role('button', name='딩동 입장하기', exact=True).wait_for(timeout=20000)
            page.locator('#nickname').fill(nickname)
            page.get_by_role('button', name='딩동 입장하기', exact=True).click()
        except Exception:
            print('ENTRY TEXT:', page.locator('body').inner_text()[:500].replace('\n', ' | '))
            raise
    page.locator('.dd-world-app').wait_for(timeout=30000)
    page.wait_for_timeout(2500)
    return page


def open_friends(page):
    page.get_by_role('button', name='친구', exact=True).click()
    page.wait_for_selector('.ddm-panel', timeout=15000)
    page.wait_for_timeout(1200)


def open_chat(page, peer):
    row = page.locator('.ddm-friend', has_text=peer)
    row.locator('button', has_text='1:1 채팅').click()
    page.wait_for_selector('.dd-friend-chat', timeout=20000)
    page.wait_for_timeout(1500)


with sync_playwright() as pw:
    # 두 계정을 동시에 띄우려면 3D 장면 두 개가 한 브라우저에 들어간다.
    # 소프트웨어 렌더링에서 메모리가 부족해 페이지가 죽지 않도록 브라우저를 하나씩 따로 띄운다.
    args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    browser_a = pw.chromium.launch(args=args)
    browser_b = pw.chromium.launch(args=args)
    errors = []
    ctx_a = browser_a.new_context(viewport={'width': 1100, 'height': 760}, reduced_motion='reduce')
    ctx_b = browser_b.new_context(viewport={'width': 1100, 'height': 760}, reduced_motion='reduce')
    ctx_a.add_init_script(session_script(SESSIONS['a']))
    ctx_b.add_init_script(session_script(SESSIONS['b']))
    a = open_world(ctx_a, '검증이웃하나')
    b = open_world(ctx_b, '검증이웃둘')
    for p in (a, b):
        p.on('pageerror', lambda e: errors.append(str(e)))

    open_friends(a)
    try:
        a.wait_for_selector('.ddm-friend:has-text("검증이웃둘")', timeout=15000)
        friend_row = True
    except Exception:
        friend_row = False
    check('친구 목록에 친구 표시', friend_row, a.locator('.ddm-panel').inner_text()[:140].replace('\n', ' ') if a.locator('.ddm-panel').count() else 'no panel')
    check('1:1 채팅 버튼 노출', a.locator('.ddm-friend', has_text='검증이웃둘').locator('button', has_text='1:1 채팅').count() == 1)

    open_chat(a, '검증이웃둘')
    check('A 채팅방 열림', a.locator('.dd-friend-chat').count() == 1)
    check('A 채팅방에 로그인 벽 없음', a.locator('.dd-lazy-veil').count() == 0)
    open_friends(b)
    open_chat(b, '검증이웃하나')
    check('B 채팅방 열림', b.locator('.dd-friend-chat').count() == 1)

    text_a = '실시간 확인 A→B ' + str(int(__import__('time').time()))
    a.locator('.dd-friend-chat input[aria-label="메시지"]').fill(text_a)
    a.locator('.dd-friend-chat button[aria-label="보내기"]').click()
    try:
        a.wait_for_selector(f'.dd-fc-turn.is-mine:has-text("{text_a}")', timeout=10000)
        mine = True
    except Exception:
        mine = False
    check('A 내 말풍선 표시', mine, a.locator('.dd-fc-log').inner_text()[:140].replace('\n', ' '))
    try:
        b.wait_for_selector(f'.dd-fc-turn:not(.is-mine) >> text={text_a}', timeout=12000)
        got_b = True
    except Exception:
        got_b = False
    check('B에 실시간 도착(새로고침 없음)', got_b, b.locator('.dd-fc-log').inner_text()[:120].replace('\n', ' '))
    shot(b, '05-friend-chat-b')

    text_b = 'B도 바로 답장 ' + str(int(__import__('time').time()))
    b.locator('.dd-friend-chat input[aria-label="메시지"]').fill(text_b)
    b.locator('.dd-friend-chat button[aria-label="보내기"]').click()
    try:
        a.wait_for_selector(f'.dd-fc-turn:not(.is-mine) >> text={text_b}', timeout=12000)
        got_a = True
    except Exception:
        got_a = False
    check('A에 실시간 도착(새로고침 없음)', got_a, a.locator('.dd-fc-log').inner_text()[:120].replace('\n', ' '))
    shot(a, '06-friend-chat-a')

    check('콘솔 페이지 오류 없음', len(errors) == 0, ' | '.join(errors[:3]))
    browser_a.close()
    browser_b.close()

with open(os.path.join(OUT, 'result-friend-chat.txt'), 'w', encoding='utf-8') as f:
    for status, name, detail in log:
        f.write(f'{status} {name} {detail}\n')
passed = sum(1 for row in log if row[0] == 'PASS')
print(f'\n{passed}/{len(log)} PASS')
for status, name, detail in log:
    if status == 'FAIL':
        print(f'FAIL {name} {detail}')
sys.exit(0 if not fails else 1)
