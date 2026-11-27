-- 딩동 2단계 스키마(005): 계정별 미니룸·옷장·미니홈피 서버 저장 + 친구·방명록·편지·선물·동의 쪽지
-- 적용: Supabase SQL Editor에 통째로 붙여 넣어 실행한다. 여러 번 실행해도 안전하다(멱등).
-- 선행 조건: schema.sql → 003_topics_admin.sql → 004_fandom_owner_rooms.sql 적용 완료.
-- 원칙: 모든 표에 RLS를 켜고, 공개 범위(전체·친구·비공개)는 서버 정책으로 강제한다.
--       이 파일은 기존 행을 지우지 않는다(프로필·모임·메시지 보존).

-- 1. 프로필에 접속 상태 추가 -----------------------------------------------
--    online: 접속 중 · away: 자리비움 · dnd: 방해금지(알림 소리 끔)
alter table public.profiles add column if not exists status text not null default 'online';
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.profiles'::regclass and conname = 'profiles_status_check') then
    alter table public.profiles add constraint profiles_status_check check (status in ('online','away','dnd'));
  end if;
end $$;

-- 2. 계정별 공간(캐릭터 외형·옷장·미니룸·미니홈피) --------------------------
--    한 사람당 한 행. 기기와 무관하게 로그인하면 같은 방·같은 옷이 열린다.
create table if not exists public.user_spaces (
  user_id uuid primary key references auth.users (id) on delete cascade,
  look jsonb not null default '{}'::jsonb,       -- 캐릭터 외형(털색·의상·모자·소품…)
  outfits jsonb not null default '[]'::jsonb,    -- 내가 저장한 코디 목록(최대 12)
  home jsonb not null default '{}'::jsonb,       -- 미니룸 가구 배치·벽지·바닥
  minihome jsonb not null default '{}'::jsonb,   -- 홈피 제목·기분·소개·태그·추천곡·한마디·테마
  visibility text not null default 'private' check (visibility in ('private','friends','public')),
  updated_at timestamptz not null default now(),
  -- 저장 용량 상한: 가구 18개·코디 12개를 넣어도 넘지 않는 크기
  constraint user_spaces_size check (
    pg_column_size(look) <= 4096 and pg_column_size(outfits) <= 16384
    and pg_column_size(home) <= 24576 and pg_column_size(minihome) <= 8192
  )
);
alter table public.user_spaces enable row level security;
drop policy if exists "user_spaces_read" on public.user_spaces;
drop policy if exists "user_spaces_insert_own" on public.user_spaces;
drop policy if exists "user_spaces_update_own" on public.user_spaces;

-- 친구 여부를 묻는 함수는 아래 3번에서 만들지만, 정책 안에서 쓰려면 먼저 정의가 필요하다.
-- (함수 정의는 3번 표 생성 뒤에 두고, 정책은 그 다음에 만든다.)

-- 3. 친구 ------------------------------------------------------------------
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null default auth.uid() references auth.users (id) on delete cascade,
  addressee uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester <> addressee)
);
-- 두 사람 사이에는 한 행만: 순서와 무관하게 유일하다(요청·거절 뒤 다시 신청하면 그 행을 갱신).
create unique index if not exists friendships_pair_idx
  on public.friendships (least(requester, addressee), greatest(requester, addressee));
create index if not exists friendships_addressee_idx on public.friendships (addressee, status);
create index if not exists friendships_requester_idx on public.friendships (requester, status);
alter table public.friendships enable row level security;
drop policy if exists "friendships_read" on public.friendships;
drop policy if exists "friendships_insert_own" on public.friendships;
drop policy if exists "friendships_update" on public.friendships;
drop policy if exists "friendships_delete" on public.friendships;
create policy "friendships_read" on public.friendships for select to authenticated
  using ((select auth.uid()) in (requester, addressee));
create policy "friendships_insert_own" on public.friendships for insert to authenticated
  with check (requester = (select auth.uid()));
create policy "friendships_update" on public.friendships for update to authenticated
  using ((select auth.uid()) in (requester, addressee))
  with check ((select auth.uid()) in (requester, addressee));
create policy "friendships_delete" on public.friendships for delete to authenticated
  using ((select auth.uid()) in (requester, addressee));

create or replace function public.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select a = b or exists (
    select 1 from public.friendships f
    where f.status = 'accepted'
      and ((f.requester = a and f.addressee = b) or (f.requester = b and f.addressee = a))
  )
$$;
revoke all on function public.are_friends(uuid, uuid) from public;
grant execute on function public.are_friends(uuid, uuid) to authenticated;

