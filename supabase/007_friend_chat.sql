-- 딩동 친구 1:1 실시간 채팅(007)
-- 적용: Supabase SQL Editor에 통째로 붙여 넣어 한 번 실행한다. 여러 번 실행해도 안전하다(멱등).
-- 선행 조건: schema.sql → 003 → 004 → 005 → 006 적용 완료.
--
-- 정책
--   · 친구가 아닌 사람: 지금처럼 '수락제 쪽지'. 보낼 수 있는 첫 쪽지는 1통뿐이고,
--     상대가 수락해야 대화가 열린다.
--   · 친구(friendships.status = 'accepted'): 수락 절차 없이 바로 1:1 채팅방이 열린다.
--     대화는 기존 note_threads/note_messages를 mode = 'chat'으로 재사용한다(새 표 없이 RLS로 보호).
--   · anon·public 은 어떤 표도 읽거나 쓸 수 없다. RPC도 authenticated 만 실행한다.

-- 1. 대화 종류 열 ----------------------------------------------------------
alter table public.note_threads add column if not exists mode text not null default 'note';
alter table public.note_threads drop constraint if exists note_threads_mode_check;
alter table public.note_threads add constraint note_threads_mode_check check (mode in ('note', 'chat'));
create index if not exists note_threads_mode_idx on public.note_threads (mode, last_message_at desc);

-- 2. 대화 메시지에 사진(Storage 경로) 허용 ---------------------------------
alter table public.note_messages add column if not exists image_path text;
alter table public.note_messages add column if not exists image_thumb_path text;
alter table public.note_messages add column if not exists image_width integer;
alter table public.note_messages add column if not exists image_height integer;
alter table public.note_messages add column if not exists image_bytes integer;

alter table public.note_messages drop constraint if exists note_messages_body_check;
alter table public.note_messages add constraint note_messages_body_check check (
  (char_length(btrim(body)) between 1 and 500) or image_path is not null
);

create or replace function public.note_messages_photo_owner() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.image_path is not null then
    if new.image_path not like ((select auth.uid())::text || '/%') then
      raise exception 'photo_path_forbidden' using errcode = 'P0001';
    end if;
    if new.image_path !~ '^[0-9a-f-]{36}/[A-Za-z0-9._:-]{1,80}/[A-Za-z0-9._-]{1,80}\.jpg$' then
      raise exception 'photo_path_invalid' using errcode = 'P0001';
    end if;
    if new.image_thumb_path is not null and new.image_thumb_path not like ((select auth.uid())::text || '/%') then
      raise exception 'photo_path_forbidden' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists note_messages_photo_owner_trg on public.note_messages;
create trigger note_messages_photo_owner_trg before insert on public.note_messages
  for each row execute function public.note_messages_photo_owner();
revoke execute on function public.note_messages_photo_owner() from anon, authenticated, public;

-- 3. 쪽지/채팅 쓰기 규칙 ---------------------------------------------------
--    · 첫 쪽지(pending)는 1통만. 상대가 수락하면 그때부터 자유롭게.
--    · 친구 채팅(chat)은 두 사람이 여전히 친구일 때만.
--    · 같은 대화에서 1분 5건 제한은 기존 규칙을 그대로 둔다.
create or replace function public.note_messages_guard() returns trigger
language plpgsql set search_path = public as $$
declare t public.note_threads;
begin
  select * into t from public.note_threads where id = new.thread_id;
  if t.id is null then
    raise exception 'thread_not_found' using errcode = 'P0001';
  end if;
  if t.mode = 'chat' then
    if not public.are_friends(t.requester, t.addressee) then
      raise exception 'friends_only' using errcode = 'P0001';
    end if;
    if exists (select 1 from public.blocks b
               where (b.blocker_id = t.requester and b.blocked_id = t.addressee)
                  or (b.blocker_id = t.addressee and b.blocked_id = t.requester)) then
      raise exception 'blocked' using errcode = 'P0001';
    end if;
  elsif t.status = 'pending' then
    -- 수락 전에는 요청자가 보낸 첫 쪽지 1통까지
    if (select count(*) from public.note_messages m where m.thread_id = t.id) >= 1 then
      raise exception 'note_intro_limit' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists note_messages_guard_trg on public.note_messages;
create trigger note_messages_guard_trg before insert on public.note_messages
  for each row execute function public.note_messages_guard();
revoke execute on function public.note_messages_guard() from anon, authenticated, public;

