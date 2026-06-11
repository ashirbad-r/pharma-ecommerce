const express = require('express');
const router = express.Router();

// Parse CSV helper
function parseCSV(csv) {
  const lines = csv.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx];
    });
    rows.push(row);
  }
  return rows;
}

// Upload CSV
router.post('/upload', async (req, res) => {
  try {
    const { csv, filename } = req.body;
    const rows = parseCSV(csv);
    
    const importRecord = await req.pool.query(
      'INSERT INTO product_imports (filename, total_rows) VALUES ($1, $2) RETURNING id',
      [filename, rows.length]
    );
    const importId = importRecord.rows[0].id;
    
    let imported = 0, failed = 0, errors = [];
    
    for (const row of rows) {
      try {
        await req.pool.query(`
          INSERT INTO products (category_id, name, slug, description, base_price, selling_price, stock_quantity, is_active)
          VALUES (1, $1, LOWER(REPLACE($1, ' ', '-')), $2, $3, $4, $5, true)
          ON CONFLICT DO NOTHING
        `, [row.name, row.description, row.base_price, row.selling_price, row.stock_quantity || 0]);
        imported++;
      } catch (err) {
        failed++;
        errors.push(`Row ${row.name}: ${err.message}`);
      }
    }
    
    await req.pool.query(
      'UPDATE product_imports SET imported_rows = $1, failed_rows = $2, status = $3, error_log = $4 WHERE id = $5',
      [imported, failed, 'completed', errors.join('\n'), importId]
    );
    
    res.json({ success: true, importId, imported, failed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get import history
router.get('/history', async (req, res) => {
  try {
    const result = await req.pool.query('SELECT * FROM product_imports ORDER BY imported_at DESC LIMIT 20');
    res.json({ imports: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get import status
router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.pool.query('SELECT * FROM product_imports WHERE id = $1', [id]);
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
