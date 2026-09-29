begin;

grant update (topic)
  on table public.citizen_reports to authenticated;

-- Keep submission validation strict while allowing administrators to correct
-- the category of historical rows that may predate the photo requirement.
create or replace function public.validate_citizen_report_submission() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.topic := case new.topic
    when 'Basura o residuos' then 'Acumulación de basura'
    when 'Calle anegada' then 'Calle inundada'
    when 'Canal o desagüe' then 'Canales o zanjones obstruidos'
    when 'Defensa o terraplén' then 'Defensa o terraplén en mal estado'
    else new.topic end;
  new.description := coalesce(new.description, '');

  if tg_op = 'INSERT' then
    if char_length(new.description) > 200 then
      raise exception 'La descripción no puede superar los 200 caracteres.';
    end if;
  elsif new.description is distinct from old.description and char_length(new.description) > 200 then
    raise exception 'La descripción no puede superar los 200 caracteres.';
  end if;

  if tg_op = 'INSERT' then
    if new.photo_path is null then
      raise exception 'Adjuntá una foto del reclamo.';
    end if;
  elsif new.photo_path is distinct from old.photo_path and new.photo_path is null then
    raise exception 'Adjuntá una foto del reclamo.';
  end if;

  return new;
end;
$$;

commit;
