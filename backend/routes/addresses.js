const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const result = await req.db.query('SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC', [req.user.userId]);
        res.json({ addresses: result.rows });
    } catch (err) { res.status(500).json({ error: 'Server error', message: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { type='home', full_name, phone, street_address, city, state_province, postal_code, country='IN', is_default=false } = req.body;
        if (!full_name || !street_address || !city || !state_province || !postal_code)
            return res.status(400).json({ error: 'Validation Error', message: 'full_name, street_address, city, state_province, and postal_code are required' });
        const countResult = await req.db.query('SELECT COUNT(*) FROM addresses WHERE user_id = $1', [req.user.userId]);
        const makeDefault = is_default || parseInt(countResult.rows[0].count) === 0;
        if (makeDefault) await req.db.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.userId]);
        const result = await req.db.query(
            `INSERT INTO addresses (user_id, type, full_name, phone, street_address, city, state_province, postal_code, country, is_default)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [req.user.userId, type, full_name, phone||null, street_address, city, state_province, postal_code, country, makeDefault]
        );
        res.status(201).json({ message: 'Address added', address: result.rows[0] });
    } catch (err) { res.status(500).json({ error: 'Server error', message: err.message }); }
});

router.put('/:id', async (req, res) => {
    try {
        const existing = await req.db.query('SELECT * FROM addresses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        if (!existing.rows.length) return res.status(404).json({ error: 'Not Found', message: 'Address not found' });
        const c = existing.rows[0];
        const { type=c.type, full_name=c.full_name, phone=c.phone, street_address=c.street_address, city=c.city, state_province=c.state_province, postal_code=c.postal_code, country=c.country, is_default=c.is_default } = req.body;
        if (is_default && !c.is_default) await req.db.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.userId]);
        const result = await req.db.query(
            `UPDATE addresses SET type=$1,full_name=$2,phone=$3,street_address=$4,city=$5,state_province=$6,postal_code=$7,country=$8,is_default=$9 WHERE id=$10 AND user_id=$11 RETURNING *`,
            [type,full_name,phone,street_address,city,state_province,postal_code,country,is_default,req.params.id,req.user.userId]
        );
        res.json({ message: 'Address updated', address: result.rows[0] });
    } catch (err) { res.status(500).json({ error: 'Server error', message: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        const result = await req.db.query('DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id, is_default', [req.params.id, req.user.userId]);
        if (!result.rows.length) return res.status(404).json({ error: 'Not Found', message: 'Address not found' });
        if (result.rows[0].is_default) {
            await req.db.query(`UPDATE addresses SET is_default = true WHERE id = (SELECT id FROM addresses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1)`, [req.user.userId]);
        }
        res.json({ message: 'Address deleted' });
    } catch (err) { res.status(500).json({ error: 'Server error', message: err.message }); }
});

router.patch('/:id/default', async (req, res) => {
    try {
        const existing = await req.db.query('SELECT id FROM addresses WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
        if (!existing.rows.length) return res.status(404).json({ error: 'Not Found', message: 'Address not found' });
        await req.db.query('UPDATE addresses SET is_default = false WHERE user_id = $1', [req.user.userId]);
        const result = await req.db.query('UPDATE addresses SET is_default = true WHERE id = $1 RETURNING *', [req.params.id]);
        res.json({ message: 'Default address updated', address: result.rows[0] });
    } catch (err) { res.status(500).json({ error: 'Server error', message: err.message }); }
});

module.exports = router;
