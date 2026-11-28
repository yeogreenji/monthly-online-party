-- 딩동 안정성 개편(008): 서버 정원·방 멤버십, 사진 접근 제한, 답장·이모지 반응, 1:1 차단·해제 즉시 차단
-- 적용: Supabase SQL Editor에 통째로 붙여 넣어 한 번 실행한다. 여러 번 실행해도 안전하다(멱등).
-- 선행 조건: schema.sql → 003 → 004 → 005 → 006 → 007 적용 완료.
--
-- 이 파일이 바꾸는 것
--   1) 방 멤버십(room_members)을 서버가 관리한다. 클라이언트는 직접 쓸 수 없고 RPC로만 입장·하트비트·퇴장한다.
--      정원 판정과 다음 호실 자동 배정을 한 트랜잭션(advisory lock) 안에서 원자적으로 처리한다.
--   2) chat-photos Storage 읽기·쓰기를 '그 방에 들어온 적 있는 사람 / 그 1:1 대화 당사자'로 좁힌다.
--      지금까지는 로그인한 이용자 전체가 모든 방의 사진을 열 수 있었다(006의 임시 정책).
--   3) 메시지 답장(reply_to)과 이모지 반응(message_reactions)을 추가한다.
--   4) 친구 1:1 채팅은 '지금 친구이고 차단 관계가 없을 때'만 읽고 쓸 수 있다(차단·친구 해제 즉시 차단).
--
-- 원칙: service_role 키는 쓰지 않는다. 새로 만든 함수는 anon/authenticated/public 실행 권한을 회수하고,
--       꼭 필요한 역할에만 grant 한다(보안 어드바이저 경고 방지).

-- ════════════════════════════════════════════════════════════════════
-- 1. 방 멤버십 표 — 서버 정원 관리의 기준
-- ════════════════════════════════════════════════════════════════════
--   active = 지금 방에 있음. 마지막 하트비트(last_seen)가 2분을 넘기면 자리를 비운 것으로 본다.
--   행은 지우지 않는다. 한 번 들어온 방은 사진첩·기록 열람 근거로 남긴다(active=false).
create table if not exists public.room_members (
  topic_id text not null check (char_length(topic_id) between 1 and 80),
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  active boolean not null default true,
  primary key (topic_id, user_id)
);
create index if not exists room_members_live_idx on public.room_members (topic_id, last_seen desc) where active;
create index if not exists room_members_user_idx on public.room_members (user_id, joined_at desc);

alter table public.room_members enable row level security;

-- 클라이언트는 자기 멤버십 행만 읽는다. 인원수는 아래 room_live_count/room_counts 함수로 받는다.
drop policy if exists "room_members_read_own" on public.room_members;
create policy "room_members_read_own" on public.room_members for select to authenticated
  using (user_id = (select auth.uid()));

-- 쓰기 정책은 만들지 않는다(모든 변경은 security definer RPC). 기본 부여된 표 권한도 회수한다.
revoke all on public.room_members from anon, authenticated, public;
grant select on public.room_members to authenticated;

-- ── 1-1. 조회 도우미 ────────────────────────────────────────────────
-- 지금 방에 있는 사람 수(만료 정리는 하지 않고 세기만 한다).
create or replace function public.room_live_count(p_topic text) returns integer
language sql stable security definer set search_path = public as $$
  select count(*)::int from public.room_members
   where topic_id = p_topic and active and last_seen > now() - interval '2 minutes'
$$;

-- 여러 방의 인원수를 한 번에. { "topicId": 3, ... }
create or replace function public.room_counts(p_topics text[]) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(t.id, t.c), '{}'::jsonb)
    from (
      select x as id, public.room_live_count(x) as c
        from unnest(coalesce(p_topics, array[]::text[])) as x
       where x is not null
       limit 200
    ) t
$$;

-- 서버가 새 호실을 만들 때 id를 스스로 채울 수 있게 기본값을 둔다(003은 클라이언트가 id를 넣는 구조였다).
alter table public.topics alter column id set default gen_random_uuid();

-- 방 정원. 사용자 모임(topics)이면 그 모임의 정원, 아니면 기본 20명.
create or replace function public.room_capacity(p_topic text) returns integer
language sql stable security definer set search_path = public as $$
  select coalesce((select capacity from public.topics where id::text = p_topic), 20)
