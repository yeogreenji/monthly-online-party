"""딩동 1단계 E2E — 덕질 존 아티스트 모임 · 개설자 수정/삭제 · 서버 기준 20명 정원/다음 호실 · 실시간 접속 캐릭터/말풍선.

전제: 실제 Supabase(ksctvweuhnfjrqnuokmn) 환경변수로 빌드한 dist를 scripts/serve.mjs로 띄우고,
      테스트 계정 세션(JSON)을 QA_SESSION으로 넘긴다. 세션이 없으면 로그인 없이 도는 UI 항목만 확인한다.

실행:
  SB_URL=... SB_KEY=<anon key> QA_SESSION=/path/session.json \\
    python3 scripts/verify_phase1_step1.py
"""
import json
import os
import re
import pathlib
import subprocess
import sys
import time

from playwright.sync_api import expect, sync_playwright

URL = os.environ.get('DD_URL', 'http://127.0.0.1:4210')
SESSION = os.environ.get('QA_SESSION', '')
SB_URL = os.environ.get('SB_URL', '')
SB_KEY = os.environ.get('SB_KEY', '')
PROJECT_REF = SB_URL.split('//')[-1].split('.')[0] if SB_URL else ''
OUT = pathlib.Path(os.environ.get('DD_SHOT_DIR', 'artifacts/step1'))
OUT.mkdir(parents=True, exist_ok=True)

fails = []


SHOTS = os.environ.get('DD_SHOTS', '1') != '0'


def shot(page, name):
    if not SHOTS:
        return
    try:
        page.screenshot(path=str(OUT / name), timeout=20000)
    except Exception:
        pass


def check(name, ok, detail=''):
    print(('PASS' if ok else 'FAIL'), name, detail, flush=True)
    if not ok:
        fails.append(f'{name} {detail}')


def boot(page):
    page.goto(URL + ('?dddebug=1' if os.environ.get('DD_DEBUG') else ''), wait_until='domcontentloaded')
    page.locator('.dd-entry-world canvas').wait_for(timeout=90000)
    page.locator('#nickname').fill('현장점검')
    page.get_by_role('button', name='딩동 입장하기', exact=True).click()
    page.locator('.dd3-canvas canvas').wait_for(timeout=90000)
    page.wait_for_timeout(1500)


def open_menu(page):
    if not page.locator('.dd3-access-menu[open]').count():
        page.get_by_role('button', name='설정', exact=True).click()
        page.wait_for_timeout(300)


def go(page, space):
    open_menu(page)
    page.locator('#dd3-dest').select_option(space)
    page.wait_for_timeout(200)
    page.get_by_role('button', name='바로 입장', exact=True).click()
    page.wait_for_timeout(1200)


def sim(space, topic, count, bubble='', seconds=60):
    env = dict(os.environ, SB_URL=SB_URL, SB_KEY=SB_KEY, SIM_SPACE=space, SIM_TOPIC=topic or '', SIM_COUNT=str(count))
    if bubble:
        env['SIM_BUBBLE'] = bubble
    node = os.environ.get('NODE_BIN', 'node')
    logf = open(OUT / 'presence_sim.log', 'ab')
    return subprocess.Popen([node, 'scripts/presence_sim.mjs', str(seconds)], env=env,
                            stdout=logf, stderr=logf)


