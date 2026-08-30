alter table public.qr_notes
  drop constraint if exists qr_notes_paper_color_check;

alter table public.qr_notes
  add constraint qr_notes_paper_color_check
  check (
    paper_color in ('parchment', 'sage', 'blue', 'rose', 'lilac', 'butter', 'terracotta')
    or paper_color ~ '^#[0-9A-Fa-f]{6}$'
  );