$$;

-- ── 1-2. 입장 (정원 판정 + 다음 호실 자동 배정) ──────────────────────
--   반환: { room_id, capacity, count, assigned, topic? }
--   · 자리가 있으면 p_topic 그대로. 정원이 차 있으면 같은 이름의 'N호실' 중 빈 방을 찾고,
--     없으면 새 호실을 만들어 그 방으로 배정한다(assigned=true, topic=새 모임 정보).
--   · 같은 사람이 동시에 두 번 눌러도 한 행만 남는다(primary key + on conflict).
--   · 정원 판정과 배정은 advisory lock으로 직렬화되어, 동시 입장 경합에서도 정원을 넘기지 않는다.
create or replace function public.join_room(p_topic text, p_space text default null, p_title text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := (select auth.uid());
  v_t public.topics;
  v_space text;
  v_cap int;
  v_live int;
  v_base text;
  v_target text;
  v_new_id uuid;
  v_max int;
  v_title text;
begin
  if me is null then
    raise exception 'auth_required' using errcode = '42501';
  end if;
  if p_topic is null or char_length(btrim(p_topic)) < 1 or char_length(p_topic) > 80 then
    raise exception 'bad_room' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtext('dd_join:' || p_topic));

  -- 이 방의 만료된 자리 정리
  update public.room_members set active = false
   where topic_id = p_topic and active and last_seen < now() - interval '2 minutes';

  select * into v_t from public.topics where id::text = p_topic;
  v_space := coalesce(v_t.space_id, p_space);
  v_cap := coalesce(v_t.capacity, 20);

  -- 이미 자리가 있는 사람은 자리만 갱신
  if exists (
    select 1 from public.room_members
     where topic_id = p_topic and user_id = me and active and last_seen > now() - interval '2 minutes'
  ) then
    update public.room_members set last_seen = now() where topic_id = p_topic and user_id = me;
    return jsonb_build_object(
      'room_id', p_topic, 'capacity', v_cap,
      'count', public.room_live_count(p_topic), 'assigned', false);
  end if;

  v_live := public.room_live_count(p_topic);
  if v_live < v_cap then
    insert into public.room_members (topic_id, user_id, joined_at, last_seen, active)
    values (p_topic, me, now(), now(), true)
    on conflict (topic_id, user_id) do update set last_seen = now(), active = true;
    return jsonb_build_object(
      'room_id', p_topic, 'capacity', v_cap,
      'count', v_live + 1, 'assigned', false);
  end if;

  -- ── 정원이 찼다: 다음 호실 ────────────────────────────────────────
  v_title := coalesce(v_t.title, p_title, '');
  v_base := btrim(regexp_replace(v_title, '\s*\d+호실$', ''));
  if v_base = '' then v_base := '모임'; end if;

  select t.id::text into v_target
    from public.topics t
   where v_space is not null
     and t.space_id = v_space
     and btrim(regexp_replace(t.title, '\s*\d+호실$', '')) = v_base
     and t.id::text <> p_topic
     and public.room_live_count(t.id::text) < t.capacity
   order by t.created_at
   limit 1;

  if v_target is null then
    if v_space is null then
      -- 서버에 없는 시연 방은 넘칠 호실을 만들 수 없다. 화면이 새 모임을 열도록 알린다.
      return jsonb_build_object(
        'room_id', p_topic, 'capacity', v_cap, 'count', v_live,
        'assigned', false, 'full', true);
    end if;

    perform pg_advisory_xact_lock(hashtext('dd_base:' || v_space || ':' || v_base));
    select coalesce(max((regexp_match(t.title, '(\d+)호실$'))[1]::int), 1) into v_max
      from public.topics t
     where t.space_id = v_space
       and btrim(regexp_replace(t.title, '\s*\d+호실$', '')) = v_base;

    insert into public.topics
      (id, space_id, creator_id, title, description, kind, work_title, scheduled_at, capacity, age_group, artist, fan_occasion)
    values
      (gen_random_uuid(), v_space, me, v_base || ' ' || greatest(2, coalesce(v_max, 1) + 1) || '호실',
       coalesce(v_t.description, ''), coalesce(v_t.kind, 'talk'), v_t.work_title, v_t.scheduled_at,
       coalesce(v_t.capacity, 20), coalesce(v_t.age_group, '성인 전체'), v_t.artist, v_t.fan_occasion)
    returning id into v_new_id;
    v_target := v_new_id::text;
  end if;

  insert into public.room_members (topic_id, user_id, joined_at, last_seen, active)
  values (v_target, me, now(), now(), true)
  on conflict (topic_id, user_id) do update set last_seen = now(), active = true;

  return jsonb_build_object(
    'room_id', v_target,
    'capacity', (select capacity from public.topics where id::text = v_target),
    'count', public.room_live_count(v_target),
    'assigned', v_target <> p_topic,
    'topic', (select to_jsonb(x) from (
      select id, space_id, creator_id, title, description, kind, work_title, scheduled_at,
             capacity, age_group, artist, fan_occasion
        from public.topics where id::text = v_target) x));
