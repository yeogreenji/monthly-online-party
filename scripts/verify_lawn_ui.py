"""3D 마을 조경·플로팅 버튼 검증.

python3 scripts/verify_lawn_ui.py [desktop|mobile|all]

확인
  · 광장 → 공간 '걸어가기'가 실제 경로로 이동하는지(순간이동 대체가 아닌지)
  · '바로 입장'으로 모든 공간 패널이 열리는지
  · 플로팅 버튼이 서로 겹치지 않는지
  · 콘솔 에러 없음, 새 조경 배치 수
"""
import os
import sys
from playwright.sync_api import sync_playwright, expect

URL = os.environ.get("DD_URL", "http://127.0.0.1:4210")
ROOMS = ["시즌 파티하우스", "혼술 라운지 및 재즈바", "낮과 밤의 카페", "여행자 클럽",
         "여자들의 수다방", "남자들의 아지트", "성인 싱글 살롱", "게임 라운지",
         "취미 클럽", "덕질 존", "영화·드라마관", "나만의 미니룸"]
WALK = {"desktop": ["시즌 파티하우스", "게임 라운지", "나만의 미니룸"],
        "mobile": ["낮과 밤의 카페", "여행자 클럽", "덕질 존"]}
# python3 scripts/verify_lawn_ui.py desktop walks "시즌 파티하우스,게임 라운지" | rooms
TASK = sys.argv[2] if len(sys.argv) > 2 else "all"
PICK = sys.argv[3].split(",") if len(sys.argv) > 3 else None
PAIRS = [(".dd-map-views", ".dd-quick-links"), (".dd-map-views", ".dd-bell-shortcut"),
         (".dd-room-actions", ".dd-bell-shortcut"), (".dd-map-views", ".dd-room-actions"),
         (".dd-quick-links", ".dd-bell-shortcut"), (".dd-camera-control", ".dd3-chat")]


def select_room(page, room):
    """잠금 표시가 붙은 옵션도 있어 라벨 대신 값으로 고른다."""
    opts = page.evaluate("""()=>Array.from(document.querySelectorAll('#dd3-dest option')).map(o=>[o.value,o.textContent])""")
    for value, text in opts:
        if text.strip().startswith(room):
            page.locator("#dd3-dest").select_option(value=value)
            return
    raise AssertionError(f"option not found: {room} in {[t for _, t in opts]}")


def ensure_menu(page):
    if page.locator(".dd3-access-menu[open]").count() == 0:
        page.get_by_role("button", name="설정", exact=True).click()
        page.wait_for_timeout(350)


def box(page, sel):
    return page.evaluate("""(s)=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]}""", sel)


def overlap(a, b):
    if not a or not b:
        return False
    return not (a[2] <= b[0] + 1 or b[2] <= a[0] + 1 or a[3] <= b[1] + 1 or b[3] <= a[1] + 1)


which = sys.argv[1] if len(sys.argv) > 1 else "all"
targets = {"desktop": [(1280, 900)], "mobile": [(390, 844)]}.get(which) or [(1280, 900), (390, 844)]
kind = {"desktop": "desktop", "mobile": "mobile"}
failures = []

with sync_playwright() as p:
    browser = p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    for width, height in targets:
        mode = "desktop" if width > 760 else "mobile"
        page = browser.new_page(viewport={"width": width, "height": height}, reduced_motion="reduce")
        page.set_default_timeout(120000)
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(URL, wait_until="domcontentloaded")
        expect(page.locator(".dd-entry-world canvas")).to_be_visible(timeout=60000)
        page.locator("#nickname").fill("경로테스트")
        page.get_by_role("button", name="딩동 입장하기", exact=True).click()
        canvas = page.locator(".dd3-canvas canvas")
        expect(canvas).to_be_visible(timeout=60000)
        page.wait_for_timeout(2500)
        decor = canvas.get_attribute("data-lawn-decor")
        print(f"[{width}] lawnDecor={decor}", flush=True)
        if not decor or int(decor) < 40:
            failures.append(f"{width}: 조경 배치 수 부족({decor})")

        for a, b in PAIRS:
            ba, bb = box(page, a), box(page, b)
            if overlap(ba, bb):
                failures.append(f"{width}: 겹침 {a}{ba} / {b}{bb}")
                print(f"[{width}] OVERLAP {a}{ba} {b}{bb}", flush=True)

        page.get_by_role("button", name="설정", exact=True).click()
        page.wait_for_timeout(400)

        # 1) 실제 경로 이동(표본)
        walk_rooms = PICK if (PICK and TASK in ("walks", "all")) else ([] if TASK == "rooms" else WALK[mode])
        for room in walk_rooms:
            select_room(page, room)
            page.get_by_role("button", name="걸어가기", exact=True).click()
            page.wait_for_timeout(400)
            status = page.locator(".dd3-title span").inner_text() if page.locator(".dd3-title span").count() else ""
            expect(page.get_by_role("region", name=room, exact=True)).to_be_visible(timeout=150000)
            if "걸어가는 중" not in status:
                failures.append(f"{width}: {room} 경로 실패(status={status!r})")
            print(f"[{width}] walked {room}", flush=True)
            ensure_menu(page)
            page.get_by_role("button", name="복도로 걷기", exact=True).click()
            page.wait_for_timeout(500)
            expect(page.get_by_role("button", name="광장으로 돌아가기", exact=True)).to_be_visible(timeout=40000)

        # 2) 모든 공간 즉시 입장 확인
        rooms_only = [] if TASK == "walks" else ROOMS
        ensure_menu(page)
        for room in rooms_only:
            select_room(page, room)
            locked = room in ("혼술 라운지 및 재즈바", "성인 싱글 살롱")
            enter = page.get_by_role("button", name="바로 입장", exact=True)
            if not (enter.count() and enter.first.is_visible()):
                enter = page.get_by_role("button", name="공간 구경", exact=True)
            enter.first.click()
            if locked:
                expect(page.locator(".dd-preview-notice")).to_be_visible(timeout=30000)
            else:
                expect(page.get_by_role("region", name=room, exact=True)).to_be_visible(timeout=30000)
            ensure_menu(page)
            page.get_by_role("button", name="복도로 걷기", exact=True).click()
            page.wait_for_timeout(350)
        print(f"[{width}] all rooms open", flush=True)

        if errors:
            failures.append(f"{width}: pageerror {errors[:2]}")
        page.close()
    browser.close()

if failures:
    print("FAIL")
    for f in failures:
        print(" -", f)
    sys.exit(1)
print("PASS: 경로·입장·버튼 배치")