-- 친구 요청 도배 방지: 한 사람이 1시간에 20건까지
create or replace function public.friendships_rate_limit() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status = 'pending' and (
    select count(*) from public.friendships
    where requester = new.requester and created_at > now() - interval '1 hour'
  ) >= 20 then
    raise exception 'too_many_friend_requests' using errcode = 'P0001';
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists friendships_rate_limit_trg on public.friendships;
create trigger friendships_rate_limit_trg before insert or update on public.friendships
  for each row execute function public.friendships_rate_limit();

-- 3-1. 공간 공개 범위 정책 (친구 함수 정의 뒤에 만든다) ---------------------
--   나: 항상 / 전체 공개: 로그인 이용자 / 친구 공개: 수락된 친구 / 비공개: 나만
create policy "user_spaces_read" on public.user_spaces for select to authenticated
  using (
    user_id = (select auth.uid())
    or visibility = 'public'
    or (visibility = 'friends' and public.are_friends(user_id, (select auth.uid())))
  );
create policy "user_spaces_insert_own" on public.user_spaces for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "user_spaces_update_own" on public.user_spaces for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- 4. 방명록 ----------------------------------------------------------------
create table if not exists public.guestbook (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 300),
  created_at timestamptz not null default now()
);
create index if not exists guestbook_owner_idx on public.guestbook (owner_id, created_at desc);
alter table public.guestbook enable row level security;
drop policy if exists "guestbook_read" on public.guestbook;
drop policy if exists "guestbook_insert" on public.guestbook;
drop policy if exists "guestbook_delete" on public.guestbook;
create policy "guestbook_read" on public.guestbook for select to authenticated
  using (
    owner_id = (select auth.uid()) or author_id = (select auth.uid())
    or exists (
      select 1 from public.user_spaces s
      where s.user_id = guestbook.owner_id
        and (s.visibility = 'public' or (s.visibility = 'friends' and public.are_friends(s.user_id, (select auth.uid()))))
    )
  );
create policy "guestbook_insert" on public.guestbook for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and owner_id <> (select auth.uid())
    and public.are_friends(owner_id, (select auth.uid()))
    and not exists (select 1 from public.blocks b where b.blocker_id = owner_id and b.blocked_id = (select auth.uid()))
  );
create policy "guestbook_delete" on public.guestbook for delete to authenticated
  using (owner_id = (select auth.uid()) or author_id = (select auth.uid()));

-- 방명록 도배 방지: 같은 사람 집에 1시간 5건, 500자 넘는 글은 위 check가 막는다.
create or replace function public.guestbook_rate_limit() returns trigger
language plpgsql set search_path = public as $$
begin
  if (select count(*) from public.guestbook
      where author_id = new.author_id and owner_id = new.owner_id
        and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'too_many_guestbook' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists guestbook_rate_limit_trg on public.guestbook;
create trigger guestbook_rate_limit_trg before insert on public.guestbook
  for each row execute function public.guestbook_rate_limit();

-- 5. 우편함: 편지·무료 선물·모임 초대 ---------------------------------------
create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('letter','gift','invite')),
  gift text check (gift is null or char_length(gift) <= 20),
  body text check (body is null or char_length(body) <= 500),
  meta jsonb not null default '{}'::jsonb,   -- 초대: {topicId, title, space} / 선물: {giftKind}
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id),
  check (kind <> 'gift' or gift is not null)
);
create index if not exists letters_recipient_idx on public.letters (recipient_id, created_at desc);
create index if not exists letters_sender_idx on public.letters (sender_id, created_at desc);
alter table public.letters enable row level security;
drop policy if exists "letters_read" on public.letters;
drop policy if exists "letters_insert" on public.letters;
drop policy if exists "letters_update_recipient" on public.letters;
drop policy if exists "letters_delete" on public.letters;
create policy "letters_read" on public.letters for select to authenticated
  using (recipient_id = (select auth.uid()) or sender_id = (select auth.uid()));
create policy "letters_insert" on public.letters for insert to authenticated
  with check (sender_id = (select auth.uid()));
create policy "letters_update_recipient" on public.letters for update to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));
create policy "letters_delete" on public.letters for delete to authenticated
  using (recipient_id = (select auth.uid()) or sender_id = (select auth.uid()));

-- 편지·선물은 수락된 친구에게만. 초대는 같은 모임에 있었던 사람에게도 허용하기 위해 친구로 한정한다.
-- 선물 반복 발송 제한: 같은 사람에게 1시간 5개, 하루 20개.
create or replace function public.letters_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.are_friends(new.sender_id, new.recipient_id) then
    raise exception 'friends_only' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.blocks b
             where (b.blocker_id = new.recipient_id and b.blocked_id = new.sender_id)
                or (b.blocker_id = new.sender_id and b.blocked_id = new.recipient_id)) then
    raise exception 'blocked' using errcode = 'P0001';
  end if;
  if new.kind = 'gift' then
    if (select count(*) from public.letters
        where sender_id = new.sender_id and recipient_id = new.recipient_id and kind = 'gift'
          and created_at > now() - interval '1 hour') >= 5 then
      raise exception 'too_many_gifts' using errcode = 'P0001';
    end if;
    if (select count(*) from public.letters
        where sender_id = new.sender_id and recipient_id = new.recipient_id and kind = 'gift'
          and created_at > now() - interval '1 day') >= 20 then
      raise exception 'too_many_gifts' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists letters_guard_trg on public.letters;
