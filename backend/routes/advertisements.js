const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ ads: [], message: 'No ads yet' });
});

module.exports = router;