with sync_playwright() as pw:
    browser = pw.chromium.launch(args=['--no-sandbox', '--disable-dev-shm-usage', '--no-zygote', '--single-process', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    context = browser.new_context(viewport={'width': 1180, 'height': 860}, reduced_motion='reduce')
    if SESSION:
        session = json.loads(pathlib.Path(SESSION).read_text(encoding='utf-8'))
        storage_key = f'sb-{PROJECT_REF}-auth-token'
        context.add_init_script(
            "window.localStorage.setItem(%s, %s);" % (json.dumps(storage_key), json.dumps(json.dumps(session)))
        )
    page = context.new_page()
    page.set_default_timeout(45000)
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    if os.environ.get('DD_DEBUG'):
        page.on('console', lambda m: print('CONSOLE', m.type, m.text[:260], flush=True) if 'presence' in m.text else None)
    procs = []

    boot(page)
    go(page, 'fandom')
    expect(page.locator('.dd-fan-banner')).to_be_visible(timeout=15000)
    check('덕질 존 안내 배너', True)
    strip = page.locator('.dd-live-strip')
    if SESSION:
        expect(strip).to_be_visible(timeout=15000)
        try:
            expect(strip).to_contain_text('실시간 접속', timeout=25000)
        except Exception:
            pass
        check('서버 로그인(실시간 접속 표시)', '실시간 접속' in strip.inner_text(), strip.inner_text().replace('\n', ' ')[:140])

    # 1) 아티스트 이름 + 테마로 모임 열기 (모임 이름은 비워 둔다)
    page.get_by_role('button', name='모임 열기', exact=True).click()
    page.get_by_label('아티스트 이름', exact=True).fill('테스트가수')
    page.get_by_label('덕질 테마', exact=True).select_option('콘서트 후기')
    page.get_by_role('button', name='모임 만들기', exact=True).click()
    header = page.locator('.dd-message-header')
    expect(header).to_be_visible(timeout=20000)
    check('아티스트 이름으로 모임 제목 자동 생성', '테스트가수 콘서트 후기' in header.inner_text(), header.inner_text().replace('\n', ' | ')[:120])
    check('테마가 모임 머리말에 표시', '콘서트 후기' in header.inner_text())
    room_a = header.get_attribute('data-topic-id') or ''
    shot(page, '01-fandom-room.png')

    # 2) 실시간 대화 전송
    field = page.get_by_role('textbox', name='메시지', exact=True)
    field.fill('덕질 존 실시간 확인')
    page.get_by_role('button', name='전송', exact=True).click()
    expect(page.locator('.dd-message-log').get_by_text('덕질 존 실시간 확인', exact=True)).to_be_visible(timeout=15000)
    check('서버 채팅 전송', True, room_a)

    # 3) 개설자 수정
    page.get_by_role('button', name='모임 수정', exact=True).click()
    page.get_by_label('모임 이름 수정', exact=True).fill('테스트가수 콘서트 같이 가요')
    page.get_by_role('button', name='수정 저장', exact=True).click()
    expect(header).to_contain_text('테스트가수 콘서트 같이 가요', timeout=15000)
    check('개설자 모임 수정', True)
    shot(page, '02-owner-edit.png')

    # 4) 다른 이용자 캐릭터·말풍선 (Presence 시뮬레이션 1명)
    if SB_URL and SB_KEY and room_a:
        procs.append(sim('fandom', room_a, 1, '안녕하세요! 같이 봐요', seconds=45))
        page.wait_for_timeout(6500)
        canvas = page.locator('.dd3-canvas canvas')
        peers = canvas.get_attribute('data-peers')
        root = page.locator('.dd-world-app')
        check('다른 접속자 캐릭터 표시', peers not in (None, '0'), f'data-peers={peers} presence={root.get_attribute("data-presence")} found={root.get_attribute("data-peers")}')
        shot(page, '03-peer-avatar.png')
    else:
        check('다른 접속자 캐릭터 표시', False, 'SB_URL/SB_KEY 없음')

    # 5) 서버 기준 정원 20명 → 다음 호실 자동 생성·이동
    page.locator('.dd-chat-icon[aria-label="모임 목록"]').click()
    page.wait_for_timeout(900)
    page.get_by_role('button', name='모임 열기', exact=True).click()
    page.get_by_label('아티스트 이름', exact=True).fill('정원테스트')
    page.get_by_label('모임 이름', exact=True).fill('정원테스트 컴백')
    page.get_by_role('button', name='모임 만들기', exact=True).click()
    expect(header).to_be_visible(timeout=20000)
    room_b = header.get_attribute('data-topic-id') or ''
    page.locator('.dd-chat-icon[aria-label="모임 목록"]').click()
    page.wait_for_timeout(900)
    if SB_URL and SB_KEY and room_b:
        item = page.locator(f'.dd-room-list-item[data-topic-id="{room_b}"]')
        expect(item).to_be_visible(timeout=15000)
        procs.append(sim('fandom', room_b, 22, seconds=90))
        live = 0
        deadline = time.time() + 45
        while time.time() < deadline:
            m = re.search(r'지금 (\d+)명', item.inner_text())
            if m and int(m.group(1)) >= 20:
                live = int(m.group(1))
                break
            page.wait_for_timeout(1000)
        check('목록에 실시간 인원 표시', live >= 20, f'지금 {live}명 (서버 Presence 기준)')
        item.locator('.dd-room-join').click()
        dialog = page.locator('.dd-room-full-dialog')
        expect(dialog).to_be_visible(timeout=15000)
        check('정원 20명 초과 입장 차단', True, dialog.inner_text().replace('\n', ' ')[:120])
        shot(page, '04-room-full.png')
        import re as _re
        dialog.get_by_role('button', name=_re.compile('호실 열고 입장')).click()
        expect(header).to_contain_text('호실', timeout=20000)
        check('다음 호실 자동 생성·이동', '정원테스트 컴백' in header.inner_text() and '호실' in header.inner_text(), header.inner_text().replace('\n', ' | ')[:120])
        shot(page, '05-next-room.png')
    else:
        check('정원 20명 초과 입장 차단', False, 'SB_URL/SB_KEY 없음')

    # 6) 개설자 삭제
    page.once('dialog', lambda d: d.accept())
    page.get_by_role('button', name='모임 삭제', exact=True).click()
    page.wait_for_timeout(2000)
    check('개설자 모임 삭제', page.locator('.dd-message-header').count() == 0, '모임 화면이 닫히고 목록으로 돌아옴')

    check('콘솔 페이지 오류 없음', not errs, ' / '.join(errs[:3]))
    for proc in procs:
        proc.terminate()
    browser.close()

print('\n=== 결과:', 'ALL PASS' if not fails else f'{len(fails)} FAIL ===')
for f in fails:
    print(' -', f)
sys.exit(1 if fails else 0)
