ALTER TABLE image_assets ENABLE ROW LEVEL SECURITY;

-- Public read access for authenticated users
DROP POLICY IF EXISTS "Authenticated users can read image_assets" ON image_assets;
CREATE POLICY "Authenticated users can read image_assets"
  ON image_assets FOR SELECT
  TO authenticated
  USING (true);

-- Insert access for authenticated users
DROP POLICY IF EXISTS "Authenticated users can insert image_assets" ON image_assets;
CREATE POLICY "Authenticated users can insert image_assets"
  ON image_assets FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update/delete only for owner
DROP POLICY IF EXISTS "Users can update own image_assets" ON image_assets;
CREATE POLICY "Users can update own image_assets"
  ON image_assets FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete own image_assets" ON image_assets;
CREATE POLICY "Users can delete own image_assets"
  ON image_assets FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
