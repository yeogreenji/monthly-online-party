"""딩동 안정성 개편 E2E — 실제 운영 Supabase에 붙어 두 계정으로 확인한다.

단계(DD_STAGE)
  chat     : 조작 안내 띠 닫기, 서버 인원, 두 계정 사진 송수신·답장·이모지 반응
  capacity : 정원이 차면 세 번째 계정이 자동으로 다음 호실로 배정
  rollback : 메시지 저장 실패 시 Storage에 올린 사진이 남지 않는지
  mobile   : 390x844에서 입력창·사진·반응 줄이 화면 안에 있는지

사전 준비
  - `npm run build` 후 `PORT=4173 node scripts/serve.mjs`로 dist를 띄운다.
  - DD_SESSIONS 파일(JSON): {"A":{...supabase session...},"B":{...},"C":{...}}
    (/auth/v1/token?grant_type=password 응답을 그대로 저장)
  - DD_URL(기본 http://127.0.0.1:4173), DD_SHOTS=1이면 artifacts/stability에 스크린샷.

실행 예: DD_STAGE=chat DD_SESSIONS=/path/sessions.json python3 scripts/verify_stability.py
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = os.environ.get('DD_URL', 'http://127.0.0.1:4173')
STAGE = os.environ.get('DD_STAGE', 'all')
SESSIONS = {k.lower(): v for k, v in json.load(open(os.environ['DD_SESSIONS'], encoding='utf-8')).items()}
OUT = Path(os.environ.get('DD_SHOT_DIR', 'artifacts/stability'))
OUT.mkdir(parents=True, exist_ok=True)
SHOTS = os.environ.get('DD_SHOTS', '0') == '1'
ROOT = Path(__file__).resolve().parent.parent
ENV = (ROOT / '.env.local').read_text(encoding='utf-8')
SB_URL = [line.split('=', 1)[1].strip() for line in ENV.splitlines() if line.startswith('VITE_SUPABASE_URL')][0]
SB_KEY = [line.split('=', 1)[1].strip() for line in ENV.splitlines() if line.startswith('VITE_SUPABASE_ANON_KEY')][0]
REF = SB_URL.split('//')[1].split('.')[0]

log, fails = [], []
PW = None


def check(name, ok, detail=''):
    log.append((('PASS' if ok else 'FAIL'), name, detail))
    if not ok:
        fails.append(f'{name} · {detail}')
    print(('PASS ' if ok else 'FAIL ') + name + ((' · ' + str(detail)[:220]) if detail else ''), flush=True)


def shot(page, name):
    if not SHOTS:
        return
    try:
        page.screenshot(path=str(OUT / name), timeout=25000, animations='disabled')
    except Exception:
        pass


def api(path, method='GET', body=None, token=None):
    headers = {'apikey': SB_KEY, 'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(SB_URL + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            raw = res.read().decode()
            return res.status, (json.loads(raw) if raw.strip() else None)
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode()
        try:
            return exc.code, json.loads(raw)
        except Exception:
            return exc.code, raw


def make_topic(token, title, capacity=2, space='cafe'):
    """모임 만들기는 1분 3개 제한이 있어 막히면 잠시 기다렸다 다시 시도한다."""
    tid = str(uuid.uuid4())
    body = {
        'id': tid, 'space_id': space, 'title': title, 'description': '안정성 E2E 검증용',
        'kind': 'talk', 'capacity': capacity, 'age_group': '성인 전체',
    }
    for _ in range(4):
        st, _ = api('/rest/v1/topics', 'POST', body, token=token)
        if st in (200, 201):
            return tid
        time.sleep(21)
    return None


def open_page(browser, session, nickname, viewport):
    ctx = browser.new_context(viewport=viewport, reduced_motion='reduce')
    ctx.add_init_script("window.localStorage.setItem(%s, %s);" % (
        json.dumps(f'sb-{REF}-auth-token'), json.dumps(json.dumps(session))))
    page = ctx.new_page()
    page.set_default_timeout(30000)
    page.goto(URL, wait_until='domcontentloaded')
    # 로그인 세션이 있으면 입장 화면을 건너뛰고 바로 마을로 들어오는 경우가 있다.
    for attempt in range(2):
        try:
            page.locator('#nickname').wait_for(timeout=15000)
            page.locator('#nickname').fill(nickname)
            page.get_by_role('button', name='딩동 입장하기', exact=True).click()
        except Exception:
            pass
        try:
            page.locator('.dd-world-app').wait_for(timeout=45000)
            break
        except Exception:
            if attempt == 1:
                raise
            page.reload(wait_until='domcontentloaded')
            page.wait_for_timeout(2000)
    page.wait_for_timeout(2200)
    return page


def enter_space(page, space_id='cafe'):
    page.get_by_role('button', name='설정', exact=True).click()
    page.wait_for_timeout(300)
    page.locator('#dd3-dest').select_option(space_id)
    page.wait_for_timeout(150)
    page.locator('.dd-direct-entry').click()
    page.wait_for_timeout(900)


def join_room(page, title):
    page.locator('.dd-room-join', has_text=title).first.wait_for(timeout=20000)
    page.locator('.dd-room-join', has_text=title).first.click()
    page.wait_for_timeout(1500)


def composer(page):
    return page.locator('input[aria-label="메시지"]')


def send_text(page, text):
    composer(page).fill(text)
    page.locator('button[aria-label="전송"]').click()
    page.wait_for_timeout(1400)


def attach(page, files):
    page.locator('input[aria-label="사진 첨부 파일"]').set_input_files(files)
    deadline = time.time() + 25
    while time.time() < deadline:
        if page.locator('.dd-chat-attachments .dd-chat-attachment').count() >= len(files):
            break
        page.wait_for_timeout(300)
    page.wait_for_timeout(500)


def images():
    found = sorted(str(p) for p in (ROOT / 'scripts' / 'fixtures').glob('*.jpg'))
    if len(found) < 2:
        raise SystemExit('사진 픽스처가 없습니다: scripts/fixtures/*.jpg')
    return found


def stage_chat(browser, A, B, stamp):
    img = images()
    room = make_topic(A['access_token'], f'E2E 채팅 {stamp}', 2)
    if not room:
        raise SystemExit('검증용 모임을 만들지 못했습니다(1분 3개 제한).')

    pa = open_page(browser, A, '안정성A', {'width': 1280, 'height': 900})
    hint = pa.locator('.dd3-world-hint')
    check('조작 안내 띠가 처음에는 보인다', hint.count() == 1 and hint.first.is_visible(), hint.count())
    if hint.count():
        hint.first.click()
        pa.wait_for_timeout(400)
        check('띠를 터치하면 즉시 사라진다', pa.locator('.dd3-world-hint').count() == 0)
    ctx_a = pa.context
    pa.close()
    pa = ctx_a.new_page()
    pa.set_default_timeout(30000)
    pa.goto(URL, wait_until='domcontentloaded')
    pa.locator('.dd-world-app').wait_for(timeout=60000)
    pa.wait_for_timeout(2200)
    check('다시 열어도 띠가 뜨지 않는다', pa.locator('.dd3-world-hint').count() == 0)
    shot(pa, '01-hint-dismissed.png')

    enter_space(pa, 'cafe')
    join_room(pa, f'E2E 채팅 {stamp}')
    meter = pa.locator('.dd-topic-meter em').first.inner_text() if pa.locator('.dd-topic-meter em').count() else ''
    check('입장 직후 서버 인원 1/2', '1/2' in meter, meter)
    send_text(pa, 'A가 보낸 첫 메시지')
    check('A 메시지 전송·표시', pa.locator('.dd-own-message', has_text='A가 보낸 첫 메시지').count() >= 1)

    attach(pa, img[:2])
    try:
        pa.wait_for_function("document.querySelectorAll('.dd-chat-attachments .dd-chat-attachment').length === 2", timeout=20000)
    except Exception:
        pass
    check('사진 2장 미리보기', pa.locator('.dd-chat-attachments .dd-chat-attachment').count() == 2,
          pa.locator('.dd-chat-attachments .dd-chat-attachment').count())
    try:
        pa.wait_for_function("!document.querySelector('button[aria-label=\"전송\"]').disabled", timeout=15000)
    except Exception:
        pass
    composer(pa).fill('사진 두 장과 함께')
    pa.locator('button[aria-label="전송"]').click()
    try:
        pa.wait_for_function("document.querySelectorAll('.dd-own-message .dd-chat-photo img').length >= 2", timeout=25000)
    except Exception:
        pass
    check('사진 말풍선 2개 표시', pa.locator('.dd-own-message .dd-chat-photo img').count() >= 2,
          pa.locator('.dd-own-message .dd-chat-photo img').count())

    # 두 번째 계정은 별도 브라우저 프로세스로 띄운다(한 프로세스에 3D 화면 두 개는 헤드리스에서 버벅인다).
    browser_b = PW.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    pb = open_page(browser_b, B, '안정성B', {'width': 1280, 'height': 900})
    enter_space(pb, 'cafe')
    join_room(pb, f'E2E 채팅 {stamp}')
    try:
        pb.wait_for_function("document.querySelectorAll('.dd-peer-message .dd-chat-photo img').length >= 2", timeout=20000)
    except Exception:
        pass
    check('B가 A 메시지를 실시간으로 받는다', pb.locator('.dd-peer-message', has_text='A가 보낸 첫 메시지').count() >= 1)
    try:
        pb.wait_for_function("Array.from(document.querySelectorAll('.dd-peer-message .dd-chat-photo img')).filter(el => el.complete && el.naturalWidth > 0).length >= 2", timeout=25000)
    except Exception:
        pass
    imgs = pb.locator('.dd-peer-message .dd-chat-photo img')
    drawn = 0
    for i in range(imgs.count()):
        try:
            if imgs.nth(i).evaluate('el => el.complete && el.naturalWidth > 0'):
                drawn += 1
        except Exception:
            pass
    check('B 화면에 A 사진 2장이 실제로 그려진다', drawn >= 2, f'{drawn}/{imgs.count()}')
    shot(pb, '02-b-receives-photos.png')

    target = pb.locator('.dd-peer-message', has_text='A가 보낸 첫 메시지').first
    target.locator('button', has_text='답장').first.click()
    pb.wait_for_timeout(300)
    check('답장 대상 표시', pb.locator('.dd-reply-bar').count() == 1)
    send_text(pb, 'B가 남긴 답장')
    pb.wait_for_timeout(1200)
    check('B 화면에 인용 답장', pb.locator('.dd-own-message .dd-quote', has_text='A가 보낸 첫 메시지').count() >= 1)
    try:
        pa.wait_for_function("Array.from(document.querySelectorAll('.dd-peer-message .dd-quote')).some(el => el.innerText.includes('A가 보낸 첫 메시지'))", timeout=20000)
    except Exception:
        pass
    check('A 화면에도 인용 답장 도착', pa.locator('.dd-peer-message .dd-quote', has_text='A가 보낸 첫 메시지').count() >= 1)

    target2 = pb.locator('.dd-peer-message', has_text='A가 보낸 첫 메시지').first
    target2.locator('button[aria-label="반응 남기기"]').first.click()
    pb.wait_for_timeout(250)
    pb.locator('button[aria-label="👍 반응"]').first.click()
    pb.wait_for_timeout(2000)
    check('반응한 사람 화면에 👍 칩', pb.locator('.dd-react-chip', has_text='👍').count() >= 1)
    try:
        pa.wait_for_function("Array.from(document.querySelectorAll('.dd-react-chip')).some(el => el.innerText.includes('👍'))", timeout=15000)
    except Exception:
        pass
    check('A 화면에 👍 반응이 실시간으로', pa.locator('.dd-react-chip', has_text='👍').count() >= 1)
    shot(pa, '03-reply-reaction.png')
    pa.context.close()
    pb.context.close()
    browser_b.close()


def stage_capacity(browser, A, B, C, stamp):
    """정원 2명을 A(화면)+B(서버 입장)로 채우고, C가 화면에서 자동으로 다음 호실을 받는지 본다."""
    room = make_topic(A['access_token'], f'E2E 정원 {stamp}', 2)
    if not room:
        raise SystemExit('검증용 모임을 만들지 못했습니다(1분 3개 제한).')

    print('· A 화면 준비', flush=True)
    pa = open_page(browser, A, '안정성A', {'width': 1280, 'height': 900})
    enter_space(pa, 'cafe')
    join_room(pa, f'E2E 정원 {stamp}')
    # B는 앱과 같은 RPC로 입장한다(화면을 두 개 띄우면 헤드리스 3D가 버벅여 검증이 흔들린다).
    st, joined = api('/rest/v1/rpc/join_room', 'POST', {'p_topic': room}, token=B['access_token'])
    check('B가 서버 RPC로 입장', st == 200 and joined and joined.get('count') == 2, joined)
    # 화면 인원은 20초 하트비트로 갱신된다(서버가 유일한 기준).
    deadline = time.time() + 30
    meter = ''
    while time.time() < deadline:
        meter = pa.locator('.dd-topic-meter em').first.inner_text() if pa.locator('.dd-topic-meter em').count() else ''
        if '2/2' in meter:
            break
        pa.wait_for_timeout(1500)
    check('A 화면에 정원 2/2가 반영', '2/2' in meter, meter)
    pa.context.close()

    print('· C 화면 준비', flush=True)
    pc = open_page(browser, C, '안정성C', {'width': 1280, 'height': 900})
    enter_space(pc, 'cafe')
    join_room(pc, f'E2E 정원 {stamp}')
    try:
        pc.wait_for_selector('.dd-message-header h3', timeout=20000)
    except Exception:
        pass
    title = pc.locator('.dd-message-header h3').first.inner_text() if pc.locator('.dd-message-header h3').count() else ''
    check('세 번째 계정은 2호실로 자동 배정', '2호실' in title, title)
    meter_c = pc.locator('.dd-topic-meter em').first.inner_text() if pc.locator('.dd-topic-meter em').count() else ''
    check('2호실 인원 1/2', '1/2' in meter_c, meter_c)
    notice = pc.locator('.dd-chat-notice').first.inner_text() if pc.locator('.dd-chat-notice').count() else ''
    check('자리 안내 문구 표시', '자리를 안내' in notice, notice)
    shot(pc, '04-auto-next-room.png')

    counts = api('/rest/v1/rpc/room_counts', 'POST', {'p_topics': [room]}, token=A['access_token'])[1]
    check('원래 방은 여전히 2명', isinstance(counts, dict) and counts.get(room) == 2, counts)
    pc.context.close()


def stage_rollback(browser, A, stamp):
    img = images()
    room = make_topic(A['access_token'], f'E2E 롤백 {stamp}', 5)
    if not room:
        raise SystemExit('검증용 모임을 만들지 못했습니다(1분 3개 제한).')
    pa = open_page(browser, A, '안정성A', {'width': 1280, 'height': 900})
    enter_space(pa, 'cafe')
    join_room(pa, f'E2E 롤백 {stamp}')
    attach(pa, img[:1])
    composer(pa).fill('정상 전송')
    pa.locator('button[aria-label="전송"]').click()
    pa.wait_for_timeout(4000)
    before = api('/storage/v1/object/list/chat-photos', 'POST',
                 {'prefix': f"{A['user']['id']}/{room}", 'limit': 30}, token=A['access_token'])[1]
    before_names = {row['name'] for row in before} if isinstance(before, list) else set()
    check('정상 전송 사진 2개(원본+썸네일) 업로드', len(before_names) == 2, before_names)

    pa.route('**/rest/v1/messages**', lambda route: route.fulfill(status=500, body='{"message":"forced"}'))
    attach(pa, img[:1])
    composer(pa).fill('실패 유도 사진')
    try:
        pa.wait_for_function("!document.querySelector('button[aria-label=\"전송\"]').disabled", timeout=15000)
    except Exception:
        pass
    pa.locator('button[aria-label="전송"]').click()
    pa.wait_for_timeout(5000)
    check('실패 안내와 다시 시도 버튼', pa.locator('.dd-retry-bar').count() >= 1)
    pa.unroute('**/rest/v1/messages**')
    after = api('/storage/v1/object/list/chat-photos', 'POST',
                {'prefix': f"{A['user']['id']}/{room}", 'limit': 30}, token=A['access_token'])[1]
    after_names = {row['name'] for row in after} if isinstance(after, list) else set()
    check('실패한 전송의 사진이 Storage에 남지 않는다', after_names == before_names,
          f'추가됨={sorted(after_names - before_names)}')
    shot(pa, '05-rollback.png')
    pa.context.close()


def stage_mobile(browser, A, stamp):
    img = images()
    room = make_topic(A['access_token'], f'E2E 모바일 {stamp}', 5)
    if not room:
        raise SystemExit('검증용 모임을 만들지 못했습니다(1분 3개 제한).')
    pm = open_page(browser, A, '안정성A', {'width': 390, 'height': 844})
    enter_space(pm, 'cafe')
    join_room(pm, f'E2E 모바일 {stamp}')
    box = composer(pm).bounding_box()
    check('모바일: 입력창이 화면 안에 있다', bool(box) and box['y'] + box['height'] <= 845, box)
    send_text(pm, '모바일에서 보낸 메시지')
    check('모바일: 메시지 표시', pm.locator('.dd-own-message', has_text='모바일에서 보낸 메시지').count() >= 1)
    attach(pm, img[:1])
    composer(pm).fill('모바일 사진')
    pm.locator('button[aria-label="전송"]').click()
    try:
        pm.wait_for_function("document.querySelectorAll('.dd-own-message .dd-chat-photo img').length >= 1", timeout=25000)
    except Exception:
        pass
    check('모바일: 사진 말풍선 표시', pm.locator('.dd-own-message .dd-chat-photo img').count() >= 1)
    rows = pm.locator('.dd-react-row')
    if rows.count():
        b2 = rows.first.bounding_box()
        check('모바일: 반응 줄이 화면 폭을 넘지 않는다', bool(b2) and b2['x'] >= -1 and b2['x'] + b2['width'] <= 391, b2)
    shot(pm, '06-mobile-chat.png')
    pm.context.close()


def main():
    global PW
    A, B, C = SESSIONS['a'], SESSIONS['b'], SESSIONS['c']
    stamp = time.strftime('%H%M%S')
    with sync_playwright() as pw:
        PW = pw
        browser = pw.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        if STAGE in ('all', 'chat'):
            stage_chat(browser, A, B, stamp)
        if STAGE in ('all', 'capacity'):
            stage_capacity(browser, A, B, C, stamp)
        if STAGE in ('all', 'rollback'):
            stage_rollback(browser, A, stamp)
        if STAGE in ('all', 'mobile'):
            stage_mobile(browser, A, stamp)
        browser.close()

    print('\nSUMMARY', sum(1 for row in log if row[0] == 'PASS'), '/', len(log))
    if fails:
        print('FAILS:')
        for item in fails:
            print(' -', item)
        sys.exit(1)


main()
