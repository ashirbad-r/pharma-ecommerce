INSERT INTO categories (name, slug, description, is_active) 
VALUES ('Keva Wellness', 'keva-wellness', 'Premium Ayurvedic Wellness Products', true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO products (category_id, name, slug, description, base_price, selling_price, stock_quantity, is_active, requires_prescription)
SELECT (SELECT id FROM categories WHERE name = 'Keva Wellness' LIMIT 1), name, LOWER(REPLACE(name, ' ', '-')), description, base_price, selling_price, stock_quantity, is_active, requires_prescription
FROM (VALUES
('Moringa Plus Capsule 120 Cap', 'Eye health and antioxidant support', 600.00, 1199.00, 20, true, false),
('Bone Health Tablets 60 Tab', 'Bone mineral density support', 600.00, 1199.00, 20, true, false),
('Power Plus Tablets 60 Tab', 'Energy and vitality', 600.00, 1199.00, 20, true, false),
('Heart Care Tablets 60 Tab', 'Cardiac health support', 600.00, 1199.00, 20, true, false),
('Omega 3 Soft Gel 60 Gel', 'Heart health support', 600.00, 1199.00, 20, true, false),
('Diabafit Capsule 60 Cap', 'Blood sugar management', 600.00, 1199.00, 20, true, true),
('Glucosamine Plus Tablets 60 Tab', 'Joint health support', 600.00, 1199.00, 20, true, false),
('Ganoderma Plus Tablets 60 Tab', 'Immunity support', 600.00, 1199.00, 20, true, false),
('Chlorophyll Tablets 60 Tab', 'Blood cleansing', 600.00, 1199.00, 20, true, false),
('Immunorich Capsules 90 Cap', 'Immune system support', 600.00, 1199.00, 20, true, false)
) AS t(name, description, base_price, selling_price, stock_quantity, is_active, requires_prescription)
ON CONFLICT DO NOTHING;
