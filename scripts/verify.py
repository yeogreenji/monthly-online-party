#!/usr/bin/env python3
"""딩동 (DINGDONG) 검증 스크립트.

준비:
  export PATH=/workspace/.tools/node-v22.12.0-linux-x64/bin:$PATH
  npm install
  npm run build
  node_modules/.bin/esbuild api/party-chat.ts --bundle --format=esm --platform=node --target=node20 --outfile=.tmp/party-chat.mjs

실행:
  python3 scripts/verify.py

검증 범위
  · /api/party-chat 계약 (GEMINI_API_KEY가 없을 때의 폴백 포함)
  · 데스크톱 1440×900: 입장 → 12월 파티 → 1·2월 전환 → 초대장/알림 → 4개 취향방 →
    채팅·호스트 응답·짠 소리/카운터·음악 재생·스포일러·한 줄 평 → 포토월 업로드 →
    쪽지 수락/대화 → 스폰서 쿠폰·룰렛 → 미디어킷·문의 폼 → 나이트 모드 → 새로고침 후 유지
  · 모바일 390×844: 입장 → 홈/취향방/방 채팅 → 포토월 → 쪽지 → 미디어킷

이 작업 환경의 Chromium은 시스템 라이브러리를 따로 봐야 합니다:
  export LD_LIBRARY_PATH=/workspace/.libs/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH
"""

from __future__ import annotations

import json
import os
import re
import shutil
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import Page, sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / "docs" / "screenshots"
TMP = ROOT / ".tmp"
PORT = int(os.environ.get("VERIFY_PORT", "4211"))
BASE = f"http://127.0.0.1:{PORT}"
NODE = os.environ.get("NODE_BIN") or shutil.which("node") or "/workspace/.tools/node-v22.12.0-linux-x64/bin/node"

checks: list[tuple[str, bool, str]] = []
console_errors: list[str] = []


def check(name: str, cond: bool, detail: str = "") -> None:
    checks.append((name, bool(cond), detail))
    mark = "PASS" if cond else "FAIL"
    print(f"[{mark}] {name}" + (f"  — {detail}" if detail and not cond else ""), flush=True)


def wait_port(port: int, timeout: float = 25.0) -> None:
    end = time.time() + timeout
    while time.time() < end:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.4):
                return
        except OSError:
            time.sleep(0.15)
    raise RuntimeError(f"port {port} did not open")


def start_server() -> subprocess.Popen:
    bundle = TMP / "party-chat.mjs"
    if not bundle.exists():
        esbuild = ROOT / "node_modules" / ".bin" / "esbuild"
        subprocess.run(
            [str(esbuild), "api/party-chat.ts", "--bundle", "--format=esm", "--platform=node", "--target=node20", "--outfile=.tmp/party-chat.mjs"],
            cwd=ROOT,
            check=True,
            capture_output=True,
        )
    log = open(TMP / "serve.log", "w")
    env = {**os.environ, "PORT": str(PORT), "UV_THREADPOOL_SIZE": "1"}
    proc = subprocess.Popen([NODE, "--v8-pool-size=1", "scripts/serve.mjs"], cwd=ROOT, env=env, stdout=log, stderr=subprocess.STDOUT)
    wait_port(PORT)
    return proc


