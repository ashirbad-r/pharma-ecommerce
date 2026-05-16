const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const result = await req.db.query(
            `SELECT c.id, c.product_id, c.quantity, c.prescription_id, c.added_at,
                p.name, p.slug, p.selling_price, p.base_price, p.discount_percentage,
                p.primary_image_url, p.stock_quantity, p.requires_prescription,
                p.form, p.strength, p.manufacturer, p.is_active,
                (c.quantity * p.selling_price) AS line_total
             FROM cart c
             JOIN products p ON c.product_id = p.id
             WHERE c.user_id = $1
             ORDER BY c.added_at DESC`,
            [req.user.userId]
        );
        const items = result.rows;
        const subtotal = items.reduce((sum, i) => sum + parseFloat(i.line_total), 0);
        const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
        res.json({
            items,
            summary: {
                item_count: itemCount,
                subtotal: subtotal.toFixed(2),
                requires_prescription: items.some(i => i.requires_prescription)
            }
        });
    } catch (err) {
        console.error('Get cart error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { product_id, quantity = 1, prescription_id } = req.body;
        if (!product_id) return res.status(400).json({ error: 'Validation Error', message: 'product_id is required' });
        if (quantity < 1) return res.status(400).json({ error: 'Validation Error', message: 'quantity must be at least 1' });
        const product = await req.db.query(
            'SELECT id, name, stock_quantity, requires_prescription, is_active FROM products WHERE id = $1',
            [product_id]
        );
        if (!product.rows.length || !product.rows[0].is_active)
            return res.status(404).json({ error: 'Not Found', message: 'Product not found or unavailable' });
        const prod = product.rows[0];
        if (prod.stock_quantity < quantity)
            return res.status(400).json({ error: 'Insufficient Stock', message: `Only ${prod.stock_quantity} units available` });
        if (prod.requires_prescription && !prescription_id)
            return res.status(400).json({ error: 'Prescription Required', message: 'This product requires a valid prescription' });
        const result = await req.db.query(
            `INSERT INTO cart (user_id, product_id, quantity, prescription_id)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, product_id)
             DO UPDATE SET quantity = cart.quantity + EXCLUDED.quantity,
                prescription_id = COALESCE(EXCLUDED.prescription_id, cart.prescription_id),
                updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [req.user.userId, product_id, quantity, prescription_id || null]
        );
        res.status(201).json({ message: 'Item added to cart', cart_item: result.rows[0] });
    } catch (err) {
        console.error('Add to cart error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

router.put('/:product_id', async (req, res) => {
    try {
        const { product_id } = req.params;
        const { quantity } = req.body;
        if (!quantity || quantity < 1) return res.status(400).json({ error: 'Validation Error', message: 'quantity must be at least 1' });
        const product = await req.db.query('SELECT stock_quantity FROM products WHERE id = $1', [product_id]);
        if (!product.rows.length) return res.status(404).json({ error: 'Not Found', message: 'Product not found' });
        if (product.rows[0].stock_quantity < quantity)
            return res.status(400).json({ error: 'Insufficient Stock', message: `Only ${product.rows[0].stock_quantity} units available` });
        const result = await req.db.query(
            `UPDATE cart SET quantity = $1, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2 AND product_id = $3 RETURNING *`,
            [quantity, req.user.userId, product_id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Not Found', message: 'Item not in cart' });
        res.json({ message: 'Cart updated', cart_item: result.rows[0] });
    } catch (err) {
        console.error('Update cart error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

router.delete('/:product_id', async (req, res) => {
    try {
        const result = await req.db.query(
            'DELETE FROM cart WHERE user_id = $1 AND product_id = $2 RETURNING id',
            [req.user.userId, req.params.product_id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Not Found', message: 'Item not in cart' });
        res.json({ message: 'Item removed from cart' });
    } catch (err) {
        console.error('Remove from cart error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

router.delete('/', async (req, res) => {
    try {
        await req.db.query('DELETE FROM cart WHERE user_id = $1', [req.user.userId]);
        res.json({ message: 'Cart cleared' });
    } catch (err) {
        console.error('Clear cart error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

module.exports = router;
