const express = require('express');
const router = express.Router();

// Get inventory status
router.get('/status/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await req.pool.query('SELECT * FROM inventory WHERE product_id = $1', [productId]);
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock alerts
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const result = await req.pool.query(`
      SELECT p.id, p.name, i.quantity, i.reorder_level
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.quantity <= i.reorder_level
      ORDER BY i.quantity ASC
    `);
    res.json({ low_stock: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expiring products
router.get('/expiry/soon', async (req, res) => {
  try {
    const result = await req.pool.query(`
      SELECT p.name, e.batch_number, e.expiry_date, e.quantity
      FROM expiry_tracking e
      JOIN products p ON e.product_id = p.id
      WHERE e.expiry_date <= NOW() + INTERVAL '30 days'
      ORDER BY e.expiry_date ASC
    `);
    res.json({ expiring: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update inventory quantity
router.put('/update/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;
    const result = await req.pool.query(
      'UPDATE inventory SET quantity = $1, last_restocked = NOW() WHERE product_id = $2 RETURNING *',
      [quantity, productId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add batch with expiry
router.post('/batch', async (req, res) => {
  try {
    const { product_id, batch_number, expiry_date, quantity } = req.body;
    const result = await req.pool.query(
      'INSERT INTO expiry_tracking (product_id, batch_number, expiry_date, quantity) VALUES ($1, $2, $3, $4) RETURNING *',
      [product_id, batch_number, expiry_date, quantity]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get inventory alerts
router.get('/alerts', async (req, res) => {
  try {
    const result = await req.pool.query('SELECT * FROM inventory_alerts WHERE status = $1 ORDER BY created_at DESC', ['active']);
    res.json({ alerts: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
