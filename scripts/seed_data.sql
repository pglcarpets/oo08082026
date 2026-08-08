-- CATEGORIES SEED
INSERT INTO categories (id, name) VALUES ('oando-workstations', 'Workstations') ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name) VALUES ('oando-tables', 'Tables') ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name) VALUES ('oando-storage', 'Storage') ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name) VALUES ('oando-soft-seating', 'Soft Seating') ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name) VALUES ('oando-chairs', 'Chairs') ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name) VALUES ('oando-other-seating', 'Other Seating') ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name) VALUES ('oando-educational', 'Educational') ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name) VALUES ('oando-collaborative', 'Collaborative Spaces') ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name) VALUES ('cafe', 'Cafe') ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name) VALUES ('meeting-tables', 'Meeting Tables') ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name) VALUES ('others', 'Others') ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name) VALUES ('projects', 'Projects') ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name) VALUES ('workstations', 'Workstations') ON CONFLICT (id) DO NOTHING;
INSERT INTO categories (id, name) VALUES ('chairs', 'Chairs') ON CONFLICT (id) DO NOTHING;

-- PRODUCTS SEED
INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Curvivo', 'curvivo', 'oando-workstations', 'oando-workstations', '/assets/catalog/oando-workstations--curvivo/image-1.jpg', 'A dynamic and innovative workstation that is adaptable to different workspaces. Curvivo office solution for enhanced efficiency, embracing fluidity and harmony.', ARRAY['/assets/catalog/oando-workstations--curvivo/image-2.jpg','/assets/catalog/oando-workstations--curvivo/image-3.jpg','/assets/catalog/oando-workstations--curvivo/image-4.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"A dynamic and innovative workstation that is adaptable to different workspaces. Curvivo office solution for enhanced efficiency, embracing fluidity and harmony.","features":["Enhanced Efficiency","Fluid Design","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Steel frame, powder-coated","Melamine-finish MDF work surface","Adjustable levelling feet"]}'::jsonb, '{"source":"oando.co.in","category":"workstations","subcategory":"Linear Workstation","priceRange":"premium","useCase":["Executive Office","Focused Work"],"material":["Steel","MDF","Melamine"],"bifmaCertified":true,"warrantyYears":5,"use_case":["Executive Office","Focused Work"]}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Steel frame, powder-coated","Melamine-finish MDF work surface","Adjustable levelling feet"],"features":["Enhanced Efficiency","Fluid Design","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-workstations-series', 'Workstations Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Adaptable', 'adaptable', 'oando-workstations', 'oando-workstations', '/assets/catalog/oando-workstations--adaptable/image-1.jpg', 'Adaptable modular office furniture designed for flexible workstations, modern offices, and collaborative spaces. Ideal for office furniture, modular office furniture, and workspace solutions.', ARRAY['/assets/catalog/oando-workstations--adaptable/image-2.jpg','/assets/catalog/oando-workstations--adaptable/image-3.jpg','/assets/catalog/oando-workstations--adaptable/image-4.jpg','/assets/catalog/oando-workstations--adaptable/image-5.jpg','/assets/catalog/oando-workstations--adaptable/image-6.jpg','/assets/catalog/oando-workstations--adaptable/image-7.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Adaptable modular office furniture designed for flexible workstations, modern offices, and collaborative spaces. Ideal for office furniture, modular office furniture, and workspace solutions.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Steel frame, powder-coated","Melamine-finish MDF work surface","Adjustable levelling feet"]}'::jsonb, '{"source":"oando.co.in","category":"workstations","subcategory":"Modular Workstation","priceRange":"mid","useCase":["Open Office","Collaborative"],"material":["Steel","MFC"],"bifmaCertified":true,"warrantyYears":5,"use_case":["Open Office","Collaborative"]}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Steel frame, powder-coated","Melamine-finish MDF work surface","Adjustable levelling feet"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-workstations-series', 'Workstations Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('DeskPro', 'deskpro', 'oando-workstations', 'oando-workstations', '/assets/catalog/oando-workstations--deskpro/image-1.jpg', 'DeskPro office workstations for efficient layouts. Discover modular desks for modern workspaces.', ARRAY['/assets/catalog/oando-workstations--deskpro/image-2.jpg','/assets/catalog/oando-workstations--deskpro/image-3.jpg','/assets/catalog/oando-workstations--deskpro/image-4.jpg','/assets/catalog/oando-workstations--deskpro/image-5.jpg','/assets/catalog/oando-workstations--deskpro/image-6.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"DeskPro office workstations for efficient layouts. Discover modular desks for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Steel frame, powder-coated","Melamine-finish MDF work surface","Adjustable levelling feet"]}'::jsonb, '{"source":"oando.co.in","category":"workstations","subcategory":"L-Shaped Workstation","priceRange":"mid","useCase":["Corner Office","Managerial"],"material":["Metal","Laminate"],"bifmaCertified":true,"warrantyYears":5,"use_case":["Corner Office","Managerial"]}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Steel frame, powder-coated","Melamine-finish MDF work surface","Adjustable levelling feet"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-workstations-series', 'Workstations Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Sleek', 'sleek', 'oando-workstations', 'oando-workstations', '/assets/catalog/oando-workstations--sleek/image-1.jpg', 'Sleek modern office furniture for stylish and functional workspaces. Explore solutions for modern workspaces.', ARRAY['/assets/catalog/oando-workstations--sleek/image-2.jpg','/assets/catalog/oando-workstations--sleek/image-3.jpg','/assets/catalog/oando-workstations--sleek/image-4.jpg','/assets/catalog/oando-workstations--sleek/image-5.jpg','/assets/catalog/oando-workstations--sleek/image-6.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Sleek modern office furniture for stylish and functional workspaces. Explore solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Steel frame, powder-coated","Melamine-finish MDF work surface","Adjustable levelling feet"]}'::jsonb, '{"source":"oando.co.in","category":"workstations","subcategory":"Linear Workstation","priceRange":"budget","useCase":["BPO","Compact Office"],"material":["Steel","MFC"],"bifmaCertified":true,"warrantyYears":5,"use_case":["BPO","Compact Office"]}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Steel frame, powder-coated","Melamine-finish MDF work surface","Adjustable levelling feet"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-workstations-series', 'Workstations Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Trio', 'trio-2', 'oando-workstations', 'oando-workstations', '/assets/catalog/oando-workstations--trio-2/image-1.jpg', 'A workstation system built for open spaces, crafted to bring flow and flexibility. Modular and adaptable solution designed to shape every kind of workstyle.', ARRAY['/assets/catalog/oando-workstations--trio-2/image-2.jpg','/assets/catalog/oando-workstations--trio-2/image-3.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"A workstation system built for open spaces, crafted to bring flow and flexibility. Modular and adaptable solution designed to shape every kind of workstyle, from focused corners to collaborative zones, creating harmony across the workplace.","features":["Flow and Flexibility","Modular Adaptability","Supportive Design"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Steel frame, powder-coated","Melamine-finish MDF work surface","Adjustable levelling feet"]}'::jsonb, '{"source":"oando.co.in","category":"workstations","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Steel frame, powder-coated","Melamine-finish MDF work surface","Adjustable levelling feet"],"features":["Flow and Flexibility","Modular Adaptability","Supportive Design"],"sustainability_score":5}'::jsonb, 'oando-workstations-series', 'Workstations Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Panel Pro', 'panel-pro', 'oando-workstations', 'oando-workstations', '/assets/catalog/oando-workstations--panel-pro/image-1.jpg', 'Panel Pro office partition systems for modular layouts and space division. Discover solutions for modern workspaces.', ARRAY['/assets/catalog/oando-workstations--panel-pro/image-2.jpg','/assets/catalog/oando-workstations--panel-pro/image-3.jpg','/assets/catalog/oando-workstations--panel-pro/image-4.jpg','/assets/catalog/oando-workstations--panel-pro/image-5.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Panel Pro office partition systems for modular layouts and space division. Discover solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Steel frame, powder-coated","Melamine-finish MDF work surface","Adjustable levelling feet"]}'::jsonb, '{"source":"oando.co.in","category":"workstations","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Steel frame, powder-coated","Melamine-finish MDF work surface","Adjustable levelling feet"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-workstations-series', 'Workstations Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('X Bench', 'x-bench', 'oando-workstations', 'oando-workstations', '/assets/catalog/oando-workstations--x-bench/image-1.jpg', 'X-Bench workstation system for collaborative offices. Discover modular benching for modern workspaces.', ARRAY['/assets/catalog/oando-workstations--x-bench/image-2.jpg','/assets/catalog/oando-workstations--x-bench/image-3.jpg','/assets/catalog/oando-workstations--x-bench/image-4.jpg','/assets/catalog/oando-workstations--x-bench/image-5.jpg']::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"X-Bench workstation system for collaborative offices. Discover modular benching for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Steel frame, powder-coated","Melamine-finish MDF work surface","Adjustable levelling feet"]}'::jsonb, '{"source":"oando.co.in","category":"workstations","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Steel frame, powder-coated","Melamine-finish MDF work surface","Adjustable levelling feet"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-workstations-series', 'Workstations Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Fenix', 'fenix', 'oando-workstations', 'oando-workstations', '/assets/catalog/oando-workstations--fenix/image-1.jpg', 'Workstation featuring a strong 40x40 leg framework that pairs durability with a sleek, minimal profile. Modular adaptability supports the changing needs of contemporary teams.', ARRAY['/assets/catalog/oando-workstations--fenix/image-2.jpg','/assets/catalog/oando-workstations--fenix/image-3.jpg','/assets/catalog/oando-workstations--fenix/image-4.jpg','/assets/catalog/oando-workstations--fenix/image-5.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Workstation featuring a strong 40x40 leg framework that pairs durability with a sleek, minimal profile. Modular adaptability supports the changing needs of contemporary teams through composed function.","features":["40x40 Leg Framework","Sleek Profile","Modular Adaptability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Steel frame, powder-coated","Melamine-finish MDF work surface","Adjustable levelling feet"]}'::jsonb, '{"source":"oando.co.in","category":"workstations","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Steel frame, powder-coated","Melamine-finish MDF work surface","Adjustable levelling feet"],"features":["40x40 Leg Framework","Sleek Profile","Modular Adaptability"],"sustainability_score":5}'::jsonb, 'oando-workstations-series', 'Workstations Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Exquisite', 'exquisite', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_690f482177b80a5aa8d4f314_exquisite.jpg', 'Exquisite blends refined craftsmanship with modern authority. Premium executive office furniture designed for modern cabins, creating a bold yet graceful presence.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_690f47e748a3ed3ed1be7cc6_exquisite_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Exquisite blends refined craftsmanship with modern authority. It uses premium veneers and precise detailing to create a bold yet graceful presence that defines the executive space.","features":["Refined Craftsmanship","Premium Veneers","Modern Authority"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Refined Craftsmanship","Premium Veneers","Modern Authority"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('NexTable', 'nextable', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_68ac0b807564dd58e2a3306e_nextable_1.jpg', 'Nextable height-adjustable tables for ergonomic comfort. Improve posture and productivity with One and Only sit-stand desks.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68ac0b83bc8b483e98f3fac6_nextable_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Nextable height-adjustable tables for ergonomic comfort. Improve posture and productivity with One and Only sit-stand desks.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Impulse', 'impulse', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_68ac0bcdb10ee7e0d263392f_impulse_1.jpg', 'Impulse workstation system for modular office layouts. Discover efficient space planning and premium design for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68ac0bd085bc1496ca4105d3_impulse_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Impulse workstation system for modular office layouts. Discover efficient space planning and premium design for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Crest', 'crest', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_690320cae57dfa867bb9fb19_crest.jpg', 'Crest executive office table crafted for leadership spaces. Modular office furniture with premium finishes for modern corporate interiors.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_690320ce4217d21446ea5d49_crest_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Crest executive office table crafted for leadership spaces. Modular office furniture with premium finishes for modern corporate interiors.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Opus', 'opus-2', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_69207b1e31e6cda889f3dc1e_opus.jpg', 'Opus 2 executive office desk crafted for premium interiors. Luxury office furniture designed for modern executive workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_69207b23866b7196e978d54f_opus_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Opus 2 executive office desk crafted for premium interiors. Luxury office furniture designed for modern executive workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Convesso', 'convesso', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_68ac09820580a18498c921c1_convesso.jpg', 'Convesso conference table for meeting rooms. Stylish office meeting table designed for collaboration and modern workspace design.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68ac098849f11a71a090963b_convesso_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Convesso conference table for meeting rooms. Stylish office meeting table designed for collaboration and modern workspace design.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Uniflip', 'uniflip', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_68ac0be40f3412327f1d163e_uniflip_1.jpg', 'Uniflip training and flip tables for flexible learning spaces and meetings. Explore versatile table solutions for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68ac0be83d6190304fcb2304_uniflip_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Uniflip training and flip tables for flexible learning spaces and meetings. Explore versatile table solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Sleek-Meet', 'sleek-meet', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_68ac09a549f11a71a090b1bc_sleek_meet.jpg', 'Sleek Meet conference tables for modern meeting rooms. Discover tables for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68ac09a949f11a71a090b349_sleek_meet_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Sleek Meet conference tables for modern meeting rooms. Discover tables for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Convene', 'convene', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_68ac0ad23ae62d06453de864_canvene_1.jpg', 'Convene meeting table designed for conference rooms. Functional office meeting table supporting teamwork and productivity.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68ac0ad5acae760a25ca4248_canvene_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Convene meeting table designed for conference rooms. Functional office meeting table supporting teamwork and productivity.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Desk-Meet', 'desk-meet', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_68ac09c017fc68ec25131aa8_desk_meet.jpg', 'Desk Meet conference table for productive discussions. Durable office table furniture ideal for modern meeting rooms and offices.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68ac09c77564dd58e2a1b62d_desk_meet_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Desk Meet conference table for productive discussions. Durable office table furniture ideal for modern meeting rooms and offices.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Modulus', 'modulus', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_68ac0c17a71dc35ac0df3c77_modulus_1.jpg', 'Modulus modular office furniture for flexible layouts and efficient space planning. Explore modern solutions for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68ac0c1b0580a18498cb0b67_modulus_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Modulus modular office furniture for flexible layouts and efficient space planning. Explore modern solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Presidency', 'presidency', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_6899abac81b853e07c6bdded_image_1238.png', 'Presidency executive table designed for luxury boss cabins. Premium office furniture for modern corporate offices across India.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a2e46703f08bf146fecda9_presidency_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Presidency executive table designed for luxury boss cabins. Premium office furniture for modern corporate offices across India.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Curvivo', 'curvivo-meet', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_68ac09debc8b483e98f2e291_curvivo.jpg', 'Curvivo Meet table for offices and training rooms. Smart modular office furniture built for collaboration and daily meetings.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68ac09e3acae760a25c9e330_curvivo_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Curvivo Meet table for offices and training rooms. Smart modular office furniture built for collaboration and daily meetings.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Stake', 'stake', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_68ac0b19714954caacc56e8c_stake_1.jpg', 'Stake versatile modular table and desk system offering functionality and durability. Ideal workspace solution for daily workstations and team meetings.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68ac0b1e04e90dca0d907df1_stake_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Stake versatile modular table and desk system offering functionality and durability. Ideal workspace solution for daily workstations and team meetings.","features":["Modular Table System","Versatile Layouts","Durability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Modular Table System","Versatile Layouts","Durability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Inox', 'inox', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_68ac0ae80580a18498c9f668_inox_1.jpg', 'Inox metal office furniture with durable construction. Strong tables and storage solutions built for modern office furniture needs.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68ac0aec17fc68ec2513f118_inox_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Inox metal office furniture with durable construction. Strong tables and storage solutions built for modern office furniture needs.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Consulate', 'consulate', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_6899ab6c10d61f61929e6bbb_image_1240.png', 'Consulate executive office table with elegant styling and durability. Perfect modular office furniture for cabins and leadership spaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a2e438d2d6d279597506e0_consulate_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Consulate executive office table with elegant styling and durability. Perfect modular office furniture for cabins and leadership spaces.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('X Meet', 'x-meet', 'oando-tables', 'oando-tables', '', 'X Meet conference table for boardrooms and offices. Spacious and durable office meeting table for modern corporate setups.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"X Meet conference table for boardrooms and offices. Spacious and durable office meeting table for modern corporate setups.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Sleek', 'sleek-tab', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_68ac0a8c7b975fe679fd0ee3_cafe_sleek_1.jpg', 'Sleek Tab training and meeting table for offices. Flexible training table furniture for collaborative workstations and conference rooms.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68ac0a913ae62d06453da920_cafe_sleek_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Sleek Tab training and meeting table for offices. Flexible training table furniture for collaborative workstations and conference rooms.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Letz', 'letz-think', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_68ac0a42acae760a25ca04cd_letz_think.jpg', 'Letz Think training table for classrooms and offices. Flexible training table furniture for workshops, seminars, and learning spaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68ac0a493ae62d06453d5aa9_letz_think_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Letz Think training table for classrooms and offices. Flexible training table furniture for workshops, seminars, and learning spaces.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Apex', 'apex', 'oando-tables', 'oando-tables', '/assets/catalog/686d3b55385e7b905b01d3a5_6899ac6f98d87ab3c05862ed_image_1218.png', 'Apex executive office desk offering modern design and durability. Ideal office table furniture for professional and corporate cabins.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a2e4f47c86ba66b1d6d195_apex_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Apex executive office desk offering modern design and durability. Ideal office table furniture for professional and corporate cabins.","features":["Manufacturing","Sustainability"],"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"]}'::jsonb, '{"source":"oando.co.in","category":"tables","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"1800900750mm (standard)","materials":["MFC top (25mm thick)","Steel powder-coated base","PVC edge banding 2mm"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-tables-series', 'Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Wooden', 'prelam-locker', 'oando-storage', 'oando-storage', '/assets/catalog/products/imported/storage/image-14.webp', 'The wooden locker blends style and functionality, offering secure storage for everyday use in offices, gyms, and schools. Its thoughtful design ensures organized spaces while adding warmth to shared e', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a33d88ac691a23437da4a9_locker_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"The wooden locker blends style and functionality, offering secure storage for everyday use in offices, gyms, and schools. Its thoughtful design ensures organized spaces while adding warmth to shared e","features":["Manufacturing","Sustainability"],"dimensions":"W900D450H1800mm (wardrobe)","materials":["CRCA steel, powder-coated","Piano hinge doors","Adjustable shelves"]}'::jsonb, '{"source":"oando.co.in","category":"storage","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W900D450H1800mm (wardrobe)","materials":["CRCA steel, powder-coated","Piano hinge doors","Adjustable shelves"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-storage-series', 'Storage Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Prelam', 'pedestal', 'oando-storage', 'oando-storage', '/assets/catalog/products/imported/storage/image-15.webp', 'Office pedestal storage unit for organized workstations. Compact office storage solution with secure drawers for everyday use.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a33aed4aa7c59dfbd123f7_pedestal_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Office pedestal storage unit for organized workstations. Compact office storage solution with secure drawers for everyday use.","features":["Manufacturing","Sustainability"],"dimensions":"W900D450H1800mm (wardrobe)","materials":["CRCA steel, powder-coated","Piano hinge doors","Adjustable shelves"]}'::jsonb, '{"source":"oando.co.in","category":"storage","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W900D450H1800mm (wardrobe)","materials":["CRCA steel, powder-coated","Piano hinge doors","Adjustable shelves"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-storage-series', 'Storage Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Metal Pedestal', 'metal-pedestal', 'oando-storage', 'oando-storage', '/assets/catalog/products/imported/storage/image-16.webp', 'Office pedestal storage units for desks and workstations. Discover compact and secure storage solutions for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a33bd6c74b7831216a4bd2_pedestal_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Office pedestal storage units for desks and workstations. Discover compact and secure storage solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W900D450H1800mm (wardrobe)","materials":["CRCA steel, powder-coated","Piano hinge doors","Adjustable shelves"]}'::jsonb, '{"source":"oando.co.in","category":"storage","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W900D450H1800mm (wardrobe)","materials":["CRCA steel, powder-coated","Piano hinge doors","Adjustable shelves"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-storage-series', 'Storage Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Compactor', 'compactor', 'oando-storage', 'oando-storage', '/assets/catalog/products/imported/storage/image-39.webp', 'High-density compactor storage systems for files and documents. Explore space-saving storage solutions for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a33d1345008068da79673a_compactor_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"High-density compactor storage systems for files and documents. Explore space-saving storage solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W900D450H1800mm (wardrobe)","materials":["CRCA steel, powder-coated","Piano hinge doors","Adjustable shelves"]}'::jsonb, '{"source":"oando.co.in","category":"storage","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W900D450H1800mm (wardrobe)","materials":["CRCA steel, powder-coated","Piano hinge doors","Adjustable shelves"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-storage-series', 'Storage Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Metal Locker', 'metal-locker', 'oando-storage', 'oando-storage', '/assets/catalog/products/imported/storage/image-42.webp', 'Metal lockers for offices and institutions. Discover secure, durable, and space-efficient locker storage solutions for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a33d4537b54c7c3b17f77b_metal_locker_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Metal lockers for offices and institutions. Discover secure, durable, and space-efficient locker storage solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W900D450H1800mm (wardrobe)","materials":["CRCA steel, powder-coated","Piano hinge doors","Adjustable shelves"]}'::jsonb, '{"source":"oando.co.in","category":"storage","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W900D450H1800mm (wardrobe)","materials":["CRCA steel, powder-coated","Piano hinge doors","Adjustable shelves"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-storage-series', 'Storage Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Prelam', 'prelam-storage', 'oando-storage', 'oando-storage', '/assets/catalog/products/imported/storage/image-45.webp', 'Office side units and storage cabinets for organized workspaces. Discover modern storage for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a33aed4aa7c59dfbd123f7_pedestal_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Office side units and storage cabinets for organized workspaces. Discover modern storage for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W900D450H1800mm (wardrobe)","materials":["CRCA steel, powder-coated","Piano hinge doors","Adjustable shelves"]}'::jsonb, '{"source":"oando.co.in","category":"storage","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W900D450H1800mm (wardrobe)","materials":["CRCA steel, powder-coated","Piano hinge doors","Adjustable shelves"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-storage-series', 'Storage Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Metal', 'metal-storages', 'oando-storage', 'oando-storage', '/assets/catalog/products/imported/storage/image-73.webp', 'Office side units for workspace organization. Discover modern side storage cabinets for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a33bd6c74b7831216a4bd2_pedestal_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Office side units for workspace organization. Discover modern side storage cabinets for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W900D450H1800mm (wardrobe)","materials":["CRCA steel, powder-coated","Piano hinge doors","Adjustable shelves"]}'::jsonb, '{"source":"oando.co.in","category":"storage","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W900D450H1800mm (wardrobe)","materials":["CRCA steel, powder-coated","Piano hinge doors","Adjustable shelves"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-storage-series', 'Storage Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Heavy Dut', 'heavy-duty-racks', 'oando-storage', 'oando-storage', '/assets/catalog/products/imported/storage/image-75.webp', 'Office storage racks for organized workspaces. Discover durable shelving and rack storage solutions for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a33cd07e416b6139611e93_racks_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Office storage racks for organized workspaces. Discover durable shelving and rack storage solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W900D450H1800mm (wardrobe)","materials":["CRCA steel, powder-coated","Piano hinge doors","Adjustable shelves"]}'::jsonb, '{"source":"oando.co.in","category":"storage","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W900D450H1800mm (wardrobe)","materials":["CRCA steel, powder-coated","Piano hinge doors","Adjustable shelves"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-storage-series', 'Storage Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Verka', 'verka', 'oando-soft-seating', 'oando-soft-seating', '', 'Verka lounge chair for receptions and breakout areas, providing a stylish and comfortable seating solution for modern professional environments.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Verka lounge chair for receptions and breakout areas, providing a stylish and comfortable seating solution for modern professional environments.","features":["Ergonomic Support","Modular Design","Sustainability"],"dimensions":"W680 D700 H820mm","materials":["High-density foam","Premium fabric upholstery","Steel base"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","subcategory":"Lounge Chair","useCase":["Reception","Breakout"],"priceRange":"mid","bifmaCertified":true,"warrantyYears":5,"use_case":["Reception","Breakout"]}'::jsonb, '{"dimensions":"W680 D700 H820mm","materials":["High-density foam","Premium fabric upholstery","Steel base"],"features":["Ergonomic Support","Modular Design","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('High Cafe', 'high-cafe', 'oando-soft-seating', 'oando-soft-seating', '', 'High Cafe bar chair for breakout and dining spaces, offering a modern seating solution for cafeterias and collaborative zones.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"High Cafe bar chair for breakout and dining spaces, offering a modern seating solution for cafeterias and collaborative zones.","features":["Sleek Profile","Durable Frame","Ergonomic Footrest"],"dimensions":"W450 D480 H1050mm","materials":["Powder-coated steel","Molded plywood seat"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","subcategory":"Bar Stool","useCase":["Cafeteria","Collaborative"],"priceRange":"budget","bifmaCertified":true,"warrantyYears":5,"use_case":["Cafeteria","Collaborative"]}'::jsonb, '{"dimensions":"W450 D480 H1050mm","materials":["Powder-coated steel","Molded plywood seat"],"features":["Sleek Profile","Durable Frame","Ergonomic Footrest"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Grace', 'grace', 'oando-soft-seating', 'oando-soft-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_694b91752b9659cee7897a61_grace_landing_1.jpg', 'Grace lounge seating for waiting areas and relaxed office spaces, offering a refined and comfortable aesthetic for modern professional environments.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_694b917ae8eb928ca73aa6c9_grace_landing_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Grace lounge seating for waiting areas and relaxed office spaces, offering a refined and comfortable aesthetic for modern professional environments.","features":["Elegant Silhouette","Soft Cushioning","Durable Upholstery"],"dimensions":"W720 D750 H850mm","materials":["Internal wood frame","Memory foam topper","Reinforced fabric"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","subcategory":"Lounge Chair","useCase":["Waiting Area","Lounge"],"priceRange":"premium","bifmaCertified":true,"warrantyYears":5,"use_case":["Waiting Area","Lounge"]}'::jsonb, '{"dimensions":"W720 D750 H850mm","materials":["Internal wood frame","Memory foam topper","Reinforced fabric"],"features":["Elegant Silhouette","Soft Cushioning","Durable Upholstery"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Brim', 'brim', 'oando-soft-seating', 'oando-soft-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_69280b87ff297e69976d3ab6_brim_1.jpg', 'Brim lounge seating for waiting areas and informal spaces, designed to provide comfort and a touch of modern flair to shared office zones.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_69280b8ae5a83b56217012b6_brim_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Brim lounge seating for waiting areas and informal spaces, designed to provide comfort and a touch of modern flair to shared office zones.","features":["Versatile Styling","Compact Footprint","High-resilience Foam"],"dimensions":"W650 D680 H800mm","materials":["Molded internal frame","Premium textile finish"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","subcategory":"Lounge Chair","useCase":["Breakout","Informal Meeting"],"priceRange":"mid","bifmaCertified":true,"warrantyYears":5,"use_case":["Breakout","Informal Meeting"]}'::jsonb, '{"dimensions":"W650 D680 H800mm","materials":["Molded internal frame","Premium textile finish"],"features":["Versatile Styling","Compact Footprint","High-resilience Foam"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Fynn', 'fynn', 'oando-soft-seating', 'oando-soft-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_692af3dff014edab0a0eab6d_fynn.jpg', 'Fynn lounge seating for waiting areas and relaxed office spaces, combining ergonomic support with a contemporary design for professional settings.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_692af3e311e33e59fa4fc9a6_fynn_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Fynn lounge seating for waiting areas and relaxed office spaces, combining ergonomic support with a contemporary design for professional settings.","features":["Ergonomic Contouring","Contemporary Aesthetic","Built-to-last"],"dimensions":"W700 D720 H830mm","materials":["Stainless steel legs","Contoured foam shell"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","subcategory":"Lounge Chair","useCase":["Reception","Private Lounge"],"priceRange":"premium","bifmaCertified":true,"warrantyYears":5,"use_case":["Reception","Private Lounge"]}'::jsonb, '{"dimensions":"W700 D720 H830mm","materials":["Stainless steel legs","Contoured foam shell"],"features":["Ergonomic Contouring","Contemporary Aesthetic","Built-to-last"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Accent', 'accent', 'oando-soft-seating', 'oando-soft-seating', '', 'Accent office side and storage units for organized workspaces. Discover modern storage for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Accent office side and storage units for organized workspaces. Discover modern storage for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Como', 'como', 'oando-soft-seating', 'oando-soft-seating', '', 'Como lounge chair with plush cushioning and solid wood legs, perfect for executive waiting areas and breakout lounges.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Como executive office desks for premium leadership spaces. Explore modern desks for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Padora', 'padora', 'oando-soft-seating', 'oando-soft-seating', '', 'Padora office chairs for comfort and durability. Discover modern seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Padora office chairs for comfort and durability. Discover modern seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Trion', 'trion', 'oando-soft-seating', 'oando-soft-seating', '', 'Trion modular office furniture for flexible layouts and modern workspace needs. Discover solutions for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Trion modular office furniture for flexible layouts and modern workspace needs. Discover solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Luna', 'luna', 'oando-soft-seating', 'oando-soft-seating', '', 'Luna lounge chair with Scandinavian-inspired wooden legs and deep cushioned seat. A calm, welcoming addition to any reception or breakout space.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Nordic office furniture inspired by clean lines and modern design. Discover workstations for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Armora', 'armora', 'oando-soft-seating', 'oando-soft-seating', '', 'Armora office storage cabinets for durability and workspace organization. Discover storage for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Armora office storage cabinets for durability and workspace organization. Discover storage for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Nuvora', 'nuvora', 'oando-soft-seating', 'oando-soft-seating', '', 'Nuvora marker board for offices. Ideal for meetings and brainstorming with a sleek and durable design for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Nuvora marker board for offices. Ideal for meetings and brainstorming with a sleek and durable design for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Nook', 'nook', 'oando-soft-seating', 'oando-soft-seating', '', 'Nook lounge seating for waiting areas and informal spaces. Discover soft seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Nook lounge seating for waiting areas and informal spaces. Discover soft seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Opera', 'opera', 'oando-soft-seating', 'oando-soft-seating', '', 'Opera executive office furniture for premium aesthetics and durability. Discover solutions for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Opera executive office furniture for premium aesthetics and durability. Discover solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Crossa', 'crossa', 'oando-soft-seating', 'oando-soft-seating', '', 'Crossa office chair collection offering ergonomic comfort and modern design. Discover quality seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Crossa office chair collection offering ergonomic comfort and modern design. Discover quality seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Alonzo', 'alonzo', 'oando-soft-seating', 'oando-soft-seating', '', 'Alonzo designer office chairs for comfort and modern interiors. Explore seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Alonzo designer office chairs for comfort and modern interiors. Explore seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Spectrum', 'spectrum', 'oando-soft-seating', 'oando-soft-seating', '', 'Spectrum office furniture for flexible workspaces. Discover modern desks and seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Spectrum office furniture for flexible workspaces. Discover modern desks and seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Virello', 'virello', 'oando-soft-seating', 'oando-soft-seating', '', 'Virello office chairs for comfort and durability. Discover ergonomic seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Virello office chairs for comfort and durability. Discover ergonomic seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Arco', 'arco', 'oando-soft-seating', 'oando-soft-seating', '', 'Arco modern office furniture for stylish and functional workspaces. Discover contemporary designs for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Arco modern office furniture for stylish and functional workspaces. Discover contemporary designs for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Esmor', 'esmor', 'oando-soft-seating', 'oando-soft-seating', '', 'Esmor modern office furniture for stylish and functional workspaces. Explore solutions for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Esmor modern office furniture for stylish and functional workspaces. Explore solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Cirq', 'cirq', 'oando-soft-seating', 'oando-soft-seating', '', 'Cirq collaborative seating for teamwork and shared spaces. Discover modern office seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Cirq collaborative seating for teamwork and shared spaces. Discover modern office seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Orb', 'orb', 'oando-soft-seating', 'oando-soft-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_68a319f5dafd6cd106ec5943_orbit.jpg', 'Orb collaborative seating for teamwork and shared spaces. Discover modern office seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a319f94efd22af34df6e61_orbit_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Orb collaborative seating for teamwork and shared spaces. Discover modern office seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Tectara', 'tectara', 'oando-soft-seating', 'oando-soft-seating', '', 'Tectara office workstations for efficient layouts. Discover modular workspace solutions for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Tectara office workstations for efficient layouts. Discover modular workspace solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Velto', 'velto', 'oando-soft-seating', 'oando-soft-seating', '', 'Velto ergonomic office chairs for posture support and productivity. Discover seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Velto ergonomic office chairs for posture support and productivity. Discover seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Cocoon', 'cocoon', 'oando-soft-seating', 'oando-soft-seating', '', 'Cocoon acoustic lounge chair wrapping you in comfort and focus. A high-back shell design ideal for breakout zones and informal meetings.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Cocoon acoustic seating for privacy and focus. Discover modern pod seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Moon', 'moon', 'oando-soft-seating', 'oando-soft-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_694bc1c696a177177806618c_moonlight_1.jpg', 'Moon lounge seating for waiting areas and relaxed office spaces. Discover soft seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_694bc1cb4c86a76f8dfce0e1_moonlight_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Moon lounge seating for waiting areas and relaxed office spaces. Discover soft seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Cone', 'cone', 'oando-soft-seating', 'oando-soft-seating', '', 'Cone office seating for modern interiors. Discover stylish and comfortable chairs for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Cone office seating for modern interiors. Discover stylish and comfortable chairs for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Rattique', 'rattique', 'oando-soft-seating', 'oando-soft-seating', '', 'Rattique designer office seating for comfort and contemporary appeal. Discover stylish seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Rattique designer office seating for comfort and contemporary appeal. Discover stylish seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Cove', 'cove', 'oando-soft-seating', 'oando-soft-seating', '', 'Cove lounge seating for waiting areas and offices. Discover modern soft seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Cove lounge seating for waiting areas and offices. Discover modern soft seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Luxar', 'luxar', 'oando-soft-seating', 'oando-soft-seating', '', 'Luxar executive office chairs for premium comfort. Discover leadership seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Luxar executive office chairs for premium comfort. Discover leadership seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Ceda', 'ceda', 'oando-soft-seating', 'oando-soft-seating', '', 'Ceda executive office desk for leadership spaces. Discover premium workspace aesthetics for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Ceda executive office desk for leadership spaces. Discover premium workspace aesthetics for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Hush', 'hush', 'oando-soft-seating', 'oando-soft-seating', '', 'Hush acoustic office seating for privacy and focused workspaces. Explore seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Hush acoustic office seating for privacy and focused workspaces. Explore seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Eclips', 'eclips', 'oando-soft-seating', 'oando-soft-seating', '', 'Eclips executive office desk for premium workspaces. Explore durable design and modern aesthetics for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Eclips executive office desk for premium workspaces. Explore durable design and modern aesthetics for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Twig', 'twig', 'oando-soft-seating', 'oando-soft-seating', '', 'Twig office chairs for modern workspaces. Discover ergonomic seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Twig office chairs for modern workspaces. Discover ergonomic seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Margas', 'margas', 'oando-soft-seating', 'oando-soft-seating', '', 'Margas modular office furniture for flexible layouts and workspace efficiency. Explore modern solutions for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Margas modular office furniture for flexible layouts and workspace efficiency. Explore modern solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Lura', 'lura', 'oando-soft-seating', 'oando-soft-seating', '', 'Lura office seating solutions for comfort and modern workspace appeal. Explore seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Lura office seating solutions for comfort and modern workspace appeal. Explore seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Embrace', 'embrace', 'oando-soft-seating', 'oando-soft-seating', '', 'Embrace collaborative seating for teamwork and shared workspaces. Discover modern seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Embrace collaborative seating for teamwork and shared workspaces. Discover modern seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Halo', 'halo', 'oando-soft-seating', 'oando-soft-seating', '', 'Halo ergonomic office chairs for superior comfort and posture support. Explore productivity-focused seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Halo ergonomic office chairs for superior comfort and posture support. Explore productivity-focused seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Relax', 'relax', 'oando-soft-seating', 'oando-soft-seating', '', 'Relax lounge seating for waiting areas and informal office spaces. Explore soft seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Relax lounge seating for waiting areas and informal office spaces. Explore soft seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Arcana', 'arcana', 'oando-soft-seating', 'oando-soft-seating', '', 'Arcana premium office furniture for executive spaces. Explore modern design and long-lasting performance for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Arcana premium office furniture for executive spaces. Explore modern design and long-lasting performance for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Plumb', 'plumb', 'oando-soft-seating', 'oando-soft-seating', '', 'Plumb office furniture collection for modern design and functional workspaces. Explore solutions for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Plumb office furniture collection for modern design and functional workspaces. Explore solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Casca', 'casca', 'oando-soft-seating', 'oando-soft-seating', '', 'Casca designer office seating combining comfort and durability. Explore stylish chairs for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Casca designer office seating combining comfort and durability. Explore stylish chairs for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Adam', 'adam', 'oando-soft-seating', 'oando-soft-seating', '', 'Adam office seating for modern workspaces. Discover durable and comfortable chairs for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Adam office seating for modern workspaces. Discover durable and comfortable chairs for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Cozy', 'cozy', 'oando-soft-seating', 'oando-soft-seating', '', 'Cozy lounge seating for relaxed office spaces and waiting areas. Discover modern soft seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Cozy lounge seating for relaxed office spaces and waiting areas. Discover modern soft seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Covea', 'covea', 'oando-soft-seating', 'oando-soft-seating', '', 'Covea lounge and waiting seating for offices. Discover stylish and comfortable seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Covea lounge and waiting seating for offices. Discover stylish and comfortable seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"soft-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600 D600 H900-1000mm (adj.)","materials":["Solid wood or steel frame","High-density foam (40D)","Premium fabric or PU leather upholstery"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Myel', 'myel', 'oando-chairs', 'oando-chairs', '/assets/catalog/686d3b55385e7b905b01d3a5_68a5ea1e27650a56b2eca017_myel.jpg', 'A task chair for modern thinkers. MYEL combines weight-sensitive tilt and a dynamic backrest to provide effortless support throughout the workday.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a2e6c8d1f0c9ec3a36402e_myel_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Myel is a task chair that adapts to your movements. It features a weight-sensitive tilt mechanism that provides automatic tension based on the user''s weight.","features":["Weight-sensitive Tilt","Dynamic Backrest","Adjustable Armrests","Effortless Support"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, 50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"chairs","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, 50mm casters"],"features":["Weight-sensitive Tilt","Dynamic Backrest","Adjustable Armrests","Effortless Support"],"sustainability_score":5}'::jsonb, 'oando-chairs-series', 'Chair Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Sway', 'sway', 'oando-chairs', 'oando-chairs', '/assets/catalog/686d3b55385e7b905b01d3a5_68a5eab3fd8ab056401d2236_sway.jpg', 'Sway office chairs designed for posture support and comfort. Discover seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a2e6b469d0d522d9374f4e_sway_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Sway ergonomic mesh chairs designed for posture support and long-term comfort. Features a high mesh back with headrest and synchronous tilt mechanism.","features":["Adjustable Headrest","Synchronous Tilt","Ergonomic Lumbar Support"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, 50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"chairs","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, 50mm casters"],"features":["Adjustable Headrest","Synchronous Tilt","Ergonomic Lumbar Support"],"sustainability_score":5}'::jsonb, 'oando-chairs-series', 'Chair Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Halo', 'halo', 'oando-chairs', 'oando-chairs', '', 'Halo ergonomic mesh chair with a wide headrest and supportive shell design. Engineered for daily productivity and style.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Halo ergonomic mesh chair featuring a distinctive wide headrest and a robust frame for maximum support throughout the workday.","features":["Wide Headrest","Supportive Shell Design","Premium Mesh Breathability"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, 50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"chairs","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, 50mm casters"],"features":["Wide Headrest","Supportive Shell Design","Premium Mesh Breathability"],"sustainability_score":5}'::jsonb, 'oando-chairs-series', 'Chair Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Arvo', 'arvo', 'oando-chairs', 'oando-chairs', '/assets/catalog/686d3b55385e7b905b01d3a5_6925776c61a4fc592515c2e5_arvo_1.jpg', 'Arvo modern office chairs for comfort and sleek workspace design. Discover seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_6925777061a4fc592515c69c_arvo_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Arvo modern office chairs for comfort and sleek workspace design. Discover seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, 50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"chairs","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, 50mm casters"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-chairs-series', 'Chair Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Fluid X', 'fluid-x', 'oando-chairs', 'oando-chairs', '/assets/catalog/686d3b55385e7b905b01d3a5_689e5fb9a9c228d092378d58_image_(4).png', 'Fluid-X ergonomic office chair for posture support and comfort. Discover modern seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a2e6541579aa1f426713a8_fluid_x_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Fluid X takes the ergonomic excellence of Fluid and adds a dedicated headrest for enhanced neck and upper back support.","features":["Adjustable Headrest","High Mesh Back","Superior Back Support"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, 50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"chairs","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, 50mm casters"],"features":["Adjustable Headrest","High Mesh Back","Superior Back Support"],"sustainability_score":5}'::jsonb, 'oando-chairs-series', 'Chair Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Sleek Cafe', 'cafe-sleek', 'oando-other-seating', 'oando-other-seating', '', 'Sleek Cafe cafeteria chair for dining spaces and informal meeting zones.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Sleek Cafe cafeteria chair for dining spaces and informal meeting zones, designed for durability and ease of maintenance.","features":["Stackable Design","Lightweight","Durable Finish"],"dimensions":"W520 D540 H800mm","materials":["Polypropylene shell","Chromed steel legs"]}'::jsonb, '{"source":"oando.co.in","category":"other-seating","subcategory":"Cafe Chair","isStackable":true,"bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W520 D540 H800mm","materials":["Polypropylene shell","Chromed steel legs"],"features":["Stackable Design","Lightweight","Durable Finish"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Flip', 'flip', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_6899a8d08871a2e0d561e8c1_image_(2).png', 'Flip training chair with optional tablet arm, designed for agility and comfort in learning environments.', ARRAY['/assets/catalog/assets_placeholder.60f9b1840c.svg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Flip training chair with optional tablet arm, designed for agility and comfort in flexible learning and meeting environments. Mobile and nestable for easy storage.","features":["Nesting Capability","Optional Tablet Arm","Agile Design"],"dimensions":"W600D600H9001000mm","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, 50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"other-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, 50mm casters"],"features":["Nesting Capability","Optional Tablet Arm","Agile Design"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Crox', 'crox', 'oando-other-seating', 'oando-other-seating', '', 'Crox visitor and cafe chair, offering a comfortable and versatile seating solution.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Crox visitor and cafe chair, offering a comfortable and versatile seating solution for receptions, lounges, and waiting areas.","features":["Ergonomic Back","Compact Footprint","Modern Aesthetic"],"dimensions":"W550 D560 H810mm","materials":["Molded shell","Steel tube base"]}'::jsonb, '{"source":"oando.co.in","category":"other-seating","subcategory":"Visitor Chair","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W550 D560 H810mm","materials":["Molded shell","Steel tube base"],"features":["Ergonomic Back","Compact Footprint","Modern Aesthetic"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Nordic', 'nordic', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_68a31b13bfe5e60313f47ce4_nordic_1.jpg', 'Nordic wooden frame visitor chair inspired by Scandinavian minimalism.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a31b177c1f6e1027de894f_nordic_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Nordic wooden frame visitor chair inspired by Scandinavian minimalism. Perfect for breakout zones and professional guest seating.","features":["Wooden Frame","Minimalist Aesthetic","Comfortable Shell Design"],"dimensions":"W600D600H9001000mm","materials":["Wooden frame","Fabric upholstery"]}'::jsonb, '{"source":"oando.co.in","category":"other-seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm","materials":["Wooden frame","Fabric upholstery"],"features":["Wooden Frame","Minimalist Aesthetic","Comfortable Shell Design"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Flex', 'flex', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_689e6149bc6ce0dfcc87218c_image_(7).png', 'Flex office furniture for adaptable workspaces. Discover modular desks and seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a2e5f9ae1623fcafd8f52a_flex_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Flex office furniture for adaptable workspaces. Features a minimalist design with a black frame and a slim mesh backrest for agile teams.","features":["Minimalist Design","Slim Mesh Backrest","Adaptable Support"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Minimalist Design","Slim Mesh Backrest","Adaptable Support"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Canaret', 'canaret', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_68a31c938f8548f856a7f6a1_canaret_1.jpg', 'Canaret office seating for comfort and contemporary interiors. Explore quality chairs for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a31c96d894469092d7693c_canaret_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Canaret office seating for comfort and contemporary interiors. Explore quality chairs for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Logica', 'logica', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_689e6183b6b2ad870cbb12d5_image_(8).png', 'Logica modular workstations for modern offices. Discover flexible layouts for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a2e5dabb1b4a667224668c_logica_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Logica modular workstations for modern offices. Discover flexible layouts for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Sullion', 'sullion', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_68a3187ab4a82e5395e600e1_sullion.jpg', 'Sullion office seating for modern interiors. Discover comfortable chairs for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a3187fadfc2439348d8514_sullion_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Sullion executive seating offering refined comfort and modern appeal for professional leadership spaces.","features":["Executive Appeal","Premium Comfort","Modern Interior Compatibility"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Executive Appeal","Premium Comfort","Modern Interior Compatibility"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Dive', 'dive', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_68a31cc1478c76ab43d196ef_dive_1.jpg', 'Dive collaborative seating for teamwork and shared spaces. Discover modern office seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a31cc53600e311453077bb_dive_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Dive collaborative seating for teamwork and shared spaces. Discover modern office seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Nuvic', 'nuvic', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_68a318cdbbc6bed952aadb99_nuvic.jpg', 'Nuvic office chairs designed for comfort and posture support. Discover seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a318d3d9ec04942e25c33e_nuvic_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Nuvic office chairs feature a clean white frame and mesh back designed for maximum breathability and posture support.","features":["Clean White Frame","Breathable Mesh","Lumbar Support"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Clean White Frame","Breathable Mesh","Lumbar Support"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Wing', 'wing', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_68a31cf0d7ec67119f64d16d_wing_1.jpg', 'Wing ergonomic office chairs for posture support and daily comfort. Explore modern seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a31cf31ae614368cd23141_wing_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Wing ergonomic office chairs for posture support and daily comfort. Explore modern seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Rock', 'rock', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_68a31900c133220d935bc837_rock.jpg', 'Rock office chairs for durability and comfort. Discover ergonomic seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a319051c705d568f054edd_rock_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Rock office chairs for durability and comfort. Discover ergonomic seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Casca', 'casca', 'oando-other-seating', 'oando-other-seating', '', 'Casca provides a sleek and modern seating solution with a focus on clean lines and ergonomic comfort for dynamic workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Casca is designed for the modern workspace, combining a minimalist aesthetic with high-performance ergonomic features.","features":["Minimalist Design","High-performance Mesh","Durable Frame"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Minimalist Design","High-performance Mesh","Durable Frame"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Breeze', 'breeze', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_68a3193d56916b83fc69b8e7_breeze.jpg', 'Breeze office chairs for modern workspaces. Discover breathable ergonomic seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a31942172e85cd6ddd61e5_breeze_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Breeze ergonomic chairs offer maximum airflow through advanced mesh technology, ensuring comfort during long work sessions.","features":["Advanced Breathability","High Mesh Back","Ergonomic Base"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Advanced Breathability","High Mesh Back","Ergonomic Base"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Leaf', 'leaf', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_68a31d2456916b83fc6b424c_leaf_1.jpg', 'Leaf collaborative seating for teamwork and shared workspaces. Discover modern seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a31d2741014346c6585d9d_leaf_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Leaf collaborative seating for teamwork and shared workspaces. Discover modern seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('X Mesh', 'x-mesh', 'oando-other-seating', 'oando-other-seating', '', 'X-Mesh ergonomic office chair for breathability and comfort. Discover seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"X-Mesh provides targeted lumbar support and breathable mesh for an exceptionally comfortable and cool sitting experience.","features":["Targeted Lumbar Support","Cool Mesh Technology","Dynamic Tension Adjustment"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Targeted Lumbar Support","Cool Mesh Technology","Dynamic Tension Adjustment"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Lexus', 'lexus', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_692aeb4277a173215bea0157_lexus_1.jpg', 'Lexus executive office chairs for premium comfort and durability. Explore seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_692aeb4707459fa95409abb2_lexus_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Lexus executive office chairs for premium comfort and durability. Explore seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Orbit', 'orbit', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_68a319f5dafd6cd106ec5943_orbit.jpg', 'Orbit office chairs designed for posture support and comfort. Discover seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a319f94efd22af34df6e61_orbit_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Orbit office chairs provide full-body support with a design focused on posture and effortless movement within the workspace.","features":["Posture Focus","Effortless Movement","Robust Build"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Posture Focus","Effortless Movement","Robust Build"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Flare', 'flare', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_68a31d89957f8dd43671be6d_flare_1.jpg', 'Flare designer office seating combining comfort and modern style. Explore seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a31d8c1b8d8744c7be292e_flare_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Flare designer office seating combining comfort and modern style. Explore seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Toro', 'toro', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_68a31a2e940b87db21c355cf_toro.jpg', 'Toro office chairs for durability and comfort. Discover ergonomic seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a31a31b454908c4aaf87de_toro_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Toro features a robust frame and high-quality mesh for durable, ergonomic support that stands up to daily use in busy offices.","features":["Robust Frame","High-Quality Mesh","Daily Productivity Support"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Robust Frame","High-Quality Mesh","Daily Productivity Support"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Zilo', 'zilo', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_68a31db490f077faa2376637_zilo_1.jpg', 'Zilo modern office furniture for flexible and stylish workspaces. Explore solutions for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a31db7a0f7151158d75a52_zilo_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Zilo modern office furniture for flexible and stylish workspaces. Explore solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Caneva-High', 'caneva-high', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_692af83816126cc8ec1b69b6_caneva_h_1.jpg', 'Caneva high-back office chairs for executive comfort and ergonomic support. Discover seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_692af717336420a74d899c14_caneva_h_2.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Caneva high-back office chairs for executive comfort and ergonomic support. Discover seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Lisbo', 'lisbo', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_68a31eb7223f7db62e3d5a4f_lisbo.jpg', 'Lisbo lounge seating for relaxed office spaces and modern interiors. Explore soft seating for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a31eb7223f7db62e3d5a4f_lisbo.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Lisbo lounge seating for relaxed office spaces and modern interiors. Explore soft seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Fusion', 'fusion', 'oando-other-seating', 'oando-other-seating', '/assets/catalog/686d3b55385e7b905b01d3a5_68a31eefb54dafe0b542c697_fusion.jpg', 'Fusion modular office furniture for flexible layouts and efficient workspace planning. Discover solutions for modern workspaces.', ARRAY['/assets/catalog/686d3b55385e7b905b01d3a5_68a31eefb54dafe0b542c697_fusion.jpg'], '[{"id":"standard","variantName":"Standard Model","galleryImages":[]}]'::jsonb, '{"overview":"Fusion modular office furniture for flexible layouts and efficient workspace planning. Discover solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"]}'::jsonb, '{"source":"oando.co.in","category":"seating","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D600H9001000mm (seat height adj. via gas lift)","materials":["Mesh or fabric back","Moulded foam seat, polyester cover","Nylon 5-star base, �50mm casters"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-other-seating-series', 'Other Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Performer', 'performer', 'oando-educational', 'oando-educational', '/assets/catalog/products/imported/adam/image-1.webp', 'Performer office chair designed for comfort, durability, and daily productivity. Discover modern ergonomic seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":["/assets/catalog/products/imported/accent/image-1.webp"]}]'::jsonb, '{"overview":"Performer office chair designed for comfort, durability, and daily productivity. Discover modern ergonomic seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"]}'::jsonb, '{"source":"oando.co.in","category":"educational","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-educational-series', 'Educational Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Connecta', 'connecta', 'oando-educational', 'oando-educational', '/assets/catalog/products/imported/arcana/image-1.webp', 'Connecta collaborative office furniture for teamwork and shared spaces. Discover solutions for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":["/assets/catalog/products/imported/accent/image-1.webp"]}]'::jsonb, '{"overview":"Connecta collaborative office furniture for teamwork and shared spaces. Discover solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"]}'::jsonb, '{"source":"oando.co.in","category":"educational","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-educational-series', 'Educational Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Wooden Bed', 'wooden-bed', 'oando-educational', 'oando-educational', '/assets/catalog/products/imported/crossa/image-1.webp', 'Wooden beds for institutional and staff accommodation. Discover durable furniture for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":["/assets/catalog/products/imported/accent/image-1.webp"]}]'::jsonb, '{"overview":"Wooden beds for institutional and staff accommodation. Discover durable furniture for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"]}'::jsonb, '{"source":"oando.co.in","category":"educational","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-educational-series', 'Educational Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Audi Chair', 'audi-chair', 'oando-educational', 'oando-educational', '/assets/catalog/products/imported/lab-furniture/image-1.webp', 'Audi ergonomic office chair designed for posture support and comfort. Discover modern seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":["/assets/catalog/products/imported/accent/image-1.webp"]}]'::jsonb, '{"overview":"Audi ergonomic office chair designed for posture support and comfort. Discover modern seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"]}'::jsonb, '{"source":"oando.co.in","category":"educational","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-educational-series', 'Educational Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Xplorer', 'xplorer', 'oando-educational', 'oando-educational', '/assets/catalog/products/imported/adam/image-1.webp', 'Xplorer office workstations for modern offices. Discover modular layouts and efficient workspace solutions for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":["/assets/catalog/products/imported/accent/image-1.webp"]}]'::jsonb, '{"overview":"Xplorer office workstations for modern offices. Discover modular layouts and efficient workspace solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"]}'::jsonb, '{"source":"oando.co.in","category":"educational","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-educational-series', 'Educational Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Forma', 'forma', 'oando-educational', 'oando-educational', '/assets/catalog/products/imported/arcana/image-1.webp', 'Forma modular office furniture for flexible layouts and workspace efficiency. Discover solutions for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":["/assets/catalog/products/imported/accent/image-1.webp"]}]'::jsonb, '{"overview":"Forma modular office furniture for flexible layouts and workspace efficiency. Discover solutions for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"]}'::jsonb, '{"source":"oando.co.in","category":"educational","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-educational-series', 'Educational Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Metal Bed', 'metal-bed', 'oando-educational', 'oando-educational', '/assets/catalog/products/imported/adam/image-1.webp', 'Metal beds for hostels and institutions. Discover durable accommodation furniture for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":["/assets/catalog/products/imported/accent/image-1.webp"]}]'::jsonb, '{"overview":"Metal beds for hostels and institutions. Discover durable accommodation furniture for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"]}'::jsonb, '{"source":"oando.co.in","category":"educational","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-educational-series', 'Educational Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Podium', 'podium', 'oando-educational', 'oando-educational', '/assets/catalog/products/imported/arcana/image-1.webp', 'Office podium furniture for presentations and meetings. Discover durable and modern podium designs for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":["/assets/catalog/products/imported/accent/image-1.webp"]}]'::jsonb, '{"overview":"Office podium furniture for presentations and meetings. Discover durable and modern podium designs for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"]}'::jsonb, '{"source":"oando.co.in","category":"educational","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-educational-series', 'Educational Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Academia', 'academia', 'oando-educational', 'oando-educational', '/assets/catalog/products/imported/crossa/image-1.webp', 'Academia educational furniture for schools and colleges. Discover durable desks and seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":["/assets/catalog/products/imported/accent/image-1.webp"]}]'::jsonb, '{"overview":"Academia educational furniture for schools and colleges. Discover durable desks and seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"]}'::jsonb, '{"source":"oando.co.in","category":"educational","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-educational-series', 'Educational Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Magazine Rack', 'magazine-rack', 'oando-educational', 'oando-educational', '/assets/catalog/products/imported/lab-furniture/image-1.webp', 'Office magazine racks and display units for organized reception areas. Discover storage for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":["/assets/catalog/products/imported/accent/image-1.webp"]}]'::jsonb, '{"overview":"Office magazine racks and display units for organized reception areas. Discover storage for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"]}'::jsonb, '{"source":"oando.co.in","category":"educational","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-educational-series', 'Educational Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Classcraft', 'classcraft', 'oando-educational', 'oando-educational', '/assets/catalog/products/imported/adam/image-1.webp', 'Classcraft classroom furniture for schools and institutes. Discover desks and seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":["/assets/catalog/products/imported/accent/image-1.webp"]}]'::jsonb, '{"overview":"Classcraft classroom furniture for schools and institutes. Discover desks and seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"]}'::jsonb, '{"source":"oando.co.in","category":"educational","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-educational-series', 'Educational Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Learnix', 'learnix', 'oando-educational', 'oando-educational', '/assets/catalog/products/imported/arcana/image-1.webp', 'Learnix classroom furniture for modern learning spaces. Discover desks and seating for modern workspaces.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":["/assets/catalog/products/imported/accent/image-1.webp"]}]'::jsonb, '{"overview":"Learnix classroom furniture for modern learning spaces. Discover desks and seating for modern workspaces.","features":["Manufacturing","Sustainability"],"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"]}'::jsonb, '{"source":"oando.co.in","category":"educational","bifmaCertified":true,"warrantyYears":5}'::jsonb, '{"dimensions":"W600D500H720900mm","materials":["Steel frame, epoxy-coated","Plywood seat & back","Rubber feet, stackable"],"features":["Manufacturing","Sustainability"],"sustainability_score":5}'::jsonb, 'oando-educational-series', 'Educational Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Solace Pod', 'solace-pod', 'oando-collaborative', 'oando-collaborative', '/assets/catalog/products/imported/pod/image-2.webp', 'Solace Pod — an acoustic privacy pod designed for teams needing focused conversation space in open offices. High curved back provides noise dampening without full enclosure.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":["/assets/catalog/products/softseating-solace-1.webp","/assets/catalog/products/softseating-solace-2.webp"]}]'::jsonb, '{"overview":"Solace Lounge provides comfortable seating for collaborative workspaces, perfect for informal discussions and team meetings.","features":["Ergonomic Design","Modular Configuration","Premium Upholstery","Easy Maintenance"],"dimensions":"Multiple configurations available","materials":["High-density foam","Premium fabric","Sturdy frame construction"]}'::jsonb, '{"source":"oando.co.in","category":"collaborative","bifmaCertified":true,"warrantyYears":5,"tags":["collaborative","soft-seating","lounge"]}'::jsonb, '{"dimensions":"Multiple configurations available","materials":["High-density foam","Premium fabric","Sturdy frame construction"],"features":["Ergonomic Design","Modular Configuration","Premium Upholstery","Easy Maintenance"],"sustainability_score":5}'::jsonb, 'oando-collaborative-series', 'Collaborative Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Cocoon Pod', 'cocoon-pod', 'oando-collaborative', 'oando-collaborative', '/assets/catalog/products/imported/pod/image-11.webp', 'Cocoon Pod provides full acoustic enclosure with integrated USB charging, ideal for private calls and focused deep work in collaborative office environments.', ARRAY[]::text[], '[{"id":"standard","variantName":"Standard Model","galleryImages":["/assets/catalog/products/softseating-solace-1.webp"]}]'::jsonb, '{"overview":"Cocoon seating provides privacy and comfort for focused collaborative work in open office environments.","features":["Sound Absorbing","Privacy Panels","Integrated Power","Modular Design"],"dimensions":"Standard pod configuration","materials":["Acoustic panels","Premium upholstery","Integrated technology"]}'::jsonb, '{"source":"oando.co.in","category":"collaborative","bifmaCertified":true,"warrantyYears":5,"tags":["collaborative","privacy","pods"]}'::jsonb, '{"dimensions":"Standard pod configuration","materials":["Acoustic panels","Premium upholstery","Integrated technology"],"features":["Sound Absorbing","Privacy Panels","Integrated Power","Modular Design"],"sustainability_score":5}'::jsonb, 'oando-collaborative-series', 'Collaborative Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Cafeteria Seating', 'cafeteria-seating', 'cafe', 'cafe', '/assets/catalog/products/chair-cafeteria.webp', 'Vibrant and durable seating for cafeterias and breakout zones. Easy to clean and stackable.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"₹4,500","tags":["classy-series"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Stackable","Easy Clean","Vibrant Colors","Durable"],"material":"Polypropylene"}'::jsonb, 'cafe-series', 'Cafe Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('DeskPro System', 'deskpro-system', 'workstations', 'workstations', '/assets/catalog/products/deskpro-workstation-1.webp', 'A highly modular workstation system designed for productivity. Integrated cable management and privacy screens.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"₹25,000 per seat","tags":["linear-workstation","myel-executive-chair"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Modular","Cable Management","Privacy Screen","Customizable Colors"],"table top":"25mm PLPB","legs":"Powder Coated"}'::jsonb, 'workstations-series', 'Workstations Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Linear Workstation', 'linear-workstation', 'workstations', 'workstations', '/assets/catalog/products/linear-workstation-1.webp', 'Clean lines and open design. The Linear Workstation is perfect for modern, collaborative offices.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"₹22,000 per seat","tags":["deskpro-system"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Linear Layout","Shared Legs","Cost Effective"],"width":"1200mm per seat"}'::jsonb, 'workstations-series', 'Workstations Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('60x30 Modular System', '60x30-modular', 'workstations', 'workstations', '/assets/catalog/products/60x30-workstation-1.webp', 'A robust partitioning system based on 60mm and 30mm profiles. Ideal for creating cubicles and semi-private spaces.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["tcs-workspace"]}'::jsonb, '{"dimensions":"","materials":[],"features":["High Partition","Glass Options","Pinup Boards","Raceways"],"thouckness":"60mm"}'::jsonb, 'workstations-series', 'Workstations Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('TCS Workspace', 'tcs-workspace', 'workstations', 'workstations', '/assets/catalog/products/tcs-workspace-1.webp', 'A custom-designed workspace solution tailored for large corporate requirements.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["honda-office"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Custom Dimensions","Corporate Branding","Heavy Duty"],"usage":"IT / Corporate"}'::jsonb, 'workstations-series', 'Workstations Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Honda Office Setup', 'honda-office', 'workstations', 'workstations', '/assets/catalog/products/honda-office-1.webp', 'Premium office setup showcasing our capabilities in delivering large-scale infrastructure projects.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["deskpro-system"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Turnkey Solution","Premium Finishes"],"client":"Honda"}'::jsonb, 'workstations-series', 'Workstations Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Executive Meeting Table', 'executive-meeting-table', 'meeting-tables', 'meeting-tables', '/assets/catalog/products/meeting-table-10pax.webp', 'A grand meeting table for the boardroom. Features power connectivity and a premium finish.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"₹1,50,000","tags":["compact-meeting-table"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Power Box","Wire Manager","Premium Veneer","10-12 Seater"],"size":"3000 x 1200 mm"}'::jsonb, 'meeting-tables-series', 'Meeting Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Compact Meeting Table', 'compact-meeting-table', 'meeting-tables', 'meeting-tables', '/assets/catalog/products/meeting-table-6pax.webp', 'A round or square meeting table for huddle rooms and small discussions.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"₹45,000","tags":["executive-meeting-table"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Compact","Stable Base","Modern Look"],"seating":"4-6 Pax"}'::jsonb, 'meeting-tables-series', 'Meeting Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Conference Video Setup', 'conference-setup', 'meeting-tables', 'meeting-tables', '/assets/catalog/products/meeting table top render.webp', 'Specialized table designed for video conferencing, ensuring everyone is visible.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["executive-meeting-table"]}'::jsonb, '{"dimensions":"","materials":[],"features":["V-Shape","Integrated Tech","Acoustics"],"type":"Video Conference"}'::jsonb, 'meeting-tables-series', 'Meeting Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Solace Lounge', 'solace-lounge-chair', 'soft-seating', 'soft-seating', '/assets/catalog/products/solace-chair-1.webp', 'Crafted calm. A plush soft seating collection designed for lobbies and collaborative breakout zones.', ARRAY['/assets/catalog/products/softseating-solace-1.webp'], '[]'::jsonb, '{}'::jsonb, '{"price":"₹85,000","tags":["myel-executive-chair"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Premium Upholstery","Acoustic Comfort","Modular"],"configuration":"Lounge"}'::jsonb, 'soft-seating-series', 'Soft Seating Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Cabin Drawer Unit', 'cabin-drawer', 'storage', 'storage', '/assets/catalog/products/cabin drawer close up render.webp', 'Essential mobile pedestal for under-desk storage. Lockable and durable.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"₹8,500","tags":["office-storage"]}'::jsonb, '{"dimensions":"","materials":[],"features":["3 Drawers","Central Lock","Castors"],"material":"Metal / Laminate"}'::jsonb, 'storage-series', 'Storage Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Office Storage System', 'office-storage', 'storage', 'storage', '/assets/catalog/products/cabin electrical render .webp', 'Full-height storage units and filing cabinets to keep your office organized.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"₹25,000","tags":["cabin-drawer"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Adjustable Shelves","Lockable","Modular"],"height":"2100mm"}'::jsonb, 'storage-series', 'Storage Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Nuvora Pod', 'nuvora-pod', 'others', 'others', '/assets/catalog/products/nuvora-pod-1.webp', 'A private acoustic pod for focused work or phone calls. Soundproof and ventilated.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"₹3,50,000","tags":["nuvora-pod-2"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Soundproof","Ventilation","Lighting","Power Socket"],"size":"1 Pax"}'::jsonb, 'others-series', 'Others Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Nuvora Pod 2', 'nuvora-pod-2', 'others', 'others', '/assets/catalog/products/nuvora-pod-2.webp', 'Larger acoustic pod variations.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["nuvora-pod"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Soundproof","Ventilation"],"variant":"Model 2"}'::jsonb, 'others-series', 'Others Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Nuvora Pod 3', 'nuvora-pod-3', 'others', 'others', '/assets/catalog/products/nuvora-pod-3.webp', 'Larger acoustic pod variations.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["nuvora-pod"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Soundproof","Ventilation"],"variant":"Model 3"}'::jsonb, 'others-series', 'Others Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Paper Tray', 'paper-tray', 'others', 'others', '/products/dauble paper tray.jpg', 'Desk accessory for organizing documents.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"₹1,500","tags":["deskpro-system"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Double Tray","Stackable"],"material":"Plastic/Mesh"}'::jsonb, 'others-series', 'Others Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('DMRC Office', 'project-dmrc', 'projects', 'projects', '/assets/marketing/projects/DMRC/dmrc-facility.webp', 'Office setup for Delhi Metro Rail Corporation.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"Project","tags":[]}'::jsonb, '{"dimensions":"","materials":[],"features":["Large Scale","Government"],"location":"Delhi"}'::jsonb, 'projects-series', 'Projects Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Titan Corporate', 'project-titan', 'projects', 'projects', '/assets/marketing/projects/Titan/snapedit_1688104539759_edited.webp', 'Corporate office for Titan.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"Project","tags":[]}'::jsonb, '{"dimensions":"","materials":[],"features":["Corporate","Workstations"],"location":"Bangalore"}'::jsonb, 'projects-series', 'Projects Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Usha International', 'project-usha', 'projects', 'projects', '/assets/marketing/projects/Usha/DSC_0077_edited_edited.webp', 'Office interior for Usha International.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"Project","tags":[]}'::jsonb, '{"dimensions":"","materials":[],"features":["Corporate","Design"],"location":"New Delhi"}'::jsonb, 'projects-series', 'Projects Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Abdul Hai Office', 'project-abdul-hai', 'projects', 'projects', '/assets/marketing/projects/abdul-hai/IMG_20191114_130520.webp', 'Private office setup.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"Project","tags":[]}'::jsonb, '{"dimensions":"","materials":[],"features":["Private","Luxury"],"type":"Private Office"}'::jsonb, 'projects-series', 'Projects Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Curvivo', 'curvivo-workstation', 'workstations', 'workstations', '/assets/catalog/products/imported/cabin/image-1.webp', 'A dynamic and innovative workstation that is adaptable to different workspaces. Curvivo office solution for enhanced efficiency, embracing fluidity and harmony.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["deskpro-system"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Enhanced Efficiency","Fluid Design","Collaborative"],"material":"Premium Laminate"}'::jsonb, 'workstations-series', 'Workstations Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Sleek', 'sleek-workstation', 'workstations', 'workstations', '/assets/catalog/products/linear-workstation-1.webp', 'Minimalist design implementation for maximum focus. The Sleek system disappears into the room.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["linear-workstation"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Minimalist","Hidden Cable Tray","Slim Profile"],"legs":"Aluminum Profile"}'::jsonb, 'workstations-series', 'Workstations Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Adaptable', 'adaptable-system', 'workstations', 'workstations', '/assets/catalog/products/60x30-workstation-1.webp', 'A future-proof workstation system that grows with your team. Reconfigurable and robust.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["60x30-modular"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Future Proof","Reconfigurable","Heavy Duty"],"load":"Tested for 150kg"}'::jsonb, 'workstations-series', 'Workstations Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Halo', 'halo-chair', 'chairs', 'chairs', '/assets/catalog/products/imported/halo/image-1.webp', 'Halo ergonomic mesh chair with a wide headrest and supportive shell design. Engineered for daily productivity and style.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["arvo-chair"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Wide Headrest","Supportive Shell Design","Premium Mesh Breathability"],"mechanism":"Synchronous Tilt"}'::jsonb, 'chairs-series', 'Chairs Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Arvo', 'arvo-chair', 'chairs', 'chairs', '/assets/catalog/products/chair-mesh-office.webp', 'Precision engineering meets ergonomic excellence. Arvo is built for long work sessions.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["snap-chair"]}'::jsonb, '{"dimensions":"","materials":[],"features":["High Back","Headrest","4D Armrests"],"base":"Chrome Star Base"}'::jsonb, 'chairs-series', 'Chairs Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Myel', 'myel-chair', 'chairs', 'chairs', '/assets/catalog/products/imported/myel/with-headrest/image-1.webp', 'A task chair for modern thinkers. MYEL combines weight-sensitive tilt and a dynamic backrest for effortless support.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["phoenix-chair"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Weight-sensitive Tilt","Dynamic Backrest","Adjustable Armrests"],"material":"Breathable Mesh"}'::jsonb, 'chairs-series', 'Chairs Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Phoenix', 'phoenix-chair', 'chairs', 'chairs', '/assets/catalog/products/imported/phoenix/image-1.webp', 'Phoenix ergonomic chair designed for durability and comprehensive support. Includes a wide headrest and white frame.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["pinnacle-chair"]}'::jsonb, '{"dimensions":"","materials":[],"features":["White Modern Frame","Advanced Ergonomics","Tilt Lock"],"base":"Aluminum / Nylon"}'::jsonb, 'chairs-series', 'Chairs Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Solace', 'solace-chair', 'chairs', 'chairs', '/assets/catalog/products/imported/solace/image-1.webp', 'Solace ergonomic office chair designed for superior posture support and daily comfort.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["nordic-chair"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Lumbar Support","Mesh Back","Ergonomic Design"],"type":"Task Chair"}'::jsonb, 'chairs-series', 'Chairs Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Nordic', 'nordic-chair', 'chairs', 'chairs', '/assets/catalog/products/chair-cafeteria.webp', 'Scandanavian inspired minimalism. Perfect for breakout zones and casual meetings.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["ember-chair"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Wooden Legs","Shell Design","Minimalist"],"style":"Nordic"}'::jsonb, 'chairs-series', 'Chairs Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Sway', 'sway-chair', 'chairs', 'chairs', '/assets/catalog/products/imported/sway/image-1.webp', 'Sway ergonomic mesh chairs designed for posture support and long-term comfort with high mesh back.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["halo-chair"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Adjustable Headrest","Synchronous Tilt","Lumbar Support"],"mechanism":"Synchronous"}'::jsonb, 'chairs-series', 'Chairs Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Exquisite', 'exquisite-table', 'meeting-tables', 'meeting-tables', '/assets/catalog/products/imported/cabin/image-1.webp', 'Exquisite blends refined craftsmanship with modern authority. It uses premium veneers and precise detailing to create a bold presence.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["collaborate-table"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Premium Veneer","Built-in Connectivity","Refined Craftsmanship"],"finish":"Walnut / Oak"}'::jsonb, 'meeting-tables-series', 'Meeting Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

INSERT INTO products (name, slug, category, category_id, flagship_image, description, scene_images, variants, detailed_info, metadata, specs, series_id, series_name) 
VALUES ('Collaborate', 'collaborate-table', 'meeting-tables', 'meeting-tables', '/assets/catalog/products/meeting-table-6pax.webp', 'Designed for teamwork. The Collaborate table brings people together effortlessly.', ARRAY[]::text[], '[]'::jsonb, '{}'::jsonb, '{"price":"PO A","tags":["exquisite-table"]}'::jsonb, '{"dimensions":"","materials":[],"features":["Cable Management","Durable Top","Various Sizes"],"shape":"Rectangular / Racetrack"}'::jsonb, 'meeting-tables-series', 'Meeting Tables Series') 
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    category_id = EXCLUDED.category_id,
    flagship_image = EXCLUDED.flagship_image,
    description = EXCLUDED.description,
    scene_images = EXCLUDED.scene_images,
    variants = EXCLUDED.variants,
    detailed_info = EXCLUDED.detailed_info,
    metadata = EXCLUDED.metadata,
    specs = EXCLUDED.specs,
    series_id = EXCLUDED.series_id,
    series_name = EXCLUDED.series_name;

