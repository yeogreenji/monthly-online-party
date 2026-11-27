"""게임 라운지 미니게임 10종 E2E — 실제 클릭·입력·진행·결과 표시까지 확인한다.

실행:
  npm run dev -- --host 127.0.0.1 --port 4173 &
  python3 scripts/verify_games_e2e.py          # 기본 http://127.0.0.1:4210

확인: 밸런스 살롱·OX 퀴즈·끝말잇기·힌트 맞히기·그림 맞히기·틱택토·스무고개·룰렛 뽑기·주사위 대결·미션 빙고
      + 콘솔 페이지 오류 없음
"""
import os, sys
from playwright.sync_api import sync_playwright

URL = os.environ.get("DD_URL", "http://127.0.0.1:4210")
OUT = os.environ.get("DD_SHOT_DIR", "artifacts/games") + "/"
os.makedirs(OUT, exist_ok=True)
log = []
fails = []


def check(name, ok, detail=""):
    log.append(("PASS" if ok else "FAIL", name, detail))
    if not ok:
        fails.append(f"{name} {detail}")


with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    page = b.new_page(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    page.set_default_timeout(45000)
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    page.goto(URL, wait_until="domcontentloaded")
    page.locator(".dd-entry-world canvas").wait_for(timeout=90000)
    page.locator("#nickname").fill("게임점검")
    page.get_by_role("button", name="딩동 입장하기", exact=True).click()
    page.locator(".dd3-canvas canvas").wait_for(timeout=90000)
    page.wait_for_timeout(1800)
    page.get_by_role("button", name="설정", exact=True).click()
    page.wait_for_timeout(300)
    page.locator("#dd3-dest").select_option("games")
    page.get_by_role("button", name="바로 입장", exact=True).click()
    page.wait_for_timeout(2000)
    if page.locator(".dd-room-join").count():
        page.locator(".dd-room-join").first.click()
        page.wait_for_timeout(1500)
    page.locator(".ddg-tray summary").first.click()
    page.wait_for_timeout(600)
    page.locator(".ddg-corner-card").first.click()
    page.wait_for_timeout(1200)
    check("게임 탁자 열림", page.locator(".ddg-stage").count() == 1)

    def dock(title):
        page.locator(".ddg-dock-btn", has_text=title).first.click()
        page.wait_for_timeout(700)

    # 1 밸런스
    dock("밸런스 살롱")
    page.locator(".ddg-card-a").click()
    page.wait_for_timeout(400)
    check("밸런스 카드 선택", page.locator(".ddg-pair.is-picked").count() == 1)
    page.get_by_role("button", name="다음 세트").click()
    page.wait_for_timeout(300)
    check("밸런스 다음 세트", "2 /" in page.locator(".ddg-progress").inner_text())
    page.screenshot(path=OUT + "1-balance.png")

    # 2 OX
    dock("OX 퀴즈")
    page.get_by_role("button", name="O, 맞다").click()
    page.wait_for_timeout(500)
    check("OX 정답 해설", page.locator(".ddg-explain").count() == 1)
    page.get_by_role("button", name="다음 문제").click()
    page.wait_for_timeout(300)
    check("OX 다음 문제", "2 /" in page.locator(".ddg-progress").inner_text())
    page.screenshot(path=OUT + "2-quiz.png")

    # 3 끝말잇기
    dock("끝말잇기")
    page.get_by_role("button", name="한 판 시작").click()
    page.wait_for_timeout(400)
    need = page.locator(".ddg-word-need strong").inner_text()
    page.get_by_label("끝말잇기 단어").fill(need + "가")
    page.get_by_role("button", name="잇기", exact=True).click()
    page.wait_for_timeout(600)
    updated = page.locator(".ddg-word-log").count() > 0 or page.locator(".ddg-result, .ddg-explain").count() > 0
    check("끝말잇기 단어 제출", updated)
    if page.get_by_role("button", name="한 판 더").count():
        page.get_by_role("button", name="한 판 더").click()
        page.wait_for_timeout(400)
    page.screenshot(path=OUT + "3-word.png")

    # 4 힌트 맞히기
    dock("힌트 맞히기")
    page.get_by_role("button", name="힌트 하나 더 (점수 -1)").click()
    page.wait_for_timeout(300)
    page.get_by_label("수수께끼 정답").fill("테스트")
    page.get_by_role("button", name="정답 확인").click()
    page.wait_for_timeout(400)
    check("수수께끼 오답 안내", page.locator(".ddg-notice").count() >= 1)
    page.screenshot(path=OUT + "4-riddle.png")

    # 5 그림 맞히기
    dock("그림 맞히기")
    page.locator(".ddg-plaque").first.click()
    page.wait_for_timeout(400)
    check("그림 선택 결과", page.locator(".ddg-notice").count() >= 1)
    page.get_by_role("button", name="다음 그림").click()
    page.wait_for_timeout(300)
    check("그림 다음 라운드", "2 /" in page.locator(".ddg-progress").inner_text())
    page.screenshot(path=OUT + "5-picture.png")

    # 6 틱택토
    dock("틱택토")
    page.locator(".ddg-ttt-board button").first.click()
    page.wait_for_timeout(1200)
    marks = page.locator(".ddg-ttt-board button[data-mark='X']").count() + page.locator(".ddg-ttt-board button[data-mark='O']").count()
    check("틱택토 착수", marks >= 2, f"marks={marks}")
    page.screenshot(path=OUT + "6-tictactoe.png")

    # 7 스무고개
    dock("스무고개")
    page.locator(".ddg-token").first.click()
    page.wait_for_timeout(400)
    check("스무고개 질문", page.locator(".ddg-notes").count() >= 1)
    page.get_by_label("스무고개 답안").fill("강아지")
    page.get_by_role("button", name="보내기").click()
    page.wait_for_timeout(400)
    check("스무고개 추측", page.locator(".ddg-notes.is-guess").count() >= 1)
    page.screenshot(path=OUT + "7-twenty.png")

    # 8 룰렛
    dock("룰렛 뽑기")
    page.get_by_role("button", name="룰렛 돌리기").click()
    page.wait_for_timeout(4300)
    check("룰렛 결과", page.locator(".ddg-explain.is-right").count() >= 1)
    page.screenshot(path=OUT + "8-roulette.png")

    # 9 주사위
    dock("주사위 대결")
    for _ in range(3):
        page.get_by_role("button", name="주사위 굴리기").click()
        page.wait_for_timeout(1500)
    check("주사위 판 진행", "판수" in page.locator(".ddg-dice-score").inner_text())
    page.screenshot(path=OUT + "9-dice.png")

    # 10 빙고
    dock("미션 빙고")
    cells = page.locator(".ddg-bingo-cell")
    for i in range(4):
        cells.nth(i).click()
        page.wait_for_timeout(150)
    txt = page.locator(".ddg-bingo .ddg-notice").inner_text()
    check("빙고 한 줄", "한 줄 완성" in txt or "빙고" in txt, txt[:30])
    page.screenshot(path=OUT + "10-bingo.png")

    check("콘솔 오류 없음", len(errs) == 0, str(errs[:3]))
    b.close()

for row in log:
    print(*row, flush=True)
print("FAILS", len(fails), flush=True)
sys.exit(1 if fails else 0)