end $$;

-- ── 1-3. 하트비트 ────────────────────────────────────────────────────
--   45초마다 부른다. 내 자리를 갱신하고, 만료된 자리를 정리한 뒤, 요청한 방들의 인원을 돌려준다.
create or replace function public.heartbeat_room(p_topics text[]) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  me uuid := (select auth.uid());
  v_list text[] := coalesce(p_topics, array[]::text[]);
begin
  if me is null then raise exception 'auth_required' using errcode = '42501'; end if;
  if array_length(v_list, 1) is null or array_length(v_list, 1) > 100 then
    raise exception 'bad_room_list' using errcode = 'P0001';
  end if;

  update public.room_members set last_seen = now()
   where user_id = me and topic_id = any(v_list) and active;

  update public.room_members set active = false
   where topic_id = any(v_list) and active and last_seen < now() - interval '2 minutes';

  return jsonb_build_object(
    'rooms', public.room_counts(v_list),
    'mine', (select coalesce(jsonb_agg(topic_id), '[]'::jsonb) from public.room_members
              where user_id = me and topic_id = any(v_list) and active));
end $$;

-- ── 1-4. 퇴장 ────────────────────────────────────────────────────────
create or replace function public.leave_room(p_topic text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := (select auth.uid());
begin
  if me is null then raise exception 'auth_required' using errcode = '42501'; end if;
  update public.room_members set active = false, last_seen = now() - interval '1 day'
   where user_id = me and topic_id = p_topic;
  return jsonb_build_object('ok', true, 'count', public.room_live_count(p_topic));
end $$;

-- ── 1-5. 메시지 INSERT는 방 멤버만 ────────────────────────────────────
--   정원이 의미를 가지려면 '입장하지 않은 사람이 그 방에 쓰는 것'도 막아야 한다.
create or replace function public.messages_room_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if not exists (
    select 1 from public.room_members m
     where m.topic_id = new.topic_id and m.user_id = new.user_id and m.active
       and m.last_seen > now() - interval '2 minutes'
  ) then
    raise exception 'room_membership_required' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists messages_room_guard_trg on public.messages;
create trigger messages_room_guard_trg before insert on public.messages
  for each row execute function public.messages_room_guard();

-- ════════════════════════════════════════════════════════════════════
-- 2. 사진 경로 = 방 단위 고정, 접근은 그 방 사람만
-- ════════════════════════════════════════════════════════════════════
-- 경로 규칙: {올린사람 uid}/{방 id 또는 friend-{threadId}}/{임의 id}.jpg
-- 메시지의 image_path 두 번째 칸은 반드시 그 메시지의 방과 같아야 한다(다른 방 사진을 붙여 넣지 못하게).

-- ── 2-1. 메시지·답장 경로 검사(006의 본인 폴더 검사에 방 일치를 더한다) ─
create or replace function public.messages_photo_owner() returns trigger
language plpgsql set search_path = public as $$
declare parts text[];
begin
  if new.image_path is not null then
    if new.image_path not like ((select auth.uid())::text || '/%') then
      raise exception 'photo_path_forbidden' using errcode = 'P0001';
    end if;
    if new.image_path !~ '^[0-9a-f-]{36}/[A-Za-z0-9._:-]{1,80}/[A-Za-z0-9._-]{1,80}\.jpg$' then
      raise exception 'photo_path_invalid' using errcode = 'P0001';
    end if;
    parts := string_to_array(new.image_path, '/');
    if parts[2] is distinct from new.topic_id then
      raise exception 'photo_topic_mismatch' using errcode = 'P0001';
    end if;
    if new.image_thumb_path is not null then
      if new.image_thumb_path not like ((select auth.uid())::text || '/%') then
        raise exception 'photo_path_forbidden' using errcode = 'P0001';
      end if;
      parts := string_to_array(new.image_thumb_path, '/');
      if parts[2] is distinct from new.topic_id then
        raise exception 'photo_topic_mismatch' using errcode = 'P0001';
      end if;
    end if;
  end if;
  return new;
end $$;

-- ── 2-2. 답장은 같은 방 메시지에만 ───────────────────────────────────
create or replace function public.messages_reply_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.reply_to is not null then
    if not exists (select 1 from public.messages m where m.id = new.reply_to and m.topic_id = new.topic_id) then
      raise exception 'reply_not_in_room' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;

alter table public.messages add column if not exists reply_to uuid references public.messages (id) on delete set null;
create index if not exists messages_reply_idx on public.messages (reply_to) where reply_to is not null;

drop trigger if exists messages_reply_guard_trg on public.messages;
create trigger messages_reply_guard_trg before insert on public.messages
  for each row execute function public.messages_reply_guard();

-- ── 2-3. 사진 읽기·쓰기 판정 함수 ────────────────────────────────────
--   읽기: 내가 올린 사진 / 그 방에 들어온 적 있는 사람 / 그 1:1 대화의 당사자(지금 친구이고 차단 없음)
create or replace function public.can_read_chat_photo(p_name text) returns boolean
language plpgsql stable security definer set search_path = public, storage as $$
declare
  me uuid := (select auth.uid());
  parts text[];
  room text;
  th uuid;
begin
  if me is null or p_name is null then return false; end if;
  parts := storage.foldername(p_name);
  if parts is null or array_length(parts, 1) < 2 then return false; end if;
  if parts[1] = me::text then return true; end if;

  room := parts[2];
  if room like 'friend-%' then
    begin
      th := substring(room from 8)::uuid;
    exception when others then
      return false;
    end;
    return exists (
      select 1 from public.note_threads t
       where t.id = th
         and me in (t.requester, t.addressee)
         and (t.mode <> 'chat' or (
               public.are_friends(t.requester, t.addressee)
               and not exists (
                 select 1 from public.blocks b
                  where (b.blocker_id = t.requester and b.blocked_id = t.addressee)
                     or (b.blocker_id = t.addressee and b.blocked_id = t.requester)))));
  end if;

  return exists (select 1 from public.room_members m where m.topic_id = room and m.user_id = me);
end $$;

--   쓰기: 내 폴더 안 + (그 방에 지금 있거나 / 그 1:1 대화 당사자)
create or replace function public.can_upload_chat_photo(p_name text) returns boolean
language plpgsql stable security definer set search_path = public, storage as $$
declare
  me uuid := (select auth.uid());
  parts text[];
  room text;
  th uuid;
begin
  if me is null or p_name is null then return false; end if;
  parts := storage.foldername(p_name);
  if parts is null or array_length(parts, 1) < 2 then return false; end if;
  if parts[1] <> me::text then return false; end if;

  room := parts[2];
  if room like 'friend-%' then
    begin
      th := substring(room from 8)::uuid;
    exception when others then
      return false;
    end;
    return exists (
      select 1 from public.note_threads t
       where t.id = th and me in (t.requester, t.addressee)
         and t.status = 'accepted'
         and (t.mode <> 'chat' or (
               public.are_friends(t.requester, t.addressee)
               and not exists (
                 select 1 from public.blocks b
                  where (b.blocker_id = t.requester and b.blocked_id = t.addressee)
                     or (b.blocker_id = t.addressee and b.blocked_id = t.requester)))));
  end if;

  return exists (
    select 1 from public.room_members m
     where m.topic_id = room and m.user_id = me and m.active
       and m.last_seen > now() - interval '2 minutes');
end $$;

-- ── 2-4. Storage 정책 교체 ───────────────────────────────────────────
drop policy if exists "chat_photos_insert_own" on storage.objects;
create policy "chat_photos_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-photos' and public.can_upload_chat_photo(name));

drop policy if exists "chat_photos_read_authed" on storage.objects;
drop policy if exists "chat_photos_read_member" on storage.objects;
create policy "chat_photos_read_member" on storage.objects for select to authenticated
  using (bucket_id = 'chat-photos' and public.can_read_chat_photo(name));

drop policy if exists "chat_photos_delete_own" on storage.objects;
create policy "chat_photos_delete_own" on storage.objects for delete to authenticated
  using (
    bucket_id = 'chat-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ════════════════════════════════════════════════════════════════════
-- 3. 메시지 이모지 반응
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.message_reactions (
  message_id uuid not null references public.messages (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  emoji text not null check (emoji in ('👍', '❤️', '😂', '🎉', '😮', '😢')),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);
create index if not exists message_reactions_msg_idx on public.message_reactions (message_id);
alter table public.message_reactions enable row level security;

drop policy if exists "message_reactions_read" on public.message_reactions;
drop policy if exists "message_reactions_insert" on public.message_reactions;
drop policy if exists "message_reactions_delete" on public.message_reactions;

-- 같은 방 사람이면 반응을 읽는다(메시지 읽기 범위와 같다).
create policy "message_reactions_read" on public.message_reactions for select to authenticated
  using (
    exists (
      select 1 from public.messages m
       where m.id = message_reactions.message_id
         and (m.user_id = (select auth.uid())
              or exists (select 1 from public.room_members r
                          where r.topic_id = m.topic_id and r.user_id = (select auth.uid())))
    )
  );
create policy "message_reactions_insert" on public.message_reactions for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.messages m
       where m.id = message_reactions.message_id
         and exists (select 1 from public.room_members r
                      where r.topic_id = m.topic_id and r.user_id = (select auth.uid())))
  );
create policy "message_reactions_delete" on public.message_reactions for delete to authenticated
  using (user_id = (select auth.uid()));

-- ════════════════════════════════════════════════════════════════════
-- 4. 친구 1:1 — 차단·친구 해제 즉시 읽기·사진 접근 차단
-- ════════════════════════════════════════════════════════════════════
--   지금은 두 당사자면 언제든 읽을 수 있었다. 채팅(mode='chat')은 지금 친구이고
--   어느 쪽도 차단하지 않았을 때만 읽힌다(차단/해제하면 지난 대화도 즉시 닫힌다).

-- 친구 요청은 requester를 보내지 않아도 본인으로 기록되게 한다(다른 표와 같은 기본값).
alter table public.friendships alter column requester set default auth.uid();

-- 차단 여부는 '차단한 사람'의 시점이 아니라 서버 시점으로 본다.
--   blocks의 RLS는 본인이 건 차단만 보여 주므로, 정책·트리거 안에서 직접 조회하면
--   차단당한 쪽은 그 행을 못 보고 통과해 버린다(실서버 검증에서 발견).
create or replace function public.is_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks x
     where (x.blocker_id = a and x.blocked_id = b)
        or (x.blocker_id = b and x.blocked_id = a));
