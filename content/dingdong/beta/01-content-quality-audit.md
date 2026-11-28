# 01 — 승인 콘텐츠 구현 대조 및 출시 게이트 v1.0
2026-11-28 | 로렌 | 읽기 전용 코드·문서 검수. 기준 main b376d628429c1bafaa23e74a5c097c79c690d44f.
판정: REPORTED_PASS=다른 담당자가 기록한 통과(이번 재실행 아님), IMPLEMENTED=코드 존재, PARTIAL=일부/시연, BLOCKED=출시 전 해결 필요, UNVERIFIED=증거 부족. 기존 정본 및 56개 시험 계획을 대체하지 않는다.
## 대조표
| ID | 승인 범위 | 근거(기준 커밋 상대 경로) | 판정/남은 기준 | 우선순위 |
|---|---|---|---|---|
| Q01 | 13공간·130활동·48메뉴 | CHANGELOG.md, TEST_REPORT.md, src/data/masterContent.ts | REPORTED_PASS 목록 대조 86/86; 메뉴별 실제 동작/실기기 확인 | P1 |
| Q02 | 365일·크리스마스 | src/data/events365.ts, TEST_REPORT.md | PARTIAL 편성 표시, 실제 예약·시작·진행·참여 기록 및 2027 이후 공식 날짜/수능·추모일 갱신 | P1 |
| Q03 | 16주민·96주제 | src/data/residentDialogueV2.ts, scripts/tests/dialogue.test.ts | REPORTED_PASS 규칙 기반 매칭; 자연스러운 주제 전환·반복·기억 삭제 및 기기별 차이 검수 | P2 |
| Q04 | 계정·미니홈피 저장 | supabase/005_social_minihome.sql, TEST_REPORT.md | REPORTED_PASS A/B 저장·복원; 공유 기기 계정 전환/로컬 값 덮어쓰기 및 개별 공개 범위 확인 | P0 |
| Q05 | 친구·방명록·선물 | TEST_REPORT.md, src/components/SocialPanels.tsx | REPORTED_PASS 실제 2계정; 차단·철회 및 소유자 삭제 확인 | P0 |
| Q06 | 친구 집 방문 | src/components/SocialPanels.tsx RoomPreview | PARTIAL 미리보기; 실제 3D 방문·퇴장·권한 철회 | P2 |
| Q07 | 쪽지·DM 동의 | supabase/007_friend_chat.sql, src/components/FriendChat.tsx | BLOCKED 친구 수락 시 채팅 자동 허용과 기존 별도 상호 동의 충돌; 수신 동의 철회·차단·친구 해제 검증 | P0 |
| Q08 | 사진 채팅 기본 | src/lib/photoChat.ts, supabase/006_photo_chat.sql, TEST_REPORT.md | IMPLEMENTED 압축·썸네일·저장소·확대; 실제 A/B 업로드·구독·수신 미검증 | P0 |
| Q09 | 사진 읽기 접근 권한 | supabase/006_photo_chat.sql chat_photos_read_authed | BLOCKED 로그인 전체 읽기 허용, 1:1 사진 포함; 방 권한·당사자 기준 제한 및 비회원 C 부정 시험 | P0 |
| Q10 | 사진 편의 | src/components/DingdongSpaces.tsx attachPhoto/send | PARTIAL 단일 사진; 다중 첨부·답장·반응·PC 붙여넣기·실패 재시도 | P1 |
| Q11 | 사진 안전·정리 | src/lib/photoChat.ts, src/components/DingdongSpaces.tsx send, src/components/FriendChat.tsx send | PARTIAL 브라우저 재인코딩, 파일 상한; 서버 검증/메시지 실패 후 고아 객체 정리/삭제 실패 재시도/권한 철회 | P0 |
| Q12 | 20명 정원·추가방 | src/components/DingdongSpaces.tsx roomCount/openNextRoom | BLOCKED 클라이언트 presence 기반, 서버 원자적 입장 및 중복 호실 방지 미확인 | P0 |
| Q13 | 접속자·말풍선 | src/components/DingdongSpaces.tsx, TEST_REPORT.md | IMPLEMENTED presence 표시; 재접속/중복 탭/방 이동/실제 정원과 일치 확인 | P1 |
| Q14 | 덕질 존 | src/components/DingdongSpaces.tsx, CHANGELOG.md | IMPLEMENTED 자유 아티스트·모임 수정 삭제; 실제 DB·A/B 검색·필터 검증 | P1 |
| Q15 | 의상 8컬렉션 | src/data/collections.ts | PARTIAL 기존 모델 매핑(커피잔=tote, 응원봉=necklace); 독립 모델/호환 슬롯·무료 보존 | P2 |
| Q16 | 미니룸 8테마·카탈로그 | src/data/collections.ts, phase4-5/03-asset-catalog.json | PARTIAL 색상 프리셋 중심; 128 항목은 기획 후보, 고유 모델/개별 배치 및 저장 검증 | P2 |
| Q17 | 감정 16종 | src/data/collections.ts, TEST_REPORT.md | PARTIAL 말풍선; 실제 동작 및 상대방 화면 확인 | P2 |
| Q18 | 게임 10종 | src/components/games/MultiTable.tsx, TEST_REPORT.md | PARTIAL 끝말잇기 A/B 통과 기록; 10종 전수 다중 검증·방장 교체·재접속 | P1 |
| Q19 | 문 열기·조용히 있기 | src/components/FunPanel.tsx, DingdongSpaces.tsx | PARTIAL 공개 범위와 문 상태 분리, 기존 설정 복원 및 실제 이용자 표시 | P1 |
| Q20 | 티켓·네컷 | src/components/FunPanel.tsx | PARTIAL 로컬 합성; 실제 참여 검증·촬영/공유 동의 | P2 |
| Q21 | 라디오·미래 편지·추억·전시 | src/components/FunPanel.tsx | PARTIAL 기기 저장; 계정별 서버/공개 철회/공식 음악 링크/도착 알림 | P2 |
| Q22 | 연령·신고·계정 삭제 | PROJECT_SPEC.md, TEST_REPORT.md | BLOCKED 성인 공간 잠금 유지; 실제 연령 확인/사진·DM 신고/삭제·보존·관리자 권한 전수 확인 | P0 |
| Q23 | 실기기·회귀 | TEST_REPORT.md | UNVERIFIED 실기기 및 최신 전체 회귀; verify.py 문구 드리프트 | P1 |
| Q24 | 확장·비용 | PHOTO_CHAT_SCALE_SPEC_V1.md, TEST_REPORT.md | UNVERIFIED 부하·비용·복구 시험; 10만 장기 목표일 뿐 | P1 |
| Q25 | 초기 무료·프리미엄 | GROWTH_MONETIZATION_V1.md | IMPLEMENTED 기획 정책, 판매/가격표 비활성 유지. 실제 무료 보존 회귀 | P1 |
## 출시 차단 게이트
G1 개인정보: Q04/05/07/09/11/22. 별도 계정 C, 로그아웃, 차단/퇴장/철회 후 재조회·재구독·직접 URL 차단. 이미 발급된 서명 URL은 만료까지 접근 가능할 수 있으므로 정책·만료·철회 설계 검증. 사진을 실제 개인 데이터로 테스트하지 않는다.
G2 핵심 체험: Q08/12/13/14; A/B 사진+문자 양방향, 20+1 동시 입장, 서버 트랜잭션/정원, 호실 중복 방지, 모바일 실제 카메라·입력.
G3 운영: 관리자 담당/신고 대응, 연령 확인 및 잠금, 삭제·백업·장애·비용, 개인정보 처리방침/약관/호스팅 조건 확인, 승인. P0 미해결 공개 베타 금지. P1은 핵심 기능 실패 시 베타 보류, 선택 기능은 실제 미구현 표시 및 위험 검토 후 제한적 공개 가능. P2는 정본에서 삭제하지 말고 계속 개선.
## 수용 기준 및 담당
피클: 수정 브랜치/커밋/실제 환경/시험 로그. 브리: 권한·실패·회귀 독립 검수. 로렌: 기획/표기/UX 대조 및 베타 운영. 사용자: 공개·비용·상업 운영 최종 승인. 각 행을 PASS/FAIL/BLOCKED/NOT_RUN과 실제 증거로 갱신. 이번 검수에서 실제 테스트·DB·배포 수정 없음.
