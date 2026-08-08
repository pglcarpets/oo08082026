-- Add additive canonical category/subcategory/slug fields without breaking
-- the current legacy slug runtime. This is the first migration step toward
-- category-subcategory-name slugs and deep IDs.

create or replace function public.catalog_slugify_token(source_value text)
returns text
language sql
immutable
as $$
  select nullif(
    trim(
      both '-'
      from regexp_replace(
        replace(replace(lower(coalesce(source_value, '')), '&', ' and '), '×', 'x'),
        '[^a-z0-9]+',
        '-',
        'g'
      )
    ),
    ''
  );
$$;

create or replace function public.normalize_catalog_category_id(source_category_id text)
returns text
language plpgsql
immutable
as $$
declare
  normalized text := lower(trim(coalesce(source_category_id, '')));
begin
  if normalized like 'oando-%' then
    normalized := substr(normalized, 8);
  end if;

  case normalized
    when 'storage' then return 'storages';
    when 'storages' then return 'storages';
    when 'educational' then return 'education';
    when 'education' then return 'education';
    when 'collaborative' then return 'soft-seating';
    when 'soft-seating' then return 'soft-seating';
    when 'chairs' then return 'seating';
    when 'other-seating' then return 'seating';
    when 'seating' then return 'seating';
    when 'workstations' then return 'workstations';
    when 'tables' then return 'tables';
    else null;
  end case;

  if normalized in ('desks-cabin-tables', 'meeting-conference-tables') then
    return 'tables';
  end if;

  if normalized in ('chairs-mesh', 'chairs-others', 'cafe-seating', 'others-2') then
    return 'seating';
  end if;

  if normalized = 'others-1' then
    return 'soft-seating';
  end if;

  return coalesce(public.catalog_slugify_token(normalized), 'products');
end;
$$;

create or replace function public.normalize_catalog_subcategory_id(
  source_category_id text,
  source_subcategory_label text,
  source_product_name text default null,
  source_metadata jsonb default '{}'::jsonb
)
returns text
language plpgsql
immutable
as $$
declare
  category_id text := public.normalize_catalog_category_id(source_category_id);
  raw_label text := lower(trim(coalesce(
    source_subcategory_label,
    source_metadata ->> 'subcategoryLabel',
    source_metadata ->> 'subcategory',
    source_metadata ->> 'subcategoryId',
    ''
  )));
  raw_product_name text := lower(trim(coalesce(source_product_name, '')));
begin
  if category_id = 'seating' then
    if raw_label like '%mesh%' or raw_product_name like '%mesh%' then return 'mesh'; end if;
    if raw_label like '%cafe%' or raw_label like '%stool%' or raw_product_name like '%cafe%' or raw_product_name like '%stool%' then return 'cafe'; end if;
    if raw_label like '%study%' or raw_label like '%training%' or raw_product_name like '%study%' or raw_product_name like '%training%' then return 'study'; end if;
    if raw_label like '%fabric%' or raw_label like '%visitor%' or raw_product_name like '%fabric%' or raw_product_name like '%visitor%' then return 'fabric'; end if;
    return 'leather';
  end if;

  if category_id = 'workstations' then
    if raw_label like '%height adjustable%' or raw_product_name like '%height adjustable%' or raw_product_name like '%height-adjustable%' then return 'height-adjustable'; end if;
    if raw_label like '%panel%' or raw_product_name like '%panel%' then return 'panel'; end if;
    return 'desking';
  end if;

  if category_id = 'tables' then
    if raw_label like '%meeting%' or raw_label like '%conference%' or raw_product_name like '%meeting%' or raw_product_name like '%conference%' then return 'meeting'; end if;
    if raw_label like '%cafe%' or raw_product_name like '%cafe%' then return 'cafe'; end if;
    if raw_label like '%training%' or raw_product_name like '%training%' then return 'training'; end if;
    return 'cabin';
  end if;

  if category_id = 'storages' then
    if raw_label like '%locker%' or raw_product_name like '%locker%' then return 'locker'; end if;
    if raw_label like '%compactor%' or raw_product_name like '%compactor%' then return 'compactor'; end if;
    if raw_label like '%metal%' or raw_product_name like '%metal%' then return 'metal'; end if;
    return 'prelam';
  end if;

  if category_id = 'soft-seating' then
    if raw_label like '%sofa%' or raw_product_name like '%sofa%' then return 'sofa'; end if;
    if raw_label like '%collaborative%' or raw_product_name like '%collaborative%' or raw_product_name like '%pod%' then return 'collaborative'; end if;
    if raw_label like '%occasional%' or raw_product_name like '%coffee table%' or raw_product_name like '%side table%' then return 'occasional-tables'; end if;
    if raw_label like '%pouffee%' or raw_product_name like '%pouf%' or raw_product_name like '%ottoman%' then return 'pouffee'; end if;
    return 'lounge';
  end if;

  if category_id = 'education' then
    if raw_label like '%library%' or raw_product_name like '%library%' then return 'library'; end if;
    if raw_label like '%hostel%' or raw_product_name like '%hostel%' then return 'hostel'; end if;
    if raw_label like '%auditorium%' or raw_product_name like '%auditorium%' then return 'auditorium'; end if;
    return 'classroom';
  end if;

  return coalesce(public.catalog_slugify_token(raw_label), public.catalog_slugify_token(raw_product_name), 'general');
