CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  city TEXT NOT NULL,
  sector TEXT NOT NULL,
  description TEXT NOT NULL,
  featured BOOLEAN DEFAULT false,
  image TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed rows: idempotent — skip rows that already exist by (client_name, city).
-- (projects table is later dropped by 20260524240000 on the products split,
-- but this guard keeps the migration safe to re-run on a fresh DB.)
INSERT INTO projects (client_name, city, sector, image, description, featured)
SELECT * FROM (VALUES
  ('Titan', 'Patna', 'Corporate', '/assets/marketing/client-logos/titan.webp', 'Complete office fit-out for Titan Patna branch', true),
  ('Usha', 'Patna', 'Manufacturing', '/assets/marketing/client-logos/usha.webp', 'Executive and workstation seating', true),
  ('Bihar Government', 'Patna', 'Government', '/assets/marketing/client-logos/bihar-govt.webp', 'Secretariat office furnishing', true),
  ('DMRC', 'Delhi', 'Government', '/assets/marketing/client-logos/dmrc.webp', 'Administrative office workstations', true),
  ('TVS', 'Patna', 'Automotive', '/assets/marketing/client-logos/tvs.webp', 'Showroom and office seating', false)
) AS v(client_name, city, sector, image, description, featured)
WHERE NOT EXISTS (
  SELECT 1 FROM projects p WHERE p.client_name = v.client_name AND p.city = v.city
);
