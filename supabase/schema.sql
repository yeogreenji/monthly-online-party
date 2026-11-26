-- 딩동 3단계 서버 스키마 (Supabase / Postgres)
-- 적용: Supabase 대시보드 → SQL Editor에 통째로 붙여 넣어 한 번 실행한다.
-- 원칙: 모든 테이블에 RLS를 켜고, 클라이언트(anon 키)는 정책이 허용한 것만 할 수 있다.
-- 서버 측 검사는 우회가 불가능하므로 클라이언트 필터(src/lib/safety.ts)와 같은 규칙을 한 번 더 건다.

-- 1. 프로필 ---------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null unique check (char_length(nickname) between 2 and 12),
  age_band text not null default '비공개' check (age_band in ('20대','30대','40대','50대+','비공개')),
  created_at timestamptz not null default now(),
  -- 연락처·운영진 사칭 닉네임 차단
  constraint nickname_rules check (
    nickname !~ '01[016789][-. ]?[0-9]{3,4}[-. ]?[0-9]{4}'
    and nickname !~* '^(운영자|관리자|딩동 ?운영|admin)'
    and nickname !~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
  )
);
alter table public.profiles enable row level security;
create policy "profiles_read" on public.profiles for select to authenticated using (true);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- 2. 메시지 ---------------------------------------------------------------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  topic_id text not null check (char_length(topic_id) between 1 and 80),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nickname text not null,
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  place_name text check (place_name is null or char_length(place_name) <= 100),
  place_url text check (place_url is null or place_url ~* '^https?://'),
  spoiler boolean not null default false,
  created_at timestamptz not null default now(),
  -- 서버 측 연락처 교환 차단: 전화번호, 이메일, 외부 연락 요청, 글자 반복
  constraint no_contact check (
    body !~ '(\+?82[-. ]?)?0?1[016789][-. ]?[0-9]{3,4}[-. ]?[0-9]{4}'
    and regexp_replace(body, '[ .\-_·,~]', '', 'g') !~ '01[016789][0-9]{7,8}'
    and body !~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'
    and body !~* '(카톡|카카오톡|카카오 ?아이디|오픈 ?채팅|오카방|텔레그램|라인 ?아이디|인스타 ?(dm|디엠)|디엠 ?줘|연락처 ?(줘|알려|교환)|번호 ?(줘|알려|교환))'
    and body !~ '(.)\1{11,}'
  )
);
create index if not exists messages_topic_created_idx on public.messages (topic_id, created_at desc);
create index if not exists messages_user_idx on public.messages (user_id);
alter table public.messages enable row level security;
create policy "messages_read" on public.messages for select to authenticated using (true);
create policy "messages_insert_own" on public.messages for insert to authenticated with check (user_id = (select auth.uid()));
create policy "messages_delete_own" on public.messages for delete to authenticated using (user_id = (select auth.uid()));

-- 도배 방지: 같은 사용자의 연속 전송은 1초 간격 이상
create or replace function public.messages_rate_limit() returns trigger language plpgsql set search_path = public as $$
begin
  if exists (
    select 1 from public.messages
    where user_id = new.user_id and created_at > now() - interval '1 second'
  ) then
    raise exception 'too_many_messages' using errcode = 'P0001';
  end if;
  -- 닉네임은 항상 프로필 값으로 덮어써서 사칭을 막는다
  select nickname into new.nickname from public.profiles where id = new.user_id;
  if new.nickname is null then
    raise exception 'profile_required' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists messages_rate_limit_trg on public.messages;
create trigger messages_rate_limit_trg before insert on public.messages
  for each row execute function public.messages_rate_limit();

-- 실시간 구독 대상 (RLS select 정책을 통과한 행만 전달된다)
alter publication supabase_realtime add table public.messages;

-- 3. 신고·차단 --------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages (id) on delete set null,
  reporter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  reason text not null check (reason in ('contact','abuse','ad','privacy','other')),
  note text check (note is null or char_length(note) <= 300),
  status text not null default 'open' check (status in ('open','actioned','dismissed')),
  created_at timestamptz not null default now()
);
create index if not exists reports_reporter_idx on public.reports (reporter_id);
create index if not exists reports_message_idx on public.reports (message_id);
alter table public.reports enable row level security;
create policy "reports_insert_own" on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "reports_read_own" on public.reports for select to authenticated using (reporter_id = (select auth.uid()));
-- 운영자 조회·처리는 service_role 키(서버 전용)나 대시보드에서만 한다. 클라이언트에는 열지 않는다.

create table if not exists public.blocks (
  blocker_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);
alter table public.blocks enable row level security;
create policy "blocks_own" on public.blocks for all to authenticated using (blocker_id = (select auth.uid())) with check (blocker_id = (select auth.uid()));

-- 4. 탈퇴 시 삭제 ------------------------------------------------------------
-- auth.users 행이 삭제되면 on delete cascade로 프로필·메시지·신고·차단이 함께 삭제된다.