end;
$$;

create or replace function public.catalog_subcategory_label(
  source_category_id text,
  source_subcategory_id text
)
returns text
language plpgsql
immutable
as $$
declare
  category_id text := public.normalize_catalog_category_id(source_category_id);
  subcategory_id text := coalesce(public.catalog_slugify_token(source_subcategory_id), '');
begin
  if category_id = 'seating' then
    case subcategory_id
      when 'mesh' then return 'Mesh chairs';
      when 'leather' then return 'Leather chairs';
      when 'fabric' then return 'Fabric chairs';
      when 'study' then return 'Study chairs';
      when 'cafe' then return 'Cafe chairs';
      else null;
    end case;
  elsif category_id = 'workstations' then
    case subcategory_id
      when 'height-adjustable' then return 'Height Adjustable Series';
      when 'desking' then return 'Desking Series';
      when 'panel' then return 'Panel Series';
      else null;
    end case;
  elsif category_id = 'tables' then
    case subcategory_id
      when 'cabin' then return 'Cabin Tables';
      when 'meeting' then return 'Meeting Tables';
      when 'cafe' then return 'Cafe Tables';
      when 'training' then return 'Training Tables';
      else null;
    end case;
  elsif category_id = 'storages' then
    case subcategory_id
      when 'prelam' then return 'Prelam Storage';
      when 'metal' then return 'Metal Storage';
      when 'compactor' then return 'Compactor Storage';
      when 'locker' then return 'Locker';
      else null;
    end case;
  elsif category_id = 'soft-seating' then
    case subcategory_id
      when 'lounge' then return 'Lounge';
      when 'sofa' then return 'Sofa';
      when 'collaborative' then return 'Collaborative';
      when 'pouffee' then return 'Pouffee';
      when 'occasional-tables' then return 'Occasional Tables';
      else null;
    end case;
  elsif category_id = 'education' then
    case subcategory_id
      when 'classroom' then return 'Classroom';
      when 'library' then return 'Library';
      when 'hostel' then return 'Hostel';
      when 'auditorium' then return 'Auditorium';
      else null;
    end case;
  end if;

  return initcap(replace(subcategory_id, '-', ' '));
end;
$$;

create or replace function public.compute_catalog_slug_v2(
  source_category_id text,
  source_subcategory_id text,
  source_name text
)
returns text
language sql
immutable
as $$
  select concat_ws(
    '-',
    public.normalize_catalog_category_id(source_category_id),
    public.catalog_slugify_token(source_subcategory_id),
    public.catalog_slugify_token(source_name)
  );
$$;

create or replace function public.compute_catalog_series_id(
  source_category_id text,
  source_subcategory_id text,
  source_series_name text
)
returns text
language sql
immutable
as $$
  select concat_ws(
    '-',
    public.normalize_catalog_category_id(source_category_id),
    coalesce(public.catalog_slugify_token(source_subcategory_id), 'general'),
    coalesce(public.catalog_slugify_token(source_series_name), 'series')
  );
$$;

create or replace function public.set_product_canonical_fields()
returns trigger
language plpgsql
as $$
declare
  computed_category_id text;
  computed_subcategory_id text;
begin
  computed_category_id := public.normalize_catalog_category_id(new.category_id);
  computed_subcategory_id := public.normalize_catalog_subcategory_id(
    new.category_id,
    coalesce(new.metadata ->> 'subcategoryLabel', new.metadata ->> 'subcategory', new.metadata ->> 'subcategoryId', ''),
    new.name,
    coalesce(new.metadata, '{}'::jsonb)
  );

  new.canonical_category_id := computed_category_id;
  new.canonical_subcategory_id := computed_subcategory_id;
  new.canonical_subcategory_label := public.catalog_subcategory_label(
    computed_category_id,
    computed_subcategory_id
  );
  new.canonical_slug_v2 := public.compute_catalog_slug_v2(
    computed_category_id,
    computed_subcategory_id,
    new.name
  );
  new.canonical_series_id := public.compute_catalog_series_id(
    computed_category_id,
    computed_subcategory_id,
    coalesce(new.series_name, new.series_id, 'series')
  );
  new.metadata := coalesce(new.metadata, '{}'::jsonb) || jsonb_strip_nulls(
    jsonb_build_object(
      'categoryIdCanonical', new.canonical_category_id,
      'subcategoryId', new.canonical_subcategory_id,
      'subcategoryLabel', new.canonical_subcategory_label,
      'canonicalSlugV2', new.canonical_slug_v2,
      'canonicalSeriesId', new.canonical_series_id
    )
  );
  return new;
