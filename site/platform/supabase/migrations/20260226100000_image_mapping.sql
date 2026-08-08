-- ============================================================
-- Migration: Category-specific image mapping
-- Consolidates 002_image_mapping.sql + 003_create_categories_table.sql
-- ============================================================

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT
);

-- RLS for categories (read-only for anon)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Allow public read access on categories'
  ) THEN
    CREATE POLICY "Allow public read access on categories"
      ON categories
      FOR SELECT
      USING (true);
  END IF;
END
$$;

-- 2. Add images JSONB, category_id FK, and alt_text to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS category_id TEXT REFERENCES categories(id),
  ADD COLUMN IF NOT EXISTS alt_text TEXT;

-- 3. Index for fast category_id lookups
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products (category_id);