$$;
drop policy if exists "note_messages_read" on public.note_messages;
create policy "note_messages_read" on public.note_messages for select to authenticated
  using (
    exists (
      select 1 from public.note_threads t
       where t.id = note_messages.thread_id
         and (select auth.uid()) in (t.requester, t.addressee)
         and (t.mode <> 'chat' or (
               public.are_friends(t.requester, t.addressee)
               and not public.is_blocked(t.requester, t.addressee))))
  );

drop policy if exists "note_threads_read" on public.note_threads;
create policy "note_threads_read" on public.note_threads for select to authenticated
  using (
    (select auth.uid()) in (requester, addressee)
    and (mode <> 'chat' or (
          public.are_friends(requester, addressee)
          and not public.is_blocked(requester, addressee)))
  );

-- 메시지 쓰기 가드도 서버 시점으로 차단·친구 여부를 본다(007의 가드를 교체).
create or replace function public.note_messages_guard() returns trigger
language plpgsql security definer set search_path = public as $$
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
    if public.is_blocked(t.requester, t.addressee) then
      raise exception 'blocked' using errcode = 'P0001';
    end if;
  elsif t.status = 'pending' then
    if (select count(*) from public.note_messages m where m.thread_id = t.id) >= 1 then
      raise exception 'note_intro_limit' using errcode = 'P0001';
    end if;
  end if;
  return new;
