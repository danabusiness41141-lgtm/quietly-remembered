drop policy if exists "server only note reports" on public.qr_note_reports;
create policy "server only note reports"
  on public.qr_note_reports for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists "server only note reactions" on public.qr_note_reactions;
create policy "server only note reactions"
  on public.qr_note_reactions for all
  to anon, authenticated
  using (false)
  with check (false);
