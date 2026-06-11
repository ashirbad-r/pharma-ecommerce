const express = require('express');
const router = express.Router();

router.post('/seed-products', async (req, res) => {
  try {
    const sql = `
      INSERT INTO categories (name, slug, description, is_active) 
      VALUES ('Keva Wellness', 'keva-wellness', 'Premium Ayurvedic Wellness Products', true)
      ON CONFLICT (name) DO NOTHING;

      INSERT INTO products (category_id, name, slug, description, base_price, selling_price, stock_quantity, is_active, requires_prescription)
      SELECT (SELECT id FROM categories WHERE name = 'Keva Wellness'), name, LOWER(REPLACE(name, ' ', '-')), desc, price, price, 20, true, req_rx
      FROM (VALUES
      ('Moringa Plus','Eye health',600.00,1199.00,false),
      ('Bone Health','Bone support',600.00,1199.00,false),
      ('Power Plus','Energy',600.00,1199.00,false),
      ('Heart Care','Heart health',600.00,1199.00,false),
      ('Omega 3','Heart support',600.00,1199.00,false),
      ('Diabafit','Blood sugar',600.00,1199.00,true),
      ('Glucosamine','Joint health',600.00,1199.00,false),
      ('Ganoderma','Immunity',600.00,1199.00,false),
      ('Chlorophyll','Cleansing',600.00,1199.00,false),
      ('Immunorich','Immune',600.00,1199.00,false)
      ) t(name,desc,price,price,req_rx)
      ON CONFLICT DO NOTHING;
    `;
    
    await req.pool.query(sql);
    res.json({ success: true, message: 'Products seeded!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
