const express = require('express');
const router = express.Router();

router.get('/dashboard', (req, res) => {
  res.json({ stats: {}, message: 'Analytics coming soon' });
});

module.exports = router;
