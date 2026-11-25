from playwright.sync_api import sync_playwright, expect

WINGS = [
 ("크리스마스 중앙 홀", ["시즌 파티하우스", "혼술 라운지 및 재즈바", "낮과 밤의 카페", "중앙 축제광장"]),
 ("취향의 복도", ["여행자 클럽", "취미 클럽", "영화·드라마관", "게임 라운지"]),
 ("친구들의 살롱", ["여자들의 수다방", "남자들의 아지트", "성인 싱글 살롱", "나만의 미니룸"]),
]
with sync_playwright() as p:
    browser = p.chromium.launch()
    for width, height, motion in [(1280, 900, "no-preference"), (390, 844, "reduce")]:
        page = browser.new_page(viewport={"width": width, "height": height}, reduced_motion=motion)
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto("http://127.0.0.1:4173", wait_until="domcontentloaded")
        page.locator("#nickname").fill("딩동테스트")
        page.get_by_role("button", name="딩동 입장하기", exact=True).click()
        hall = page.locator(".dd-hall")
        expect(hall).to_be_visible()
        walker = hall.locator(".dd-walker")
        before = walker.get_attribute("style")
        page.get_by_role("button", name="왼쪽 걷기", exact=True).click()
        assert walker.get_attribute("style") != before
        for wing, rooms in WINGS:
            page.get_by_role("navigation", name="저택 구역").get_by_role("button", name=wing, exact=False).click()
            for room in rooms:
                page.get_by_role("button", name=room+" 문 열기", exact=True).click()
                dialog = page.get_by_role("dialog", name=room, exact=True)
                expect(dialog).to_be_visible(timeout=6000)
                expect(dialog.get_by_role("img", name=room+" 미니어처 인테리어", exact=True)).to_be_visible()
                if room != "나만의 미니룸":
                    expect(dialog.get_by_role("textbox", name="메시지", exact=True)).to_be_visible(timeout=4000)
                    if room == "시즌 파티하우스":
                        dialog.get_by_role("textbox", name="메시지", exact=True).fill("테스트 메시지")
                        dialog.get_by_role("button", name="전송", exact=True).click()
                        expect(dialog.get_by_text("테스트 메시지", exact=True)).to_be_visible()
                        dialog.get_by_role("button", name="← 모임 목록", exact=True).click()
                        expect(dialog.get_by_role("button", name="+ 모임 만들기", exact=True)).to_be_visible()
                    if room == "낮과 밤의 카페":
                        dialog.get_by_role("button", name="밤의 카페", exact=True).click()
                        expect(dialog.get_by_role("button", name="낮의 카페", exact=True)).to_be_visible()
                dialog.get_by_role("button", name="복도로 나가기", exact=True).click()
                expect(dialog).to_have_count(0)
        assert not errors, errors
        assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), "horizontal overflow"
        print(f"PASS {width}x{height}: 12 rooms, movement, local chat, return, cafe toggle")
        page.close()
    browser.close()
