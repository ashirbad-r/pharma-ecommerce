const express = require('express');
const router = express.Router();

router.post('/seed-products', async (req, res) => {
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
      ('Omega 3', 'omega-3', 'Heart support', 600.00, 1199.00, false),
      ('Diabafit', 'diabafit', 'Blood sugar', 600.00, 1199.00, true),
      ('Glucosamine', 'glucosamine', 'Joint health', 600.00, 1199.00, false),
      ('Ganoderma', 'ganoderma', 'Immunity', 600.00, 1199.00, false),
      ('Chlorophyll', 'chlorophyll', 'Cleansing', 600.00, 1199.00, false),
      ('Immunorich', 'immunorich', 'Immune', 600.00, 1199.00, false)
      ) t(name, slug, description, base_price, selling_price, req_rx)
      ON CONFLICT DO NOTHING;
    `;
    
    await req.pool.query(sql);
    res.json({ success: true, message: 'Products seeded!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
