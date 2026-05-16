const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

router.use(authenticateToken);

const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PH-${timestamp}-${random}`;
};

router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const params = [];
        const conditions = [];
        if (req.user.role !== 'admin') { params.push(req.user.userId); conditions.push(`o.user_id = $${params.length}`); }
        if (status) { params.push(status); conditions.push(`o.status = $${params.length}`); }
        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const countResult = await req.db.query(`SELECT COUNT(*) FROM orders o ${where}`, params);
        const total = parseInt(countResult.rows[0].count);
        params.push(parseInt(limit)); params.push(offset);
        const result = await req.db.query(
            `SELECT o.*, u.first_name, u.last_name, u.email, COUNT(oi.id) AS item_count
             FROM orders o JOIN users u ON o.user_id = u.id
             LEFT JOIN order_items oi ON o.id = oi.order_id
             ${where} GROUP BY o.id, u.first_name, u.last_name, u.email
             ORDER BY o.created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`, params
        );
        res.json({ orders: result.rows, pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) } });
    } catch (err) { console.error('Get orders error:', err); res.status(500).json({ error: 'Server error', message: err.message }); }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const orderResult = await req.db.query(
            `SELECT o.*, u.first_name, u.last_name, u.email, u.phone
             FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1`, [id]
        );
        if (!orderResult.rows.length) return res.status(404).json({ error: 'Not Found', message: 'Order not found' });
        const order = orderResult.rows[0];
        if (req.user.role !== 'admin' && order.user_id !== req.user.userId)
            return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
        const itemsResult = await req.db.query(
            `SELECT oi.*, p.primary_image_url, p.slug, p.form, p.strength
             FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1`, [id]
        );
        const paymentResult = await req.db.query('SELECT * FROM payments WHERE order_id = $1', [id]);
        res.json({ order, items: itemsResult.rows, payment: paymentResult.rows[0] || null });
    } catch (err) { console.error('Get order error:', err); res.status(500).json({ error: 'Server error', message: err.message }); }
});

router.post('/checkout', async (req, res) => {
    const client = await req.db.connect();
    try {
        const { payment_method = 'razorpay', prescription_id } = req.body;
        await client.query('BEGIN');
        const cartResult = await client.query(
            `SELECT c.*, p.name, p.selling_price, p.stock_quantity, p.requires_prescription, p.is_active
             FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = $1`,
            [req.user.userId]
        );
        if (!cartResult.rows.length) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Empty Cart', message: 'Your cart is empty' }); }
        const cartItems = cartResult.rows;
        for (const item of cartItems) {
            if (!item.is_active) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Product Unavailable', message: `"${item.name}" is no longer available` }); }
            if (item.stock_quantity < item.quantity) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Insufficient Stock', message: `"${item.name}" has only ${item.stock_quantity} units left` }); }
            if (item.requires_prescription && !prescription_id) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Prescription Required', message: `"${item.name}" requires a valid prescription` }); }
        }
        const TAX_RATE = 0.18;
        const subtotal = cartItems.reduce((sum, i) => sum + parseFloat(i.selling_price) * i.quantity, 0);
        const taxAmount = parseFloat((subtotal * TAX_RATE).toFixed(2));
        const shippingCost = subtotal >= 500 ? 0 : 50;
        const totalAmount = parseFloat((subtotal + taxAmount + shippingCost).toFixed(2));
        const requiresPrescription = cartItems.some(i => i.requires_prescription);
        const orderNumber = generateOrderNumber();
        const orderResult = await client.query(
            `INSERT INTO orders (order_number, user_id, subtotal, tax_amount, shipping_cost, total_amount, status, payment_status, payment_method, requires_prescription, prescription_id)
             VALUES ($1,$2,$3,$4,$5,$6,'pending','pending',$7,$8,$9) RETURNING *`,
            [orderNumber, req.user.userId, subtotal.toFixed(2), taxAmount, shippingCost, totalAmount, payment_method, requiresPrescription, prescription_id || null]
        );
        const order = orderResult.rows[0];
        for (const item of cartItems) {
            const lineTotal = parseFloat(item.selling_price) * item.quantity;
            const itemTax = parseFloat((lineTotal * TAX_RATE).toFixed(2));
            await client.query(
                `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, tax_amount, total_price)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [order.id, item.product_id, item.name, item.quantity, item.selling_price, itemTax, (lineTotal + itemTax).toFixed(2)]
            );
            await client.query('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2', [item.quantity, item.product_id]);
        }
        await client.query('DELETE FROM cart WHERE user_id = $1', [req.user.userId]);
        await client.query('COMMIT');
        res.status(201).json({ message: 'Order placed successfully', order: { ...order, item_count: cartItems.length } });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Checkout error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    } finally { client.release(); }
});

router.patch('/:id/status', authorizeAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending','confirmed','processing','shipped','delivered','cancelled'];
        if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Validation Error', message: `status must be one of: ${validStatuses.join(', ')}` });
        const result = await req.db.query(
            `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
            [status, req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Not Found', message: 'Order not found' });
        res.json({ message: 'Order status updated', order: result.rows[0] });
    } catch (err) { console.error('Update order status error:', err); res.status(500).json({ error: 'Server error', message: err.message }); }
});

router.post('/:id/cancel', async (req, res) => {
    const client = await req.db.connect();
    try {
        await client.query('BEGIN');
        const orderResult = await client.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
        if (!orderResult.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not Found', message: 'Order not found' }); }
        const order = orderResult.rows[0];
        if (req.user.role !== 'admin' && order.user_id !== req.user.userId) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Forbidden', message: 'Access denied' }); }
        if (!['pending','confirmed'].includes(order.status)) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Cannot Cancel', message: `Order cannot be cancelled in "${order.status}" status` }); }
        const items = await client.query('SELECT product_id, quantity FROM order_items WHERE order_id = $1', [req.params.id]);
        for (const item of items.rows) {
            await client.query('UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2', [item.quantity, item.product_id]);
        }
        await client.query(`UPDATE orders SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [req.params.id]);
        await client.query('COMMIT');
        res.json({ message: 'Order cancelled successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Cancel order error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    } finally { client.release(); }
});

module.exports = router;
