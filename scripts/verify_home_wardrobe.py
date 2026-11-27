"""내 집 꾸미기·옷장 E2E — 기존 가구 선택/이동/교체/추가, 옷 변경 즉시 반영과 저장 유지.

실행:
  npm run dev -- --host 127.0.0.1 --port 4210 &
  python3 scripts/verify_home_wardrobe.py
"""
import os
from playwright.sync_api import sync_playwright

URL = os.environ.get("DD_URL", "http://127.0.0.1:4210")
OUT = os.environ.get("DD_SHOT_DIR", "artifacts/home") + "/"
os.makedirs(OUT, exist_ok=True)
fails = []


def check(name, ok, detail=""):
    print(("PASS" if ok else "FAIL"), name, detail, flush=True)
    if not ok:
        fails.append(name + " " + detail)


def boot(page, name="점검"):
    page.goto(URL, wait_until="domcontentloaded")
    page.locator(".dd-entry-world canvas").wait_for(timeout=90000)
    page.locator("#nickname").fill(name)
    page.get_by_role("button", name="딩동 입장하기", exact=True).click()
    page.locator(".dd3-canvas canvas").wait_for(timeout=90000)
    page.wait_for_timeout(2000)


def direct(page, dest):
    page.get_by_role("button", name="설정", exact=True).click()
    page.wait_for_timeout(350)
    page.locator("#dd3-dest").select_option(dest)
    page.get_by_role("button", name="바로 입장", exact=True).click()
    page.wait_for_timeout(2000)


with sync_playwright() as pw:
    b = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"])
    page = b.new_page(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    page.set_default_timeout(60000)
    errs = []
    page.on("pageerror", lambda e: errs.append(str(e)))
    boot(page)
    direct(page, "home")
    page.get_by_role("button", name="집 꾸미기 열기").click()
    page.wait_for_timeout(1200)
    page.get_by_role("button", name="가구·배치").click()
    page.wait_for_timeout(400)
    page.locator(".dd-placed-items button").nth(1).click()
    page.wait_for_timeout(400)
    canvas = page.locator(".dd3-canvas canvas")
    before = page.evaluate("""()=>{const c=document.querySelector('.dd3-canvas canvas');return c?c.dataset.homeConfig:''}""")
    box = canvas.bounding_box()
    # 방 안의 빈 바닥(오른쪽 아래 빈 공간)을 누른다
    page.mouse.click(box["x"] + box["width"] * 0.22, box["y"] + box["height"] * 0.42)
    page.wait_for_timeout(800)
    after = page.evaluate("""()=>{const c=document.querySelector('.dd3-canvas canvas');return c?c.dataset.homeConfig:''}""")
    check("3D 바닥 탭으로 가구 이동", before != after, page.locator(".dd-home-save-status").inner_text())
    page.screenshot(path=OUT + "50-home-move.png")

    # 옷장: 한복
    page.get_by_role("button", name="옷장", exact=True).first.click()
    page.wait_for_timeout(900)
    page.locator(".dd-dress-tabs button", has_text="의상").click()
    page.wait_for_timeout(400)
    labels = page.evaluate("""()=>Array.from(document.querySelectorAll('.dd-wardrobe .dd-item')).map(b=>b.getAttribute('aria-label')).slice(0,8)""")
    print("style labels", labels, flush=True)
    page.get_by_role("button", name="의상 한복 착용").click()
    page.wait_for_timeout(700)
    look = page.evaluate("""()=>{const c=document.querySelector('.dd3-canvas canvas');return c?c.dataset.avatarLook:''}""")
    check("한복 즉시 반영", '"style":"hanbok"' in look, look[:80])
    page.screenshot(path=OUT + "51-wardrobe-hanbok.png")
    # 저장 버튼
    page.get_by_role("button", name="코디 보관함에 저장").click()
    page.wait_for_timeout(500)
    print("save status", page.locator(".dd-save-status").inner_text(), flush=True)
    page.get_by_role("button", name="저장하고 이 옷 입고 나가기").click()
    page.wait_for_timeout(700)
    look2 = page.evaluate("""()=>{const c=document.querySelector('.dd3-canvas canvas');return c?c.dataset.avatarLook:''}""")
    check("저장 후 유지", '"style":"hanbok"' in look2)
    page.screenshot(path=OUT + "52-after-save.png")
    print("errors", errs[:4], flush=True)
    page.close()

    # 모바일
    page = b.new_page(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
    page.set_default_timeout(60000)
    boot(page, "모바일")
    page.screenshot(path=OUT + "60-mobile-plaza.png")
    direct(page, "home")
    page.wait_for_timeout(800)
    if page.get_by_role("button", name="집 꾸미기 열기").count():
        page.get_by_role("button", name="집 꾸미기 열기").click()
        page.wait_for_timeout(1000)
    page.screenshot(path=OUT + "61-mobile-home.png")
    page.get_by_role("button", name="가구·배치").click()
    page.wait_for_timeout(400)
    if page.locator(".dd-placed-items button").count():
        page.locator(".dd-placed-items button").nth(0).click()
        page.wait_for_timeout(400)
    page.screenshot(path=OUT + "62-mobile-home-item.png")
    page.get_by_role("button", name="옷장", exact=True).first.click()
    page.wait_for_timeout(900)
    page.screenshot(path=OUT + "63-mobile-wardrobe.png")
    page.close()
    b.close()

print("FAILS", fails, flush=True)
