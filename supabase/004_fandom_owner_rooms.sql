-- 딩동 1단계 보완 스키마(004): 덕질 존 허용 + 아티스트 입력 + 모임 개설자 수정
-- 적용: Supabase SQL Editor에 통째로 붙여 넣어 실행한다. 여러 번 실행해도 안전하다(멱등).
-- 선행 조건: schema.sql → 002_perf_hardening.sql → 003_topics_admin.sql 적용 완료.
-- 이 파일은 데이터를 지우지 않는다. 기존 admins·topics 행은 그대로 보존된다.

-- 1. 공간 목록에 덕질 존(fandom) 추가 -------------------------------------
-- 003(브리 수정본)은 공간 id를 형식(^[a-z][a-z0-9-]{1,31}$)으로 검사한다. 새 공간이 늘어도 SQL을 고치지 않기 위함이다.
-- 이 마이그레이션은 예전의 고정 목록 제약이 남아 있는 프로젝트도 같은 형식 검사로 맞춘다.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.topics'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%space_id%'
  loop
    execute format('alter table public.topics drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.topics
  add constraint topics_space_id_check check (space_id ~ '^[a-z][a-z0-9-]{1,31}$') not valid;
alter table public.topics validate constraint topics_space_id_check;

-- 2. 덕질 존 전용 입력: 아티스트 이름 · 테마 --------------------------------
alter table public.topics add column if not exists artist text;
alter table public.topics add column if not exists fan_occasion text;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.topics'::regclass and conname = 'topics_artist_len') then
    alter table public.topics add constraint topics_artist_len check (artist is null or char_length(btrim(artist)) between 1 and 40);
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.topics'::regclass and conname = 'topics_fan_occasion_len') then
    alter table public.topics add constraint topics_fan_occasion_len check (fan_occasion is null or char_length(fan_occasion) <= 20);
  end if;
end $$;

-- 제목·설명과 같은 연락처 교환 차단 규칙을 아티스트 이름에도 건다.
alter table public.topics drop constraint if exists topics_no_contact;
alter table public.topics
  add constraint topics_no_contact check (
    (title || ' ' || description || ' ' || coalesce(work_title, '') || ' ' || coalesce(artist, '')) !~ '(\+?82[-. ]?)?0?1[016789][-. ]?[0-9]{3,4}[-. ]?[0-9]{4}'
    and regexp_replace(title || description || coalesce(artist, ''), '[ .\-_·,~]', '', 'g') !~ '01[016789][0-9]{7,8}'
    and (title || ' ' || description || ' ' || coalesce(artist, '')) !~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
    and (title || ' ' || description || ' ' || coalesce(artist, '')) !~* '(카톡|카카오톡|카카오 ?아이디|오픈 ?채팅|오카방|텔레그램|라인 ?아이디|인스타 ?(dm|디엠)|디엠 ?줘|연락처 ?(줘|알려|교환)|번호 ?(줘|알려|교환))'
    and (title || ' ' || description) !~ '(.)\1{11,}'
  );

-- 3. 개설자 본인 수정 정책 -------------------------------------------------
-- 삭제(topics_delete_own)·운영자 삭제(topics_delete_admin)는 003에서 이미 만들었다.
drop policy if exists "topics_update_own" on public.topics;
create policy "topics_update_own" on public.topics
  for update to authenticated
  using (creator_id = (select auth.uid()))
  with check (creator_id = (select auth.uid()));

-- 4. 확인용(실행 후 눈으로 검사):
-- select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid='public.topics'::regclass and contype='c';
-- select polname from pg_policy where polrelid='public.topics'::regclass;
