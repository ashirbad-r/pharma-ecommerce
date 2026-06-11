const express = require('express');
const router = express.Router();

// Get customer profile
router.get('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.pool.query('SELECT * FROM customer_profiles WHERE user_id = $1', [id]);
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update customer profile
router.put('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { segment, notes } = req.body;
    const result = await req.pool.query(
      'UPDATE customer_profiles SET segment = $1, notes = $2 WHERE user_id = $3 RETURNING *',
      [segment, notes, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get loyalty rewards
router.get('/loyalty/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.pool.query('SELECT * FROM loyalty_rewards WHERE user_id = $1', [id]);
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add loyalty points
router.post('/loyalty/:id/points', async (req, res) => {
  try {
    const { id } = req.params;
    const { points } = req.body;
    await req.pool.query('UPDATE loyalty_rewards SET points = points + $1 WHERE user_id = $2', [points, id]);
    res.json({ success: true, message: 'Points added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create referral
router.post('/referrals', async (req, res) => {
  try {
    const { referrer_id, referee_id, reward_amount } = req.body;
    const result = await req.pool.query(
      'INSERT INTO referrals (referrer_id, referee_id, reward_amount) VALUES ($1, $2, $3) RETURNING *',
      [referrer_id, referee_id, reward_amount]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get referrals
router.get('/referrals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await req.pool.query('SELECT * FROM referrals WHERE referrer_id = $1', [id]);
    res.json({ referrals: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
