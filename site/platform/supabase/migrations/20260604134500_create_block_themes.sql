CREATE TABLE IF NOT EXISTS block_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean DEFAULT false,
  tokens jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure only one theme can be marked as active at a time
CREATE UNIQUE INDEX IF NOT EXISTS only_one_active_theme ON block_themes(is_active) WHERE is_active = true;
