import os
os.makedirs('artifacts',exist_ok=True)
from playwright.sync_api import sync_playwright, expect
rooms=["시즌 파티하우스","혼술 라운지 및 재즈바","낮과 밤의 카페","여행자 클럽","여자들의 수다방","남자들의 아지트","성인 싱글 살롱","게임 라운지","취미 클럽","영화·드라마관","나만의 미니룸","중앙 축제광장"]
with sync_playwright() as p:
    browser=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    for width,height in [(1280,900),(390,844)]:
        page=browser.new_page(viewport={"width":width,"height":height},reduced_motion="reduce")
        errs=[]
        page.on("pageerror",lambda e:errs.append(str(e)))
        page.goto("http://127.0.0.1:4173",wait_until="domcontentloaded")
        expect(page.get_by_role("button",name="수달",exact=True)).to_be_visible()
        page.get_by_role("button",name="수달",exact=True).click()
        page.locator("#nickname").fill("3D테스트")
        page.get_by_role("button",name="딩동 입장하기",exact=True).click()
        canvas=page.locator(".dd3-canvas canvas")
        expect(canvas).to_be_visible(timeout=15000)
        expect(canvas).to_have_attribute("data-room","hall",timeout=15000)
        expect(canvas).to_have_attribute("data-avatar-mode","2d-billboard")
        expect(canvas).to_have_attribute("data-avatar-key","otter")
        expect(canvas).to_have_attribute("data-npc-count","12")
        page.screenshot(path=f'artifacts/hall-{width}.png')
        before=canvas.get_attribute("data-camera")
        page.get_by_role("button",name="카메라 오른쪽 회전").click()
        expect(canvas).not_to_have_attribute("data-camera",before)
        before=canvas.get_attribute("data-position")
        page.get_by_role("button",name="왼쪽 걷기",exact=True).click()
        expect(canvas).not_to_have_attribute("data-position",before)
        for room in rooms:
            page.locator("#dd3-dest").select_option(label=room)
            page.get_by_role("button",name="걸어가기",exact=True).click()
            panel=page.get_by_role("region",name=room,exact=True)
            expect(panel).to_be_visible(timeout=35000)
            assert canvas.get_attribute("data-room")!="hall"
            if room!="나만의 미니룸":
                expect(panel.get_by_role("textbox",name="메시지",exact=True)).to_be_visible(timeout=6000)
            if room=="낮과 밤의 카페":
                page.get_by_role("button",name="밤의 카페",exact=True).click()
                expect(page.get_by_role("button",name="낮의 카페",exact=True)).to_be_visible()
            if room=="시즌 파티하우스":
                page.screenshot(path=f"artifacts/season-{width}.png")
                panel.get_by_role("textbox",name="메시지",exact=True).fill("3D 테스트")
                panel.get_by_role("button",name="전송",exact=True).click()
                expect(panel.get_by_text("3D 테스트",exact=True)).to_be_visible()
            page.get_by_role("button",name="복도로 걷기",exact=True).click()
            expect(canvas).to_have_attribute("data-room","hall",timeout=15000)
            expect(panel).to_have_count(0)
        assert not errs,errs
        assert page.evaluate("document.documentElement.scrollWidth <= innerWidth + 1")
        print(f"PASS {width}x{height}: 3D canvas, camera, movement, 12 rooms, chat, exit")
        page.close()
    browser.close()
