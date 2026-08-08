-- Canonical migration: image_assets table
-- This is the reference migration for the image_assets table schema.
-- The actual applied migration is 20250522000000_create_image_assets.sql

CREATE TABLE IF NOT EXISTS image_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  storage_path text,
  prompt text,
  endpoint text,
  product_id uuid REFERENCES products(id),
  asset_type text CHECK (asset_type IN ('hero', 'product', 'lifestyle', 'cutout', 'banner')),
  width integer,
  height integer,
  file_size_bytes integer,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_image_assets_product_id ON image_assets(product_id);
CREATE INDEX IF NOT EXISTS idx_image_assets_asset_type ON image_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_image_assets_created_at ON image_assets(created_at DESC);

-- RLS Policies
ALTER TABLE image_assets ENABLE ROW LEVEL SECURITY;

-- Public read for authenticated users
DROP POLICY IF EXISTS "Authenticated users can read image_assets" ON image_assets;
CREATE POLICY "Authenticated users can read image_assets"
  ON image_assets FOR SELECT
  TO authenticated
  USING (true);

-- Insert for authenticated users
DROP POLICY IF EXISTS "Authenticated users can insert image_assets" ON image_assets;
CREATE POLICY "Authenticated users can insert image_assets"
  ON image_assets FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update for owner only
DROP POLICY IF EXISTS "Users can update own image_assets" ON image_assets;
CREATE POLICY "Users can update own image_assets"
  ON image_assets FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Delete for owner only
DROP POLICY IF EXISTS "Users can delete own image_assets" ON image_assets;
CREATE POLICY "Users can delete own image_assets"
  ON image_assets FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