-- 4. 대화방 열기 규칙 ------------------------------------------------------
--    친구 채팅은 클라이언트가 직접 만들지 않고 이 함수로만 연다.
--    (수락 전 쪽지가 있으면 그 대화를 그대로 채팅방으로 이어 준다.)
create or replace function public.open_friend_chat(peer uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare me uuid := (select auth.uid()); tid uuid;
begin
  if me is null then
    raise exception 'auth_required' using errcode = 'P0001';
  end if;
  if peer is null or peer = me then
    raise exception 'bad_peer' using errcode = 'P0001';
  end if;
  if not public.are_friends(me, peer) then
    raise exception 'friends_only' using errcode = 'P0001';
  end if;
  if exists (select 1 from public.blocks b
             where (b.blocker_id = me and b.blocked_id = peer)
                or (b.blocker_id = peer and b.blocked_id = me)) then
    raise exception 'blocked' using errcode = 'P0001';
  end if;
  select t.id into tid from public.note_threads t
   where least(t.requester, t.addressee) = least(me, peer)
     and greatest(t.requester, t.addressee) = greatest(me, peer)
     and t.status in ('pending', 'accepted')
   order by t.created_at desc
   limit 1;
  if tid is null then
    insert into public.note_threads (requester, addressee, status, mode, responded_at)
    values (me, peer, 'accepted', 'chat', now())
    returning id into tid;
  else
    update public.note_threads
       set status = 'accepted',
           mode = 'chat',
           responded_at = coalesce(responded_at, now())
     where id = tid and (status <> 'accepted' or mode <> 'chat');
  end if;
  return tid;
end $$;
revoke all on function public.open_friend_chat(uuid) from public, anon;
grant execute on function public.open_friend_chat(uuid) to authenticated;

-- 5. 표 접근 정책 ----------------------------------------------------------
--    첫 쪽지는 이제 '친구가 아닌 사람'도 보낼 수 있다(수락 전 1통).
drop policy if exists "note_threads_insert" on public.note_threads;
create policy "note_threads_insert" on public.note_threads for insert to authenticated
  with check (
    requester = (select auth.uid())
    and addressee <> requester
    and status = 'pending'
    and mode = 'note'
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = requester and b.blocked_id = addressee)
         or (b.blocker_id = addressee and b.blocked_id = requester)
    )
  );

-- 요청자는 자기 요청을 취소만 할 수 있고, 수락·거절은 받은 사람만 한다.
drop policy if exists "note_threads_update" on public.note_threads;
create policy "note_threads_update" on public.note_threads for update to authenticated
  using ((select auth.uid()) in (requester, addressee))
  with check ((select auth.uid()) in (requester, addressee));

create or replace function public.note_threads_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.mode = 'note' and new.status = 'pending' then
      if (select count(*) from public.note_threads t
          where t.requester = new.requester and t.status = 'pending'
            and t.created_at > now() - interval '1 hour') >= 5 then
        raise exception 'too_many_notes' using errcode = 'P0001';
      end if;
    end if;
    return new;
  end if;
  if new.requester <> old.requester or new.addressee <> old.addressee then
    raise exception 'thread_immutable' using errcode = 'P0001';
  end if;
  if old.mode = 'chat' and new.mode <> 'chat' then
    raise exception 'thread_immutable' using errcode = 'P0001';
  end if;
  if old.status = 'pending' and new.status in ('accepted', 'declined')
     and (select auth.uid()) <> old.addressee then
    raise exception 'only_addressee' using errcode = 'P0001';
  end if;
  if new.status = 'accepted' and new.mode = 'chat'
     and not public.are_friends(new.requester, new.addressee) then
    raise exception 'friends_only' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists note_threads_guard_trg on public.note_threads;
create trigger note_threads_guard_trg before insert or update on public.note_threads
  for each row execute function public.note_threads_guard();
revoke execute on function public.note_threads_guard() from anon, authenticated, public;

-- 메시지 쓰기 정책: 수락된 대화(쪽지·채팅)의 두 사람만. 채팅은 친구일 때만(트리거가 한 번 더 확인).
drop policy if exists "note_messages_insert" on public.note_messages;
create policy "note_messages_insert" on public.note_messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.note_threads t
      where t.id = note_messages.thread_id
        and (select auth.uid()) in (t.requester, t.addressee)
        and (
          t.status = 'accepted'
          or (t.status = 'pending' and (select auth.uid()) = t.requester and t.mode = 'note')
        )
    )
  );

-- 6. 실시간 발행 ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'note_messages'
  ) then
    alter publication supabase_realtime add table public.note_messages;
  end if;
end $$;

-- 7. 권한(RLS가 실제로 거른다) ---------------------------------------------
grant select, insert, update, delete on public.note_threads, public.note_messages to authenticated;

-- 8. 확인용
-- select tgname from pg_trigger where tgrelid = 'public.note_messages'::regclass;
-- select proname, proacl from pg_proc where proname in ('open_friend_chat','note_messages_guard','note_threads_guard');
