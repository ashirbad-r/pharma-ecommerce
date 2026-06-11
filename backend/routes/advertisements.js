const express = require('express');
const router = express.Router();

// Get all advertisements
router.get('/', async (req, res) => {
  try {
    const result = await req.pool.query('SELECT * FROM advertisements WHERE status = $1 ORDER BY created_at DESC', ['active']);
    res.json({ ads: result.rows, total: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create advertisement (Admin only)
router.post('/', async (req, res) => {
  try {
    const { title, description, image_url, target_url, start_date, end_date } = req.body;
    const result = await req.pool.query(
      'INSERT INTO advertisements (title, description, image_url, target_url, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, image_url, target_url, start_date, end_date]
    );
    res.json({ success: true, ad: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track impression
router.post('/:id/impression', async (req, res) => {
  try {
    const { id } = req.params;
    await req.pool.query('UPDATE advertisements SET impressions = impressions + 1 WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track click
router.post('/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    await req.pool.query('UPDATE advertisements SET clicks = clicks + 1 WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ad analytics
router.get('/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.pool.query('SELECT id, title, impressions, clicks, ROUND(CAST(clicks AS FLOAT) / NULLIF(impressions, 0) * 100, 2) as ctr FROM advertisements WHERE id = $1', [id]);
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