end $$;

-- 1:1 메시지의 사진 경로도 그 대화 방(friend-{threadId})과 같아야 한다.
create or replace function public.note_messages_photo_owner() returns trigger
language plpgsql set search_path = public as $$
declare parts text[];
begin
  if new.image_path is not null then
    if new.image_path not like ((select auth.uid())::text || '/%') then
      raise exception 'photo_path_forbidden' using errcode = 'P0001';
    end if;
    if new.image_path !~ '^[0-9a-f-]{36}/[A-Za-z0-9._:-]{1,80}/[A-Za-z0-9._-]{1,80}\.jpg$' then
      raise exception 'photo_path_invalid' using errcode = 'P0001';
    end if;
    parts := string_to_array(new.image_path, '/');
    if parts[2] is distinct from ('friend-' || new.thread_id::text) then
      raise exception 'photo_thread_mismatch' using errcode = 'P0001';
    end if;
    if new.image_thumb_path is not null then
      if new.image_thumb_path not like ((select auth.uid())::text || '/%') then
        raise exception 'photo_path_forbidden' using errcode = 'P0001';
      end if;
      parts := string_to_array(new.image_thumb_path, '/');
      if parts[2] is distinct from ('friend-' || new.thread_id::text) then
        raise exception 'photo_thread_mismatch' using errcode = 'P0001';
      end if;
    end if;
  end if;
  return new;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- 5. 권한 — 새 함수는 anon/public 실행 금지
