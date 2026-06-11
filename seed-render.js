const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://pharma_user:gkQZbD6IV4dDffLLcKkPumOhWcoVwERg@dpg-d84b9rr7uimc739hnq10-a.postgres.render.com/pharma_db_vmil',
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  try {
    const sql = `
      INSERT INTO categories (name, slug, description, is_active) 
      VALUES ('Keva Wellness', 'keva-wellness', 'Premium Ayurvedic Wellness Products', true)
      ON CONFLICT (name) DO NOTHING;

      INSERT INTO products (category_id, name, slug, description, base_price, selling_price, stock_quantity, is_active, requires_prescription)
      SELECT (SELECT id FROM categories WHERE name = 'Keva Wellness'), name, slug, description, base_price, selling_price, 20, true, req_rx
      FROM (VALUES
      ('Moringa Plus', 'moringa-plus', 'Eye health', 600.00, 1199.00, false),
      ('Bone Health', 'bone-health', 'Bone support', 600.00, 1199.00, false),
      ('Power Plus', 'power-plus', 'Energy', 600.00, 1199.00, false),
      ('Heart Care', 'heart-care', 'Heart health', 600.00, 1199.00, false),
      ('Omega 3', 'omega-3', 'Heart support', 600.00, 1199.00, false)
      ) t(name, slug, description, base_price, selling_price, req_rx)
      ON CONFLICT DO NOTHING;
    `;
    
    await pool.query(sql);
    console.log('✅ Seeded Render database!');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seed();
