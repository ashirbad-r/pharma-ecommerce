const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const { page=1, limit=10, status } = req.query;
        const offset = (parseInt(page)-1)*parseInt(limit);
        const params = []; const conditions = [];
        if (req.user.role !== 'admin') { params.push(req.user.userId); conditions.push(`p.user_id = $${params.length}`); }
        if (status) { params.push(status); conditions.push(`p.status = $${params.length}`); }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const countResult = await req.db.query(`SELECT COUNT(*) FROM prescriptions p ${where}`, params);
        const total = parseInt(countResult.rows[0].count);
        params.push(parseInt(limit)); params.push(offset);
        const result = await req.db.query(
            `SELECT p.*, u.first_name, u.last_name, u.email,
                v.first_name AS verifier_first_name, v.last_name AS verifier_last_name
             FROM prescriptions p JOIN users u ON p.user_id = u.id
             LEFT JOIN users v ON p.verified_by = v.id
             ${where} ORDER BY p.created_at DESC
             LIMIT $${params.length-1} OFFSET $${params.length}`, params
        );
        res.json({ prescriptions: result.rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total/parseInt(limit)) } });
    } catch (err) { res.status(500).json({ error: 'Server error', message: err.message }); }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await req.db.query(
            `SELECT p.*, u.first_name, u.last_name, u.email, v.first_name AS verifier_first_name, v.last_name AS verifier_last_name
             FROM prescriptions p JOIN users u ON p.user_id = u.id LEFT JOIN users v ON p.verified_by = v.id WHERE p.id = $1`, [req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Not Found', message: 'Prescription not found' });
        const prescription = result.rows[0];
        if (req.user.role !== 'admin' && prescription.user_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
        res.json({ prescription });
    } catch (err) { res.status(500).json({ error: 'Server error', message: err.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { doctor_name, prescription_date, expiry_date, file_url } = req.body;
        if (!prescription_date || !expiry_date || !file_url)
            return res.status(400).json({ error: 'Validation Error', message: 'prescription_date, expiry_date, and file_url are required' });
        if (new Date(expiry_date) <= new Date())
            return res.status(400).json({ error: 'Validation Error', message: 'Prescription has already expired' });
        const result = await req.db.query(
            `INSERT INTO prescriptions (user_id, doctor_name, prescription_date, expiry_date, file_url, status)
             VALUES ($1,$2,$3,$4,$5,'pending') RETURNING *`,
            [req.user.userId, doctor_name||null, prescription_date, expiry_date, file_url]
        );
        res.status(201).json({ message: 'Prescription uploaded. Pending admin verification.', prescription: result.rows[0] });
    } catch (err) { res.status(500).json({ error: 'Server error', message: err.message }); }
});

router.patch('/:id/verify', authorizeAdmin, async (req, res) => {
    try {
        const { action } = req.body;
        if (!['approve','reject'].includes(action)) return res.status(400).json({ error: 'Validation Error', message: 'action must be "approve" or "reject"' });
        const result = await req.db.query(
            `UPDATE prescriptions SET status=$1, is_verified=$2, verified_by=$3, updated_at=CURRENT_TIMESTAMP WHERE id=$4 RETURNING *`,
            [action==='approve'?'approved':'rejected', action==='approve', req.user.userId, req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Not Found', message: 'Prescription not found' });
        res.json({ message: `Prescription ${result.rows[0].status}`, prescription: result.rows[0] });
    } catch (err) { res.status(500).json({ error: 'Server error', message: err.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        const existing = await req.db.query('SELECT * FROM prescriptions WHERE id = $1', [req.params.id]);
        if (!existing.rows.length) return res.status(404).json({ error: 'Not Found', message: 'Prescription not found' });
        const p = existing.rows[0];
        if (req.user.role !== 'admin' && p.user_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
        if (p.status !== 'pending') return res.status(400).json({ error: 'Cannot Delete', message: 'Only pending prescriptions can be deleted' });
        await req.db.query('DELETE FROM prescriptions WHERE id = $1', [req.params.id]);
        res.json({ message: 'Prescription deleted' });
    } catch (err) { res.status(500).json({ error: 'Server error', message: err.message }); }
});

module.exports = router;
