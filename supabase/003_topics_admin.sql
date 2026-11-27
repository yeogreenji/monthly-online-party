-- 딩동 3단계 추가 스키마: 사용자 모임 공유(topics) + 운영자 신고 확인(admins)
-- 적용: Supabase SQL Editor에 통째로 붙여 넣어 실행한다. 여러 번 실행해도 안전하다.
-- 선행 조건: schema.sql 적용(002_perf_hardening.sql은 선택).
-- 운영자 지정은 이 파일 맨 아래 주석의 SQL을 본인 계정으로 직접 실행한다(클라이언트에서는 지정 불가).

-- 1. 사용자 모임 ---------------------------------------------------------
create table if not exists public.topics (
  id uuid primary key,
  space_id text not null check (space_id ~ '^[a-z][a-z0-9-]{1,31}$'), -- 공간이 늘어도 SQL을 고치지 않도록 형식만 검사(앱의 공간 id와 일치)
  creator_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 60),
  description text not null default '' check (char_length(description) <= 300),
  kind text not null default 'talk' check (kind in ('talk','review','photo','play','share')),
  work_title text check (work_title is null or char_length(work_title) <= 80),
  scheduled_at text check (scheduled_at is null or char_length(scheduled_at) <= 32),
  capacity int not null default 20 check (capacity between 1 and 20),
  age_group text not null default '성인 전체' check (age_group in ('성인 전체','20대','30대','40대','50대 이상')),
  created_at timestamptz not null default now(),
  -- 제목·설명에도 연락처 교환 차단(messages와 같은 규칙)
  constraint topics_no_contact check (
    (title || ' ' || description || ' ' || coalesce(work_title, '')) !~ '(\+?82[-. ]?)?0?1[016789][-. ]?[0-9]{3,4}[-. ]?[0-9]{4}'
    and regexp_replace(title || description, '[ .\-_·,~]', '', 'g') !~ '01[016789][0-9]{7,8}'
    and (title || ' ' || description) !~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
    and (title || ' ' || description) !~* '(카톡|카카오톡|카카오 ?아이디|오픈 ?채팅|오카방|텔레그램|라인 ?아이디|인스타 ?(dm|디엠)|디엠 ?줘|연락처 ?(줘|알려|교환)|번호 ?(줘|알려|교환))'
    and (title || description) !~ '(.)\1{11,}'
  )
);
-- 이미 이전 버전을 실행한 프로젝트용: 공간 id 고정 목록 제약을 형식 검사로 교체
alter table public.topics drop constraint if exists topics_space_id_check;
alter table public.topics add constraint topics_space_id_check check (space_id ~ '^[a-z][a-z0-9-]{1,31}$');
create index if not exists topics_space_created_idx on public.topics (space_id, created_at desc);
create index if not exists topics_creator_idx on public.topics (creator_id);
alter table public.topics enable row level security;
drop policy if exists "topics_read" on public.topics;
drop policy if exists "topics_insert_own" on public.topics;
drop policy if exists "topics_delete_own" on public.topics;
create policy "topics_read" on public.topics for select to authenticated using (true);
create policy "topics_insert_own" on public.topics for insert to authenticated with check (creator_id = (select auth.uid()));
create policy "topics_delete_own" on public.topics for delete to authenticated using (creator_id = (select auth.uid()));
-- 새 모임이 생기면 열려 있는 화면에 바로 나타나도록 실시간 발행에 추가
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'topics') then
    alter publication supabase_realtime add table public.topics;
  end if;
end $$;

-- 모임 생성 속도 제한: 한 사람이 1분에 3개까지
create or replace function public.topics_rate_limit() returns trigger
language plpgsql set search_path = public as $$
begin
  if (select count(*) from public.topics where creator_id = new.creator_id and created_at > now() - interval '1 minute') >= 3 then
    raise exception 'too_many_topics';
  end if;
  return new;
end $$;
drop trigger if exists topics_rate_limit_trg on public.topics;
create trigger topics_rate_limit_trg before insert on public.topics for each row execute function public.topics_rate_limit();

-- 2. 운영자 ---------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
drop policy if exists "admins_read_self" on public.admins;
-- 본인이 운영자인지 확인하는 용도로만 본인 행을 읽을 수 있다. 쓰기 정책은 없다(대시보드·SQL Editor에서만 지정).
create policy "admins_read_self" on public.admins for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()))
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 신고 시점의 메시지 본문을 증거로 남긴다(메시지가 삭제돼도 남음)
alter table public.reports add column if not exists snapshot text;
alter table public.reports add column if not exists snapshot_nickname text;
create or replace function public.reports_snapshot() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select m.body, m.nickname into new.snapshot, new.snapshot_nickname from public.messages m where m.id = new.message_id;
  return new;
end $$;
drop trigger if exists reports_snapshot_trg on public.reports;
create trigger reports_snapshot_trg before insert on public.reports for each row execute function public.reports_snapshot();

-- 운영자: 신고 전체 조회, 처리 상태 변경(status 열만), 부적절한 메시지·모임 삭제
drop policy if exists "reports_read_admin" on public.reports;
drop policy if exists "reports_update_admin" on public.reports;
drop policy if exists "messages_delete_admin" on public.messages;
drop policy if exists "topics_delete_admin" on public.topics;
create policy "reports_read_admin" on public.reports for select to authenticated using (public.is_admin());
create policy "reports_update_admin" on public.reports for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "messages_delete_admin" on public.messages for delete to authenticated using (public.is_admin());
create policy "topics_delete_admin" on public.topics for delete to authenticated using (public.is_admin());
revoke update on public.reports from authenticated;
grant update (status) on public.reports to authenticated;

-- 운영자 지정(본인 계정 이메일로 한 번만 실행, 클라이언트에서는 불가):
-- insert into public.admins (user_id) select id from auth.users where email = '여기에_본인_이메일';
