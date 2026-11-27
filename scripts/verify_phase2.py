"""딩동 2단계 E2E — 계정 저장·친구·미니홈피 방문·방명록·무료 선물·쪽지·함께 놀기.

전제: 실제 Supabase 환경변수로 빌드한 앱(dev 또는 dist)을 띄우고, 두 계정의 세션 JSON을 넘긴다.
  QA_SESSION_A=/path/a.json QA_SESSION_B=/path/b.json \
  DD_URL=http://127.0.0.1:4210 python3 scripts/verify_phase2.py
세션이 없으면 건너뛴 항목을 SKIP으로 남긴다(가짜 통과로 표시하지 않는다).

세션 JSON 모양: {access_token, refresh_token, expires_at, expires_in, token_type, user}
(앱 localStorage의 sb-<project-ref>-auth-token 값과 같은 모양)

확인 항목
  1. A 로그인 → 덕질 존 로비 '실시간 접속' 표시
  2. A 미니홈피 제목·소개·테마 저장 → 새로고침 후 서버 값 복원
  3. B가 A에게 친구 신청 → A가 수락
  4. B가 A의 집 방문 → 방명록 작성 → 무료 선물 전송
  5. A 우편함에 B의 선물 도착
  6. A·B가 같은 모임에서 함께 놀기(끝말잇기) → B 화면에 A의 단어가 도착
"""
import json
import os
import pathlib
import re
import sys
from playwright.sync_api import sync_playwright

URL = os.environ.get('DD_URL', 'http://127.0.0.1:4210')
A_PATH = os.environ.get('QA_SESSION_A', '')
B_PATH = os.environ.get('QA_SESSION_B', '')
REF = os.environ.get('SB_PROJECT_REF', 'ksctvweuhnfjrqnuokmn')
OUT = pathlib.Path(os.environ.get('DD_SHOT_DIR', 'artifacts/step2'))
OUT.mkdir(parents=True, exist_ok=True)
SHOTS = os.environ.get('DD_SHOTS', '1') != '0'
NICK_A = os.environ.get('QA_NICK_A', '2단계A')
NICK_B = os.environ.get('QA_NICK_B', '2단계B')

fails = []
log = []


def check(name, ok, detail=''):
    log.append(('PASS' if ok else 'FAIL', name, detail))
    print(('PASS' if ok else 'FAIL'), name, detail, flush=True)
    if not ok:
        fails.append(name + ' ' + detail)


def skip(name, why):
    log.append(('SKIP', name, why))
    print('SKIP', name, why, flush=True)


def shot(page, name, clip):
    if not SHOTS:
        return
    try:
        page.screenshot(path=str(OUT / name), clip=clip, timeout=120000, animations='disabled')
    except Exception as e:  # 스크린샷은 검증 항목이 아니다
        print('shot skipped', name, str(e)[:60])


def open_page(browser, session, nickname):
    ctx = browser.new_context(viewport={'width': 1200, 'height': 860}, reduced_motion='reduce')
    ctx.add_init_script("window.localStorage.setItem(%s, %s);" % (
        json.dumps(f'sb-{REF}-auth-token'), json.dumps(json.dumps(session))))
    page = ctx.new_page()
    page.set_default_timeout(45000)
    page.goto(URL, wait_until='domcontentloaded')
    page.locator('.dd-entry-world canvas').wait_for(timeout=90000)
    page.locator('#nickname').fill(nickname)
    page.get_by_role('button', name='딩동 입장하기', exact=True).click()
    page.locator('.dd3-canvas canvas').wait_for(timeout=90000)
    page.wait_for_timeout(2500)
    return page


def go(page, space):
    page.get_by_role('button', name='설정', exact=True).click()
    page.wait_for_timeout(400)
    page.locator('#dd3-dest').select_option(space)
    page.get_by_role('button', name='바로 입장', exact=True).click(force=True, timeout=20000)
    page.wait_for_timeout(2500)


def friends(page):
    page.get_by_role('button', name='친구', exact=True).first.click()
    page.get_by_role('dialog', name='친구').wait_for(timeout=10000)
    page.wait_for_timeout(900)


def to_game(page):
    go(page, 'games')
    page.locator('.dd-today-card').first.click(force=True, timeout=20000)
    page.wait_for_timeout(2000)
    if page.locator('.ddg-tray summary').count():
        page.locator('.ddg-tray summary').first.click()
        page.wait_for_timeout(700)
    page.locator('.ddg-corner-card').first.click(force=True, timeout=20000)
    page.wait_for_timeout(1500)
    page.get_by_role('button', name=re.compile('함께 놀기')).click(force=True, timeout=20000)
    page.wait_for_timeout(1800)


