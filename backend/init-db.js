async function initializeDatabase(pool) {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM products');
    
    if (result.rows[0].count == 0) {
      console.log('🌱 Seeding database with products...');
      
      const sql = `
        INSERT INTO categories (name, slug, description, is_active) 
        VALUES ('Keva Wellness', 'keva-wellness', 'Premium Ayurvedic Wellness Products', true)
        ON CONFLICT (name) DO NOTHING;

        INSERT INTO products (category_id, name, slug, description, base_price, selling_price, stock_quantity, is_active, requires_prescription)
        SELECT (SELECT id FROM categories WHERE name = 'Keva Wellness' LIMIT 1), name, LOWER(REPLACE(name, ' ', '-')), description, base_price, selling_price, stock_quantity, is_active, requires_prescription
        FROM (VALUES
        ('Moringa Plus', 'Eye health', 600.00, 1199.00, 20, true, false),
        ('Bone Health', 'Bone support', 600.00, 1199.00, 20, true, false),
        ('Power Plus', 'Energy', 600.00, 1199.00, 20, true, false),
        ('Heart Care', 'Heart health', 600.00, 1199.00, 20, true, false),
        ('Omega 3', 'Heart support', 600.00, 1199.00, 20, true, false),
        ('Diabafit', 'Blood sugar', 600.00, 1199.00, 20, true, true),
        ('Glucosamine', 'Joint health', 600.00, 1199.00, 20, true, false),
        ('Ganoderma', 'Immunity', 600.00, 1199.00, 20, true, false),
        ('Chlorophyll', 'Cleansing', 600.00, 1199.00, 20, true, false),
        ('Immunorich', 'Immune', 600.00, 1199.00, 20, true, false),
        ('Folic Acid', 'Metabolism', 600.00, 1199.00, 20, true, false),
        ('Thyroid Care', 'Thyroid', 600.00, 1199.00, 20, true, false),
        ('Menstrual Care', 'Women', 600.00, 1199.00, 20, true, false),
        ('Daily Plus', 'Nutrition', 600.00, 1199.00, 20, true, false),
        ('KD Care', 'Kidney', 600.00, 1199.00, 20, true, false),
        ('Sleep Aid', 'Sleep', 600.00, 1199.00, 20, true, false),
        ('Piles Care', 'Piles', 600.00, 1199.00, 20, true, false),
        ('Medohara', 'Weight', 600.00, 1199.00, 20, true, false),
        ('D-Toxi Plus', 'Detox', 600.00, 1199.00, 20, true, false),
        ('Memory Plus', 'Memory', 600.00, 1199.00, 20, true, false),
        ('Swashari Syrup', 'Respiratory', 600.00, 1200.00, 30, true, false),
        ('Liver Care', 'Liver', 150.00, 299.00, 30, true, false),
        ('Digestive Care', 'Digestion', 80.00, 160.00, 30, true, false),
        ('Heart Tonic', 'Heart', 80.00, 160.00, 30, true, false),
        ('Ear Drops', 'Ear', 30.00, 59.00, 40, true, false),
        ('Eye Drops', 'Eye', 30.00, 59.00, 40, true, false),
        ('Tulsi Drops', 'Immunity', 30.00, 59.00, 40, true, false),
        ('Nasal Drops', 'Nasal', 30.00, 60.00, 40, true, false),
        ('Gold Tulsi 20ml', 'Premium', 100.00, 199.00, 30, true, false),
        ('Haldi Drops', 'Turmeric', 150.00, 299.00, 30, true, false)
        ) AS t(name, description, base_price, selling_price, stock_quantity, is_active, requires_prescription)
        ON CONFLICT DO NOTHING;
      `;
      
      await pool.query(sql);
      console.log('✅ Products seeded!');
    } else {
      console.log(`✅ ${result.rows[0].count} products exist`);
    }
  } catch (error) {
    console.error('Init error:', error);
  }
}

module.exports = initializeDatabase;