create trigger letters_guard_trg before insert on public.letters
  for each row execute function public.letters_guard();

-- 6. 상호 동의 1:1 쪽지 -----------------------------------------------------
--    requester는 기본값 auth.uid(): 클라이언트가 requester를 보내지 않아도 본인으로 기록된다.
alter table if exists public.note_threads alter column requester set default auth.uid();

create table if not exists public.note_threads (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null default auth.uid() references auth.users (id) on delete cascade,
  addressee uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','closed')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  last_message_at timestamptz,
  check (requester <> addressee)
);
-- 같은 두 사람 사이에 진행 중인 쪽지는 하나만
create unique index if not exists note_threads_open_idx
  on public.note_threads (least(requester, addressee), greatest(requester, addressee))
  where status in ('pending','accepted');
create index if not exists note_threads_addressee_idx on public.note_threads (addressee, status);
alter table public.note_threads enable row level security;
drop policy if exists "note_threads_read" on public.note_threads;
drop policy if exists "note_threads_insert" on public.note_threads;
drop policy if exists "note_threads_update" on public.note_threads;
drop policy if exists "note_threads_delete" on public.note_threads;
create policy "note_threads_read" on public.note_threads for select to authenticated
  using ((select auth.uid()) in (requester, addressee));
create policy "note_threads_insert" on public.note_threads for insert to authenticated
  with check (requester = (select auth.uid()) and public.are_friends(requester, addressee));
create policy "note_threads_update" on public.note_threads for update to authenticated
  using ((select auth.uid()) in (requester, addressee))
  with check ((select auth.uid()) in (requester, addressee));
create policy "note_threads_delete" on public.note_threads for delete to authenticated
  using ((select auth.uid()) in (requester, addressee));

create table if not exists public.note_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.note_threads (id) on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists note_messages_thread_idx on public.note_messages (thread_id, created_at);
alter table public.note_messages enable row level security;
drop policy if exists "note_messages_read" on public.note_messages;
drop policy if exists "note_messages_insert" on public.note_messages;
create policy "note_messages_read" on public.note_messages for select to authenticated
  using (exists (
    select 1 from public.note_threads t
    where t.id = note_messages.thread_id and (select auth.uid()) in (t.requester, t.addressee)
  ));
-- 수락된 대화에서만, 두 사람만 쓸 수 있다('동의 기반 1:1 쪽지').
-- 첫 쪽지는 요청과 함께(pending, requester) 쓸 수 있고, 그 뒤 대화는 수락(accepted) 후 두 사람만 쓴다.
create policy "note_messages_insert" on public.note_messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.note_threads t
      where t.id = note_messages.thread_id
        and (select auth.uid()) in (t.requester, t.addressee)
        and (t.status = 'accepted' or (t.status = 'pending' and (select auth.uid()) = t.requester))
    )
  );

-- 쪽지 도배 방지: 한 대화에서 1분 5건
create or replace function public.note_messages_rate_limit() returns trigger
language plpgsql set search_path = public as $$
begin
  if (select count(*) from public.note_messages
      where sender_id = new.sender_id and thread_id = new.thread_id
        and created_at > now() - interval '1 minute') >= 5 then
    raise exception 'too_many_notes' using errcode = 'P0001';
  end if;
  update public.note_threads set last_message_at = now() where id = new.thread_id;
  return new;
end $$;
drop trigger if exists note_messages_rate_limit_trg on public.note_messages;
create trigger note_messages_rate_limit_trg before insert on public.note_messages
  for each row execute function public.note_messages_rate_limit();

-- 7. 실시간 구독 ------------------------------------------------------------
--    새 친구 요청·쪽지·선물이 열려 있는 화면에 바로 도착하도록 발행에 추가한다.
do $$
declare t text;
begin
  foreach t in array array['friendships','guestbook','letters','note_threads','note_messages'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- 8. 권한(RLS가 실제로 거른다) ---------------------------------------------
grant select, insert, update, delete on public.user_spaces, public.friendships, public.guestbook,
  public.letters, public.note_threads, public.note_messages to authenticated;

-- 9. 확인용(실행 후 눈으로 검사):
-- select tablename, policyname from pg_policies where schemaname='public' order by tablename;
-- select count(*) from public.user_spaces;