end;
$$;

do $$
declare
  rel_name text;
begin
  foreach rel_name in array array['catalog_categories', 'categories']
  loop
    if exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = rel_name
        and c.relkind = 'r'
    ) then
      execute format(
        'alter table public.%I add column if not exists canonical_id text',
        rel_name
      );
      execute format(
        'update public.%I set canonical_id = public.normalize_catalog_category_id(id)
         where canonical_id is distinct from public.normalize_catalog_category_id(id)',
        rel_name
      );
      execute format(
        'create index if not exists idx_%I_canonical_id on public.%I (canonical_id)',
        rel_name,
        rel_name
      );
    end if;
  end loop;
end
$$;

do $$
declare
  rel_name text;
begin
  foreach rel_name in array array['catalog_products', 'products']
  loop
    if exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = rel_name
        and c.relkind = 'r'
    ) then
      execute format(
        'alter table public.%I
           add column if not exists canonical_category_id text,
           add column if not exists canonical_subcategory_id text,
           add column if not exists canonical_subcategory_label text,
           add column if not exists canonical_slug_v2 text,
           add column if not exists canonical_series_id text',
        rel_name
      );

      execute format(
        $sql$
        with computed as (
          select
            id,
            public.normalize_catalog_category_id(category_id) as canonical_category_id,
            public.normalize_catalog_subcategory_id(
              category_id,
              coalesce(metadata ->> 'subcategoryLabel', metadata ->> 'subcategory', metadata ->> 'subcategoryId', ''),
              name,
              coalesce(metadata, '{}'::jsonb)
            ) as canonical_subcategory_id
          from public.%I
        )
        update public.%I as p
        set canonical_category_id = computed.canonical_category_id,
            canonical_subcategory_id = computed.canonical_subcategory_id,
            canonical_subcategory_label = public.catalog_subcategory_label(
              computed.canonical_category_id,
              computed.canonical_subcategory_id
            ),
            canonical_slug_v2 = public.compute_catalog_slug_v2(
              computed.canonical_category_id,
              computed.canonical_subcategory_id,
              p.name
            ),
            canonical_series_id = public.compute_catalog_series_id(
              computed.canonical_category_id,
              computed.canonical_subcategory_id,
              coalesce(p.series_name, p.series_id, 'series')
            ),
            metadata = coalesce(p.metadata, '{}'::jsonb) || jsonb_strip_nulls(
              jsonb_build_object(
                'categoryIdCanonical', computed.canonical_category_id,
                'subcategoryId', computed.canonical_subcategory_id,
                'subcategoryLabel', public.catalog_subcategory_label(
                  computed.canonical_category_id,
                  computed.canonical_subcategory_id
                ),
                'canonicalSlugV2', public.compute_catalog_slug_v2(
                  computed.canonical_category_id,
                  computed.canonical_subcategory_id,
                  p.name
                ),
                'canonicalSeriesId', public.compute_catalog_series_id(
                  computed.canonical_category_id,
                  computed.canonical_subcategory_id,
                  coalesce(p.series_name, p.series_id, 'series')
                )
              )
            )
        from computed
        where p.id = computed.id
        $sql$,
        rel_name,
        rel_name
      );

      execute format(
        'create index if not exists idx_%I_canonical_category_id on public.%I (canonical_category_id)',
        rel_name,
        rel_name
      );
      execute format(
        'create index if not exists idx_%I_canonical_subcategory_id on public.%I (canonical_subcategory_id)',
        rel_name,
        rel_name
      );
      execute format(
        'create index if not exists idx_%I_canonical_slug_v2 on public.%I (canonical_slug_v2)',
        rel_name,
        rel_name
      );

      execute format(
        'drop trigger if exists trg_set_product_canonical_fields on public.%I',
        rel_name
      );
      execute format(
        'create trigger trg_set_product_canonical_fields
         before insert or update of category_id, name, metadata, series_id, series_name
         on public.%I
         for each row
         execute function public.set_product_canonical_fields()',
        rel_name
      );
    end if;
  end loop;
end
$$;

do $$
begin
  if exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'catalog_products'
      and c.relkind = 'r'
  ) then
    execute '
      create or replace view public.product_canonical_slug_v2_collisions as
      select
        canonical_slug_v2,
        count(*) as row_count,
        array_agg(slug order by slug) as legacy_slugs
      from public.catalog_products
      where canonical_slug_v2 is not null
      group by canonical_slug_v2
      having count(*) > 1
    ';
  elsif exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'products'
      and c.relkind = 'r'
  ) then
    execute '
      create or replace view public.product_canonical_slug_v2_collisions as
      select
        canonical_slug_v2,
        count(*) as row_count,
        array_agg(slug order by slug) as legacy_slugs
      from public.products
      where canonical_slug_v2 is not null
      group by canonical_slug_v2
      having count(*) > 1
    ';
  end if;
end
$$;