def api_check() -> None:
    body = json.dumps(
        {
            "mode": "room",
            "roomId": "wine",
            "roomName": "오늘 밤 9시 혼술 타임",
            "roomTopic": "집에서 마시는 한 잔",
            "host": "살롱지기",
            "profile": {"nickname": "검증손님", "ageBand": "30대", "tags": ["독서"]},
            "message": "오늘 야근하고 와서 한 잔 하려고요. 안주는 뭐가 좋을까요?",
            "history": [],
        }
    ).encode("utf-8")
    req = urllib.request.Request(f"{BASE}/api/party-chat", data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            data = json.loads(res.read().decode("utf-8"))
        reply = str(data.get("reply", ""))
        check("API: 채팅 응답 200 + reply", res.status == 200 and len(reply) > 8, reply[:80])
        check("API: 모델 표기", bool(data.get("model")), str(data.get("model")))
    except Exception as error:  # noqa: BLE001
        check("API: 채팅 응답 200 + reply", False, str(error))

    # 빈 메시지는 400
    req = urllib.request.Request(f"{BASE}/api/party-chat", data=b"{}", headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            check("API: 빈 메시지 거절", res.status == 400, str(res.status))
    except urllib.error.HTTPError as error:
        check("API: 빈 메시지 거절", error.code == 400, str(error.code))
    except Exception as error:  # noqa: BLE001
        check("API: 빈 메시지 거절", False, str(error))

    # 쪽지 모드도 응답
    body = json.dumps(
        {
            "mode": "note",
            "profile": {"nickname": "검증손님", "ageBand": "30대", "tags": []},
            "peer": {"nickname": "밤의 서재", "ageBand": "30대", "tags": ["독서"], "context": "혼술 타임"},
            "message": "아까 이야기 감사했어요.",
        }
    ).encode("utf-8")
    req = urllib.request.Request(f"{BASE}/api/party-chat", data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            data = json.loads(res.read().decode("utf-8"))
        check("API: 쪽지 모드 응답", len(str(data.get("reply", ""))) > 5, str(data)[:80])
    except Exception as error:  # noqa: BLE001
        check("API: 쪽지 모드 응답", False, str(error))


def scroll_to(page: Page, selector: str, offset: int = 140) -> None:
    page.evaluate(
        """([sel, off]) => {
          const el = document.querySelector(sel);
          if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - off, behavior: 'auto' });
        }""",
        [selector, offset],
    )
    page.wait_for_timeout(800)


def shot(page: Page, name: str) -> None:
    SHOTS.mkdir(parents=True, exist_ok=True)
    page.wait_for_timeout(350)
    page.screenshot(path=str(SHOTS / f"{name}.png"))


def text(page: Page, selector: str) -> str:
    try:
        return page.locator(selector).first.inner_text(timeout=4000)
    except Exception:  # noqa: BLE001
        return ""


def body_text(page: Page) -> str:
    try:
        return page.locator("body").inner_text(timeout=5000)
    except Exception:  # noqa: BLE001
        return ""


def no_horizontal_overflow(page: Page) -> bool:
    width = page.evaluate("() => ({scroll: document.documentElement.scrollWidth, inner: window.innerWidth})")
    return width["scroll"] <= width["inner"] + 2


def enter(page: Page, nickname: str = "검증 손님") -> None:
    page.fill("#nickname", nickname)
    page.get_by_role("button", name="30대", exact=True).click()
    page.get_by_role("button", name="독서", exact=True).click()
    page.get_by_role("button", name="살롱 입장하기").click()
    page.wait_for_timeout(900)


def desktop_flow(browser) -> None:
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, locale="ko-KR")
    page = ctx.new_page()
    page.on("pageerror", lambda error: console_errors.append(f"pageerror: {error}"))
    page.on("console", lambda msg: console_errors.append(f"console: {msg.text}") if msg.type == "error" else None)

    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(800)
    check("데스크톱: 온보딩 표시", "어떤 캐릭터로 들어올까요?" in body_text(page))
    check("데스크톱: 캐릭터 8종", page.locator("button[aria-label='고양이'], button[aria-label='곰돌이'], button[aria-label='여우'], button[aria-label='토끼'], button[aria-label='산타냥'], button[aria-label='부엉이'], button[aria-label='다람쥐'], button[aria-label='펭귄']").count() == 8)
    shot(page, "01-onboarding")

    enter(page)
    check("데스크톱: 입장 후 이름 표시", "검증 손님" in body_text(page))
    title = text(page, "h1")
    check("데스크톱: 12월 메인 파티", "크리스마스 이브 홈파티" in title, title)
    check("데스크톱: D-day 표시", bool(re.search(r"D-\d+", body_text(page))))
    check("데스크톱: 카운트다운 4칸", page.locator("#party .tabular-nums").count() >= 4)
    shot(page, "02-home-december")

    # 1월 · 2월 전환
    page.locator("button", has_text="새해 복주머니").first.click()
    page.wait_for_timeout(700)
    check("데스크톱: 1월 파티 전환", "새해 복주머니 & 떡국 파티" in text(page, "h1"), text(page, "h1"))
    check("데스크톱: 1월 안내 문구", "1월의 밤" in body_text(page))
    page.locator("button", has_text="발렌타인 심야 시네마").first.click()
    page.wait_for_timeout(700)
    check("데스크톱: 2월 파티 전환", "발렌타인 심야 시네마" in text(page, "h1"), text(page, "h1"))
    shot(page, "03-home-february")
    page.locator("button", has_text="크리스마스 이브 홈파티").first.click()
    page.wait_for_timeout(700)

    # 초대장 + 캘린더 파일
    page.get_by_role("button", name="초대장 예약하기").click()
    page.wait_for_timeout(300)
    check("데스크톱: 초대장 예약 상태", "초대장을 예약했어요" in body_text(page))
    with page.expect_download(timeout=8000) as download_info:
        page.get_by_role("button", name="캘린더에 저장").click()
    download = download_info.value
    ics = Path(download.path()).read_text(encoding="utf-8", errors="ignore")
    check("데스크톱: .ics 다운로드", "BEGIN:VCALENDAR" in ics and "크리스마스 이브 홈파티" in ics, download.suggested_filename)

    # 프로그램 · 취향방
    scroll_to(page, "#program")
    page.wait_for_timeout(1000)
    check("데스크톱: 프로그램 타임라인", "오프닝 건배" in body_text(page) and "마지막 건배" in body_text(page))
    shot(page, "04-program")

    scroll_to(page, "#rooms")
    check("데스크톱: 취향방 4개", page.get_by_role("button", name=re.compile("방 들어가기")).count() == 4)
    shot(page, "05-rooms")

    # 혼술방
    page.get_by_role("button", name="오늘 밤 9시 혼술 타임 방 들어가기").click()
    page.wait_for_timeout(900)
    check("데스크톱: 혼술방 열림", "오늘 밤 9시 혼술 타임" in body_text(page))
    check("데스크톱: 지난 대화 표시", "21시가 됐어요" in body_text(page))
    before_clinks = int(re.sub(r"[^0-9]", "", text(page, "#room-clinks") or "128") or "128")
    page.get_by_role("button", name="짠!", exact=True).click()
    page.wait_for_timeout(300)
    after_clinks = int(re.sub(r"[^0-9]", "", text(page, "#room-clinks") or str(before_clinks)) or str(before_clinks))
    check("데스크톱: 건배 카운터 증가", after_clinks == before_clinks + 1, f"{before_clinks} -> {after_clinks}")
    check("데스크톱: 건배 애니메이션", page.locator("text=🥂").count() >= 1)
    shot(page, "06-room-wine")

    page.fill("input[aria-label='메시지 입력']", "오늘 회사에서 야근했어요. 그래도 한 잔은 하려고요.")
    page.get_by_role("button", name="보내기", exact=True).click()
    page.wait_for_timeout(1600)
    check("데스크톱: 내 메시지 전송", "오늘 회사에서 야근했어요" in body_text(page))
    check("데스크톱: 호스트 응답", "회사 이야기는 한 잔 하고 나서" in body_text(page) or "얼마나 힘드셨어요" in body_text(page))
    shot(page, "07-room-chat")

    # 신고 흐름
    page.get_by_role("button", name="신고", exact=True).first.click()
    page.wait_for_timeout(400)
    check("데스크톱: 신고 창", "님 신고" in body_text(page))
    page.get_by_role("button", name="신고 접수").click()
    page.wait_for_timeout(500)
    check("데스크톱: 신고 접수", "신고가 접수됐어요" in body_text(page))

    # 라운지: BGM 재생 + 신청곡 투표
    page.locator("aside button", has_text="댄스 · 플레이리스트 라운지").first.click()
    page.wait_for_timeout(500)
    play = page.get_by_role("button", name=re.compile("벽난로 앞"))
    play.click()
    page.wait_for_timeout(600)
    check("데스크톱: BGM 재생 상태", play.get_attribute("aria-pressed") == "true")
    votes_before = text(page, "button[title*='Christmas Time Is Here']")
    page.locator("button[title*='Christmas Time Is Here']").click()
    page.wait_for_timeout(300)
    votes_after = text(page, "button[title*='Christmas Time Is Here']")
    check("데스크톱: 신청곡 투표", votes_before != votes_after, f"{votes_before} -> {votes_after}")
    shot(page, "08-room-music")

    # 영화방: 스포일러 토글
    page.locator("aside button", has_text="같이 보는 드라마").first.click()
    page.wait_for_timeout(500)
    check("데스크톱: 스포일러 가림", "스포일러 · 눌러서 보기" in body_text(page))
    page.get_by_role("button", name="스포일러 가려둠").click()
    page.wait_for_timeout(400)
    check("데스크톱: 스포일러 표시", "마지막 장면에서 다들" in body_text(page))
    shot(page, "09-room-cinema")

    # 독서방: 한 줄 평
    page.locator("aside button", has_text="심야 독서 토론방").first.click()
    page.wait_for_timeout(500)
    page.fill("input[aria-label='한 줄 평']", "검증용 한 줄 평입니다. 겨울밤에 잘 어울려요.")
    page.get_by_role("button", name="한 줄 평 남기기").click()
    page.wait_for_timeout(400)
    check("데스크톱: 한 줄 평 등록", "검증용 한 줄 평입니다" in body_text(page))
    page.get_by_role("button", name="닫기", exact=True).click()
    page.wait_for_timeout(500)

    # 포토월
    scroll_to(page, "#wall")
    shot(page, "10-photo-wall")
    page.get_by_role("button", name="내 사진 올리기").click()
    page.wait_for_timeout(400)
    page.set_input_files("input[type=file]", str(ROOT / "public" / "img" / "feed-book.jpg"))
    page.wait_for_timeout(700)
    page.get_by_role("button", name="매거진", exact=True).click()
    page.fill("textarea[aria-label='사진 설명']", "검증용 사진. 책과 차 한 잔으로 마무리.")
    page.get_by_role("button", name="포토월에 게시").click()
    page.wait_for_timeout(800)
    check("데스크톱: 포토월 게시", "검증용 사진. 책과 차 한 잔으로 마무리." in body_text(page))
    check("데스크톱: 내 사진 배지", "내 사진" in body_text(page))
    shot(page, "11-photo-wall-post")
    first_like = page.get_by_role("button", name="좋아요").first
    first_like.click()
    page.wait_for_timeout(300)
    check("데스크톱: 좋아요 토글", page.get_by_role("button", name="좋아요 취소").count() >= 1)

    # 쪽지
    page.get_by_role("button", name=re.compile("쪽지함")).first.click()
    page.wait_for_timeout(600)
    check("데스크톱: 받은 쪽지 요청 2건", "밤의 서재" in body_text(page) and "골드문" in body_text(page))
    shot(page, "12-notes")
    page.get_by_role("button", name="수락", exact=True).first.click()
    page.wait_for_timeout(700)
    check("데스크톱: 쪽지 수락 후 대화", "서로 수락한 대화입니다" in body_text(page))
    page.fill("input[aria-label='쪽지 입력']", "네, 반가워요. 다음 파티에 그 잔으로 건배해요.")
    page.get_by_role("button", name="보내기", exact=True).click()
    page.wait_for_timeout(1600)
    check("데스크톱: 쪽지 전송", "다음 파티에 그 잔으로" in body_text(page))
    check("데스크톱: 상대 응답", "고마워요" in body_text(page) or "좋아요" in body_text(page) or "들려주실래요" in body_text(page))
    shot(page, "13-notes-thread")
    page.get_by_role("button", name="닫기", exact=True).first.click()
    page.wait_for_timeout(400)

    # 스폰서 · 룰렛
    scroll_to(page, "#brand")
    check("데스크톱: 스폰서 3곳", "메종 그린우드" in body_text(page) and "델리 온도" in body_text(page) and "서재의 밤" in body_text(page))
    page.get_by_role("button", name="쿠폰 받기").first.click()
    page.wait_for_timeout(400)
    check("데스크톱: 쿠폰 발급", "MS-SALON-" in body_text(page))
    shot(page, "14-brand")
    page.get_by_role("button", name="룰렛 돌리기").click()
    page.wait_for_timeout(400)
    page.get_by_role("button", name="돌리기", exact=True).click()
    page.wait_for_timeout(3800)
    check("데스크톱: 룰렛 결과", "오늘의 선물" in body_text(page) and "MS-ROULETTE-" in body_text(page))
    shot(page, "15-roulette")
    page.keyboard.press("Escape")
    page.wait_for_timeout(300)

    # 미디어킷
    page.get_by_role("button", name="브랜드 협찬", exact=True).first.click()
    page.wait_for_timeout(800)
    check("미디어킷: 히어로", "광고가 아니라" in body_text(page))
    check("미디어킷: 패키지 3종", "월간 메인 네이밍 스폰서" in body_text(page) and "21시 타임 스폰서" in body_text(page) and "샘플링 & 경품 룰렛" in body_text(page))
    check("미디어킷: 금액 표기", "300만원" in body_text(page) and "100만원" in body_text(page) and "60만원" in body_text(page))
    shot(page, "16-mediakit-hero")
    scroll_to(page, "#packages", 130)
    shot(page, "17-mediakit-packages")
    scroll_to(page, "#inquiry", 130)
    page.get_by_role("button", name="문의서 만들기").click()
    page.wait_for_timeout(300)
    check("미디어킷: 문의 폼 검증", "브랜드명과 담당자 성함을" in body_text(page))
    page.fill("input[placeholder='예: 메종 그린우드']", "검증브랜드")
    page.fill("input[placeholder='성함 또는 닉네임']", "김 담당")
    page.fill("input[placeholder='name@brand.co.kr']", "verify@brand.co.kr")
    page.get_by_role("button", name="샘플링 룰렛", exact=True).click()
    page.locator("input[type=checkbox]").check()
    page.get_by_role("button", name="문의서 만들기").click()
    page.wait_for_timeout(700)
    check("미디어킷: 문의서 생성", "문의서가 준비됐습니다" in body_text(page) and "MS-" in body_text(page))
    shot(page, "18-mediakit-inquiry")

    # 홈 복귀 후 스크롤 리빌이 다시 동작하는지
    page.get_by_role("button", name="살롱으로 돌아가기").click()
    page.wait_for_timeout(900)
    scroll_to(page, "#program", 120)
    page.wait_for_timeout(2200)
    opacity = page.evaluate("() => { const el = document.querySelector('#program .reveal'); return el ? getComputedStyle(el).opacity : '0'; }")
    check("홈 복귀 후 섹션 표시", float(opacity) > 0.9, f"opacity={opacity}")

    # 나이트 모드 (홈에서)
    page.get_by_role("button", name="나이트 파티 모드로 전환").click()
    page.wait_for_timeout(500)
    check("나이트 모드 전환", page.evaluate("document.documentElement.dataset.theme") == "night")
    page.evaluate("window.scrollTo(0,0)")
    page.wait_for_timeout(700)
    shot(page, "19-night-home")
    page.get_by_role("button", name="낮 모드로 전환").click()
    page.wait_for_timeout(400)

    # 새로고침 후 유지
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(1200)
    check("영속성: 프로필 유지", "검증 손님" in body_text(page))
    check("영속성: 초대장 유지", "초대장을 예약했어요" in body_text(page))
    check("영속성: 포토월 유지", "검증용 사진" in body_text(page))
    check("데스크톱: 콘솔 오류 없음", len(console_errors) == 0, "; ".join(console_errors[:3]))
    ctx.close()


def mobile_flow(browser) -> None:
    ctx = browser.new_context(
        viewport={"width": 390, "height": 844},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True,
        locale="ko-KR",
    )
    page = ctx.new_page()
    page.on("pageerror", lambda error: console_errors.append(f"mobile pageerror: {error}"))

    page.goto(BASE, wait_until="networkidle")
    page.wait_for_timeout(900)
    check("모바일: 온보딩 표시", "어떤 캐릭터로 들어올까요?" in body_text(page))
    check("모바일: 온보딩 가로 넘침 없음", no_horizontal_overflow(page))
    shot(page, "20-mobile-onboarding")
    page.fill("#nickname", "모바일 손님")
    page.get_by_role("button", name="살롱 입장하기").click()
    page.wait_for_timeout(1800)
    check("모바일: 홈 표시", "크리스마스 이브 홈파티" in body_text(page))
    check("모바일: 홈 가로 넘침 없음", no_horizontal_overflow(page))
    check("모바일: 3개월 탭", page.locator("#party button[aria-pressed]").count() == 3)
    shot(page, "21-mobile-home")

    scroll_to(page, "#rooms", 120)
    page.wait_for_timeout(900)
    shot(page, "22-mobile-rooms")
    page.get_by_role("button", name="심야 독서 토론방 방 들어가기").click()
    page.wait_for_timeout(900)
    check("모바일: 방 열림", "심야 독서 토론방" in body_text(page))
    check("모바일: 방 가로 넘침 없음", no_horizontal_overflow(page))
    check("모바일: 방 헤더 버튼", page.get_by_role("button", name="함께 있는 사람들 보기").count() == 1)
    shot(page, "23-mobile-room")
    page.fill("input[aria-label='메시지 입력']", "모바일에서 보내는 첫 메시지입니다.")
    page.get_by_role("button", name="보내기", exact=True).click()
    page.wait_for_timeout(1600)
    mobile_reply = any(
        line in body_text(page)
        for line in ["다 읽지 않아도", "그 문장을 붙잡고", "그렇게 읽으시는", "좋은 이야기예요"]
    )
    check("모바일: 채팅 전송·응답", "모바일에서 보내는 첫 메시지입니다." in body_text(page) and mobile_reply)
    shot(page, "24-mobile-room-chat")
    page.get_by_role("button", name="닫기", exact=True).click()
    page.wait_for_timeout(500)

    scroll_to(page, "#wall", 120)
    shot(page, "25-mobile-wall")

    page.get_by_role("button", name=re.compile("쪽지함")).first.click()
    page.wait_for_timeout(700)
    check("모바일: 쪽지함", "받은 요청" in body_text(page))
    shot(page, "26-mobile-notes")
    page.get_by_role("button", name="닫기", exact=True).first.click()
    page.wait_for_timeout(400)

    page.get_by_role("button", name="메뉴").click()
    page.wait_for_timeout(300)
    page.locator("button", has_text="브랜드 협찬").last.click()
    page.wait_for_timeout(800)
    check("모바일: 미디어킷", "광고가 아니라" in body_text(page))
    check("모바일: 미디어킷 가로 넘침 없음", no_horizontal_overflow(page))
    shot(page, "27-mobile-mediakit")
    scroll_to(page, "#inquiry", 130)
    shot(page, "28-mobile-inquiry")
    ctx.close()


def main() -> None:
    if not (ROOT / "dist" / "index.html").exists():
        print("dist/index.html이 없습니다. 먼저 npm run build를 실행해 주세요.", file=sys.stderr)
        sys.exit(2)
    TMP.mkdir(parents=True, exist_ok=True)
    SHOTS.mkdir(parents=True, exist_ok=True)

    server = start_server()
    try:
        api_check()
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            try:
                desktop_flow(browser)
                mobile_flow(browser)
            finally:
                browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()

    passed = sum(1 for _, ok, _ in checks if ok)
    failed = [(name, detail) for name, ok, detail in checks if not ok]
    print()
    print(f"결과: {passed}/{len(checks)} 통과")
    if failed:
        print("실패 항목:")
        for name, detail in failed:
            print(f"  - {name}  {detail}")
        sys.exit(1)
    print(f"스크린샷: {SHOTS}")


if __name__ == "__main__":
    main()
