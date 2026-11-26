-- 딩동 스키마 보정(002): 001(schema.sql)을 이미 적용한 프로젝트에서 SQL Editor로 한 번 실행한다.
-- 내용: 정책의 auth.uid()를 서브쿼리로 감싸 행마다 재평가되지 않게 하고, 외래키 인덱스를 추가하고, 트리거 함수의 search_path를 고정한다.
-- 여러 번 실행해도 안전하다(정책은 지우고 다시 만든다).

drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "messages_insert_own" on public.messages;
drop policy if exists "messages_delete_own" on public.messages;
create policy "messages_insert_own" on public.messages for insert to authenticated with check (user_id = (select auth.uid()));
create policy "messages_delete_own" on public.messages for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "reports_insert_own" on public.reports;
drop policy if exists "reports_read_own" on public.reports;
create policy "reports_insert_own" on public.reports for insert to authenticated with check (reporter_id = (select auth.uid()));
create policy "reports_read_own" on public.reports for select to authenticated using (reporter_id = (select auth.uid()));

drop policy if exists "blocks_own" on public.blocks;
create policy "blocks_own" on public.blocks for all to authenticated using (blocker_id = (select auth.uid())) with check (blocker_id = (select auth.uid()));

create index if not exists messages_user_idx on public.messages (user_id);
create index if not exists reports_reporter_idx on public.reports (reporter_id);
create index if not exists reports_message_idx on public.reports (message_id);
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

alter function public.messages_rate_limit() set search_path = public;
