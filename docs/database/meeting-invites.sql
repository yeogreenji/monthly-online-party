create schema if not exists dingdong_private;
grant usage on schema dingdong_private to authenticated;
create table dingdong_private.meeting_invites (
  room_id uuid references public.meeting_rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (room_id, user_id)
);
alter table dingdong_private.meeting_invites enable row level security;

create function dingdong_private.list_meeting_invites()
returns table(id uuid, title text)
language sql stable security definer set search_path = ''
as $$
  select rooms.id, rooms.title
  from dingdong_private.meeting_invites invites
  join public.meeting_rooms rooms on rooms.id = invites.room_id
  where invites.user_id = auth.uid() and rooms.series_id is null
  order by rooms.title, rooms.id;
$$;

create function dingdong_private.join_invited_meeting(root_id uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare caller_id uuid := auth.uid();
begin
  if caller_id is null or not exists (
    select 1 from dingdong_private.meeting_invites
    where user_id = caller_id and room_id = root_id
    for share
  ) then
    raise exception 'Meeting invitation required' using errcode = '42501';
  end if;
  return public.assign_meeting_member(root_id, caller_id);
end;
$$;

create function public.list_meeting_invites()
returns table(id uuid, title text)
language sql stable set search_path = ''
as $$ select * from dingdong_private.list_meeting_invites(); $$;

create function public.join_invited_meeting(root_id uuid)
returns uuid
language sql set search_path = ''
as $$ select dingdong_private.join_invited_meeting(root_id); $$;

revoke all on function dingdong_private.list_meeting_invites(), dingdong_private.join_invited_meeting(uuid), public.list_meeting_invites(), public.join_invited_meeting(uuid) from public, anon, authenticated;
grant execute on function dingdong_private.list_meeting_invites(), dingdong_private.join_invited_meeting(uuid), public.list_meeting_invites(), public.join_invited_meeting(uuid) to authenticated;
