# 테스트 기록 — 2026-11-28 (안정성 1~5번 개편)

## 안정성 개편 구현·검증 (피클)
기준: `7edb89d`(main) + 이번 변경. 도구: Vite 7 빌드, `tsc --noEmit`, headless Chromium(swiftshader), 운영 Supabase(`ksctvweuhnfjrqnuokmn`) 대시보드 SQL Editor·REST API.

### 실제 구현 (운영 DB·실서버 검증)
- `supabase/008_stability.sql` 적용 — 멱등 확인을 위해 **두 번 연속 실행**해 모두 통과(70개 문장).
  - `room_members` 표, `join_room`/`heartbeat_room`/`leave_room`/`room_counts`/`room_capacity` RPC, `messages_room_guard` 트리거.
  - `can_read_chat_photo`/`can_upload_chat_photo` + Storage 정책 3종 교체(`chat_photos_read_member`).
  - `messages.reply_to`, `message_reactions`, `messages_reply_guard`, `note_messages_photo_owner`(대화 경로 일치).
  - `note_messages`·`note_threads` 읽기 정책 강화, `note_messages_guard`를 security definer로 교체, `is_blocked()`.
  - 새 함수는 `anon`·`public` 실행 권한 회수, `authenticated`만 grant. 반응 표는 `authenticated`에 select/insert/delete + RLS.
- 운영 DB에 남아 있던 결함 2건을 찾아 함께 고쳤다: ①`topics.id` 기본값 없음(서버가 호실을 만들 수 없었음) ②`friendships.requester` 기본값 없음(친구 요청이 RLS에서 거부됨).

**독립 계정 REST 검증 — 38/38** (`t_all.py`)
- 정원 2명: A(1/2) → B(2/2) → C는 `assigned=true`로 '정원검증-xxxx 2호실' 배정(정원 2·소유자 C).
- 동시 입장 경합(3명 동시, 정원 2): 어느 방도 2명 초과 0, 정확히 2+1로 갈림.
- 20명 규모: 서버에 20명 자리를 만든 뒤 21번째가 '스무명-xxxx 2호실'로 자동 배정, 원래 방 20명 유지.
- 하트비트·퇴장·재입장 반영, `room_counts` 집계 일치.
- 메시지: 비멤버 `room_membership_required`, 멤버 성공, 같은 방 답장 성공·다른 방 답장 `reply_not_in_room`.
- 반응: 멤버 성공·비멤버 RLS 거부·조회 0건·허용 외 이모지 check 위반.
- 사진: 멤버 업로드 성공, 입장 안 한 방 경로 403, 남의 폴더 403, 다른 방 사진 경로 `photo_topic_mismatch`, 같은 방 멤버 B 서명 URL 발급 + 실제 다운로드 200(286B), 비멤버 C 서명 URL 404·목록 0건, 멤버 목록 2건.

**1:1 채팅 — 34/34** (`t_friend.py`)
- 친구 아닌 상대 `open_friend_chat` → `friends_only`.
- 수락 전 쪽지 1통만, 2통째 `note_intro_limit`, 받은 사람은 1통 열람, 거절 후 요청자 전송 차단(RLS).
- 친구 수락 후 1:1 방 열림, A/B 메시지·사진 저장, A가 B의 사진 서명 URL 발급(200), 당사자 아닌 C는 메시지 0건·사진 400.
- 차단 즉시: 차단한 사람·차단당한 사람 모두 대화 0건, 차단당한 A 사진 차단, A 메시지 `blocked`, 채팅방 열기 `blocked`.
- 차단 해제 후 대화 복구, 친구 해제 즉시 대화 0건·사진 차단·메시지 `friends_only`·채팅방 열기 `friends_only`.

### 실제 화면 (Playwright, 운영 Supabase)
`scripts/verify_stability.py` — DD_STAGE별로 실행.
- **chat 14/14**: 조작 안내 띠 표시 → 터치로 사라짐 → 다시 열어도 뜨지 않음. 입장 직후 서버 인원 1/2. A 메시지 전송·표시. 사진 2장 미리보기·말풍선 2개. B가 실시간 수신하고 **사진 2장이 실제로 그려짐(2/2, naturalWidth>0)**. B 답장 → 양쪽 화면에 인용 블록. B 👍 → B 화면 칩 + A 화면 실시간 반영.
- **capacity 6/6**: A(화면)+B(서버 RPC)로 2/2 → A 화면에 2/2 반영, C는 화면에서 '2호실'로 자동 배정(1/2) + 안내 문구, 원래 방 2명 유지.
- **rollback 3/3**: 정상 전송 시 객체 2개(원본+썸네일) → 메시지 INSERT를 500으로 막고 전송하면 '다시 시도' 안내, 실패 후 Storage 추가 객체 **0**.
- **mobile 4/4**: 390x844에서 입력창이 화면 안(y=776, h=46), 메시지·사진 말풍선 표시, 반응 줄이 화면 폭을 넘지 않음.

### 회귀
- `scripts/verify_chat_e2e.py` 2/2 (데스크톱·모바일 게임 라운지·카페·새 모임 입력/전송).
- `scripts/verify_step3.py` DD_PHASE=spaces **86/86**, DD_PHASE=features **29/29**.
- `npm run build`, `npx tsc --noEmit` 통과.

### 미검증·한계
- 실기기(폰) 카메라 촬영·모바일 키보드 동작은 이번 자동 검증에 없다(390x844 에뮬레이션만).
- `messages` SELECT 범위는 여전히 로그인 이용자 전체다. 사진·Storage 접근만 방 단위로 좁혔다(글이 남는 것은 의도된 유지).
- 1:1 채팅에는 답장·반응이 없다(요구 4번은 방 채팅 기준으로 구현).
- 클립보드 붙여넣기는 Playwright 문자 입력으로 자동 검증하지 못했다(코드 경로만 구현, 이미지 파일 붙여넣기 이벤트 처리).
- 부하 시험(수백~수만 동시 접속)은 하지 않았다. 20명 정원·경합은 검증했다.
- Storage 고아 정리는 '방 사진첩을 열 때 내 폴더·10분 경과·메시지 없음' 조건이며, 서버 예약 작업은 없다.

### 정리
검증 후 테스트 계정 3개 + 부하검증 계정 20개, 테스트 모임·메시지·멤버십·Storage 사진, 임시 RPC(`_maint`, `_maint_q`)·허용 목록을 모두 삭제했다.