-- ════════════════════════════════════════════════════════════════════
revoke execute on function public.room_live_count(text) from anon, public;
revoke execute on function public.room_counts(text[]) from anon, public;
revoke execute on function public.room_capacity(text) from anon, public;
revoke execute on function public.join_room(text, text, text) from anon, public;
revoke execute on function public.heartbeat_room(text[]) from anon, public;
revoke execute on function public.leave_room(text) from anon, public;
revoke execute on function public.can_read_chat_photo(text) from anon, public;
revoke execute on function public.can_upload_chat_photo(text) from anon, public;
revoke execute on function public.is_blocked(uuid, uuid) from anon, public;
revoke execute on function public.messages_room_guard() from anon, authenticated, public;
revoke execute on function public.messages_reply_guard() from anon, authenticated, public;
revoke execute on function public.messages_photo_owner() from anon, authenticated, public;
revoke execute on function public.note_messages_photo_owner() from anon, authenticated, public;

grant execute on function public.room_live_count(text) to authenticated;
grant execute on function public.room_counts(text[]) to authenticated;
grant execute on function public.room_capacity(text) to authenticated;
grant execute on function public.join_room(text, text, text) to authenticated;
grant execute on function public.heartbeat_room(text[]) to authenticated;
grant execute on function public.leave_room(text) to authenticated;
grant execute on function public.can_read_chat_photo(text) to authenticated;
grant execute on function public.can_upload_chat_photo(text) to authenticated;
grant execute on function public.is_blocked(uuid, uuid) to authenticated;

-- 반응 표 권한(RLS가 실제로 거른다)
revoke all on public.message_reactions from anon, public;
grant select, insert, delete on public.message_reactions to authenticated;

-- 반응도 실시간으로 도착하도록 발행에 추가
 do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'message_reactions'
  ) then
    alter publication supabase_realtime add table public.message_reactions;
  end if;
end $$;

-- ════════════════════════════════════════════════════════════════════
-- 6. 확인용(실행 후 결과 탭에서 확인)
-- ════════════════════════════════════════════════════════════════════
-- select polname, polcmd from pg_policy where polrelid = 'storage.objects'::regclass and polname like 'chat_photos%';
-- select proname, has_function_privilege('anon', oid, 'execute') as anon_exec
--   from pg_proc where proname in ('join_room','heartbeat_room','leave_room','room_live_count','room_counts','can_read_chat_photo','can_upload_chat_photo');
-- select conname from pg_constraint where conrelid = 'public.message_reactions'::regclass;