def main():
    if not (A_PATH and B_PATH and pathlib.Path(A_PATH).exists() and pathlib.Path(B_PATH).exists()):
        skip('2단계 전체', 'QA_SESSION_A / QA_SESSION_B 세션 JSON이 없어 서버 항목을 확인하지 못했습니다.')
        print('FAILS:', fails)
        return 0
    sa = json.loads(pathlib.Path(A_PATH).read_text())
    sb = json.loads(pathlib.Path(B_PATH).read_text())
    args = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    with sync_playwright() as pw:
        ba = pw.chromium.launch(args=args)
        bb = pw.chromium.launch(args=args)
        pa = open_page(ba, sa, NICK_A)
        pb = open_page(bb, sb, NICK_B)

        go(pa, 'fandom')
        strip = pa.locator('.dd-live-strip')
        text = strip.inner_text() if strip.count() else ''
        check('A 로그인 반영', '실시간 접속' in text, text.replace('\n', ' ')[:60])

        # 계정 저장: 미니홈피 제목·테마
        go(pa, 'home')
        pa.get_by_role('button', name='미니홈피', exact=True).first.click()
        pa.wait_for_timeout(900)
        panel = pa.locator('.ddm-panel')
        panel.wait_for(timeout=8000)
        title = f'검증 홈피 {os.getpid()}'
        panel.get_by_label('홈피 제목').fill(title)
        pa.locator('.ddm-themes button').nth(5).click()
        pa.wait_for_timeout(3500)
        shot(pa, 'p2-minihome.png', {'x': 300, 'y': 20, 'width': 760, 'height': 820})
        pa.goto(URL, wait_until='domcontentloaded')
        pa.locator('.dd3-canvas canvas').wait_for(timeout=90000)
        pa.wait_for_timeout(2500)
        go(pa, 'home')
        pa.get_by_role('button', name='미니홈피', exact=True).first.click()
        pa.wait_for_timeout(900)
        restored = pa.locator('.ddm-panel').get_by_label('홈피 제목').input_value()
        check('계정 저장·복원(미니홈피 제목)', restored == title, restored)

        # 친구: B 신청 → A 수락
        friends(pb)
        pb.get_by_label('친구 검색').fill(NICK_A)
        pb.get_by_role('button', name='찾기', exact=True).click()
        pb.wait_for_timeout(1600)
        row = pb.locator('.ddm-list li', has_text=NICK_A).first
        if row.count() and row.locator('button', has_text='친구 신청').count():
            row.get_by_role('button', name='친구 신청', exact=True).click()
            pb.wait_for_timeout(2200)
            check('B 친구 신청', '수락을 기다리는 중' in pb.locator('.ddm-panel').inner_text())
        else:
            skip('B 친구 신청', '이미 친구이거나 신청 버튼이 없습니다.')
        friends(pa)
        pa.wait_for_timeout(1500)
        if pa.get_by_role('button', name='수락', exact=True).count():
            pa.get_by_role('button', name='수락', exact=True).first.click()
            pa.wait_for_timeout(2500)
        accepted = NICK_B in pa.locator('.ddm-panel').inner_text()
        check('A 친구 수락', accepted)
        shot(pa, 'p2-friends.png', {'x': 300, 'y': 20, 'width': 760, 'height': 700})

        # B 방문 → 방명록 → 선물
        pb.goto(URL, wait_until='domcontentloaded')
        pb.locator('.dd3-canvas canvas').wait_for(timeout=90000)
        pb.wait_for_timeout(2500)
        friends(pb)
        pb.wait_for_timeout(1500)
        pb.locator('.ddm-list li', has_text=NICK_A).first.get_by_role('button', name='집', exact=True).click()
        pb.wait_for_timeout(2500)
        dlg = pb.get_by_role('dialog', name=f'{NICK_A}님의 미니홈피')
        dlg.wait_for(timeout=10000)
        note = f'검증 방명록 {os.getpid()}'
        pb.get_by_label('방명록 글').fill(note)
        pb.get_by_role('button', name='남기기', exact=True).click()
        pb.wait_for_timeout(2200)
        check('B 방명록 작성', note in dlg.inner_text())
        pb.get_by_role('button', name='선물 보내기', exact=True).click(force=True, timeout=20000)
        pb.wait_for_timeout(700)
        pb.locator('.ddm-giftbox button', has_text='케이크').first.click()
        pb.locator('.ddm-giftbox button.is-primary').click(force=True, timeout=20000)
        pb.wait_for_timeout(2500)
        shot(pb, 'p2-visit.png', {'x': 280, 'y': 20, 'width': 800, 'height': 820})

        # A 우편함
        go(pa, 'home')
        pa.locator('.dd-home-actions button[aria-label^="우편함"]').click(force=True, timeout=20000)
        pa.get_by_role('dialog', name='우편함').wait_for(timeout=8000)
        pa.wait_for_timeout(1500)
        mail = pa.locator('.ddm-panel').inner_text()
        check('A 우편함 선물 수신', NICK_B in mail, mail.replace('\n', ' ')[:80])
        shot(pa, 'p2-mailbox.png', {'x': 300, 'y': 20, 'width': 760, 'height': 700})

        # 함께 놀기
        to_game(pa)
        to_game(pb)
        pa.wait_for_timeout(2500)
        players_a = pa.locator('.ddm-players').inner_text().replace('\n', ' ')
        check('함께 놀기 참가자 공유', NICK_B in players_a, players_a)
        word = '과자'
        pa.get_by_label('단어').fill(word)
        pa.get_by_role('button', name='말하기', exact=True).click(force=True, timeout=20000)
        pa.wait_for_timeout(3000)
        board_b = pb.locator('.ddm-multi').inner_text().replace('\n', ' | ')
        check('B 화면에 A의 단어 도착', word in board_b, board_b[:120])
        shot(pb, 'p2-game-b.png', {'x': 200, 'y': 60, 'width': 800, 'height': 720})
        ba.close()
        bb.close()

    print('FAILS:', fails if fails else 'none')
    return 1 if fails else 0


sys.exit(main())
