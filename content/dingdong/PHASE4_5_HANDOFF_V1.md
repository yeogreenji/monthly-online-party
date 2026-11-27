# 로렌 7개 후속 기획 인계 v1.0
2026-11-27 | 기획 작업 7건 저장 완료, 실제 앱 구현/테스트 미실행.
기준 main 750b0fa4431bd82579d328957cada556d639aba4 (기존 콘텐츠 마스터 PR #15 병합 확인).
기존 DINGDONG_CONTENT_MASTER_V1.md 및 두 JSON을 보존한다. 이 문서는 추가 상세화이며 신규 수치·제안은 사용자 검토 후 확정. 피클은 실제 구현, 브리는 검수. 비용 및 공개 승인 조건 유지.
1. [01-social-design.md](phase4-5/01-social-design.md)
2. [02-resident-dialogue.json](phase4-5/02-resident-dialogue.json)
3. [03-asset-catalog.json](phase4-5/03-asset-catalog.json)
4. [04-party-operations.json](phase4-5/04-party-operations.json)
5. [05-onboarding-retention.md](phase4-5/05-onboarding-retention.md)
6. [06-brand-partnership.md](phase4-5/06-brand-partnership.md)
7. [07-launch-test-plan.md](phase4-5/07-launch-test-plan.md)
검증: 7개 파일 다시 읽기, JSON 3개 파싱, 16명 주민 ID 기존 마스터 일치, 96개 주제/256개 대사 슬롯, 8테마 128항목(중복 가능), 365개 행사 ID·제목·공간 기존 달력과 전부 일치, 테스트 시나리오 56개(전부 미실행). NPC 대사 중 공통 문구 및 파티 운영 템플릿 재사용. 실제 자산 생성/서버 연동/배포/법률·상업 이용 조건 검증은 하지 않았다.
피클 인계 순서: 기존 3단계 서버 안정화 → 01 소셜·권한 → 03 카탈로그/02 NPC/04 이벤트 기능별 적용 → 05 첫방문/재방문 → 07 출시 검증 → 06 협찬은 베타 검증 및 승인 후. 승인 마스터 8개 신규 재미 기능은 삭제하지 않으며 별도 구현 상태 관리.
