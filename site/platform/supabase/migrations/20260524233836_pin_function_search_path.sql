-- Tier 4: Pin search_path on every public function to mitigate the
-- "function_search_path_mutable" advisor warning.
--
-- An explicit search_path forces every unqualified reference inside the
-- function body to resolve against the listed schemas, eliminating the
-- vector where a privileged caller's session could be tricked into calling
-- attacker-controlled objects.
--
-- Function bodies use unqualified names targeting the public schema, so we
-- set search_path = public, pg_temp.

alter function public.capture_business_stats_history()
  set search_path = public, pg_temp;

alter function public.catalog_slugify_token(source_value text)
  set search_path = public, pg_temp;

alter function public.catalog_subcategory_label(source_category_id text, source_subcategory_id text)
  set search_path = public, pg_temp;

alter function public.compute_catalog_series_id(source_category_id text, source_subcategory_id text, source_series_name text)
  set search_path = public, pg_temp;

alter function public.compute_catalog_slug_v2(source_category_id text, source_subcategory_id text, source_name text)
  set search_path = public, pg_temp;

alter function public.compute_normalized_product_name_key(source_name text)
  set search_path = public, pg_temp;

alter function public.handle_new_user()
  set search_path = public, pg_temp;

alter function public.normalize_catalog_category_id(source_category_id text)
  set search_path = public, pg_temp;

alter function public.normalize_catalog_subcategory_id(source_category_id text, source_subcategory_label text, source_product_name text, source_metadata jsonb)
  set search_path = public, pg_temp;

alter function public.set_product_canonical_fields()
  set search_path = public, pg_temp;

alter function public.set_products_normalized_name_key()
  set search_path = public, pg_temp;

alter function public.touch_customer_queries_updated_at()
  set search_path = public, pg_temp;

alter function public.touch_product_images_updated_at()
  set search_path = public, pg_temp;

alter function public.touch_product_slug_aliases_updated_at()
  set search_path = public, pg_temp;

alter function public.touch_product_specs_updated_at()
  set search_path = public, pg_temp;

alter function public.touch_user_history_updated_at()
  set search_path = public, pg_temp;
