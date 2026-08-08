-- Create image_assets table for AI generated images
CREATE TABLE IF NOT EXISTS image_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  storage_path text,
  prompt text,
  endpoint text,
  product_id uuid,
  asset_type text CHECK (asset_type IN ('hero', 'product', 'lifestyle', 'cutout', 'banner')),
  width integer,
  height integer,
  file_size_bytes integer,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_image_assets_product_id ON image_assets(product_id);
CREATE INDEX IF NOT EXISTS idx_image_assets_asset_type ON image_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_image_assets_created_at ON image_assets(created_at DESC);
