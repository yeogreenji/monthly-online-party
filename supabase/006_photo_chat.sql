-- 딩동 3단계 사진 채팅(006): private Storage 버킷 + 메시지 사진 열 + 소유자 정책
-- 적용: Supabase SQL Editor에 통째로 붙여 넣어 한 번 실행한다. 여러 번 실행해도 안전하다(멱등).
-- 선행 조건: schema.sql → 003 → 004 → 005 적용 완료.
-- 원칙(PHOTO_CHAT_SCALE_SPEC_V1): 사진 본문을 DB·websocket에 base64로 싣지 않는다.
--   Storage 객체 경로와 크기만 messages에 남기고, 화면에는 짧은 signed URL로 보여 준다.
--   service_role 키는 어디에도 쓰지 않는다.

-- 1. 메시지에 사진 메타데이터 열 추가 -------------------------------------
alter table public.messages add column if not exists image_path text;
alter table public.messages add column if not exists image_thumb_path text;
alter table public.messages add column if not exists image_width integer;
alter table public.messages add column if not exists image_height integer;
alter table public.messages add column if not exists image_bytes integer;

create index if not exists messages_image_idx on public.messages (topic_id, created_at desc) where image_path is not null;

-- 2. 사진만 보내는 메시지 허용 --------------------------------------------
--    기존 규칙: 본문 1~1000자. 사진이 있으면 본문이 비어도 된다.
alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages add constraint messages_body_check check (
  (char_length(btrim(body)) between 1 and 1000) or image_path is not null
);

-- 3. 사진 경로는 반드시 본인 폴더(auth.uid()/…) 안이어야 한다 --------------
create or replace function public.messages_photo_owner() returns trigger language plpgsql set search_path = public as $$
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
drop trigger if exists messages_photo_owner_trg on public.messages;
create trigger messages_photo_owner_trg before insert on public.messages
  for each row execute function public.messages_photo_owner();
-- 트리거 함수는 /rest/v1/rpc로 직접 호출될 이유가 없다. anon·authenticated·public 실행 권한을 회수한다.
revoke execute on function public.messages_photo_owner() from anon, authenticated, public;

-- 4. private 버킷 ---------------------------------------------------------
--    장당 1MB, JPEG·PNG·WebP만. 공개 버킷이 아니다(직접 URL 공유 불가, signed URL만).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-photos', 'chat-photos', false, 1048576, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 5. Storage 접근 정책 ----------------------------------------------------
--    올리기·지우기: 본인 폴더만. 읽기: 로그인한 이용자(채팅 읽기 범위와 동일).
--    ※ 메시지 select 정책이 'authenticated 전체'이므로 사진 읽기 범위도 같게 맞춘다.
--      방 단위로 더 좁히려면 방 멤버십 표가 먼저 필요하다(후속 작업).
drop policy if exists "chat_photos_insert_own" on storage.objects;
create policy "chat_photos_insert_own" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "chat_photos_read_authed" on storage.objects;
create policy "chat_photos_read_authed" on storage.objects for select to authenticated
  using (bucket_id = 'chat-photos');

drop policy if exists "chat_photos_delete_own" on storage.objects;
create policy "chat_photos_delete_own" on storage.objects for delete to authenticated
  using (
    bucket_id = 'chat-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- 6. 확인용(실행 후 결과 탭에서 확인) -------------------------------------
-- select column_name from information_schema.columns
--   where table_schema='public' and table_name='messages' and column_name like 'image%';
-- select id, public, file_size_limit, allowed_mime_types from storage.buckets where id='chat-photos';
