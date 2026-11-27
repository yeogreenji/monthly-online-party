"""상시 모임(반려동물 자랑방·도란도란 수다방) 빠른 점검. 실행 전 npm run build && npx vite preview --port 4173"""
from playwright.sync_api import sync_playwright, expect
CASES=[("낮과 밤의 카페","도란도란 수다방"),("취미 클럽","반려동물 자랑방")]
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
    errors=[]
    for space,room in CASES:
        page=b.new_page(viewport={"width":390,"height":844},reduced_motion="reduce")
        page.on("pageerror",lambda e:errors.append(str(e)))
        page.goto("http://127.0.0.1:4173")
        page.locator("#nickname").fill("상시방점검")
        page.get_by_role("button",name="딩동 입장하기",exact=True).click()
        page.wait_for_timeout(3000)
        page.get_by_role("button",name="지도",exact=True).click()
        page.locator("button",has_text=space).first.click()
        page.wait_for_timeout(6000)
        page.get_by_role("textbox",name="모임 검색").fill(room)
        expect(page.locator(".dd-room-join")).to_have_count(1,timeout=5000)
        page.locator(".dd-room-join").first.click()
        msg=page.get_by_role("textbox",name="메시지",exact=True)
        expect(msg).to_be_in_viewport(timeout=8000)
        msg.fill(f"{room} 점검 메시지")
        page.get_by_role("button",name="전송",exact=True).click()
        expect(page.get_by_text(f"{room} 점검 메시지",exact=True)).to_be_visible()
        print("OK",space,room)
    assert not errors,errors
    print("console errors: 0")
    b.close()
