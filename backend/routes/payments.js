const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');

const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-razorpay-signature'];
        if (webhookSecret) {
            const expected = crypto.createHmac('sha256', webhookSecret).update(req.body).digest('hex');
            if (expected !== signature) return res.status(400).json({ error: 'Invalid webhook signature' });
        }
        const event = JSON.parse(req.body);
        if (event.event === 'payment.captured') {
            const receipt = event.payload.order?.entity?.receipt;
            if (receipt) {
                const o = await req.db.query('SELECT id FROM orders WHERE order_number = $1', [receipt]);
                if (o.rows.length) await req.db.query(`UPDATE orders SET payment_status='paid', status='confirmed', updated_at=CURRENT_TIMESTAMP WHERE id=$1`, [o.rows[0].id]);
            }
        }
        if (event.event === 'payment.failed') {
            const receipt = event.payload.order?.entity?.receipt;
            if (receipt) {
                const o = await req.db.query('SELECT id FROM orders WHERE order_number = $1', [receipt]);
                if (o.rows.length) await req.db.query(`UPDATE payments SET status='failed', updated_at=CURRENT_TIMESTAMP WHERE order_id=$1`, [o.rows[0].id]);
            }
        }
        res.json({ status: 'ok' });
    } catch (err) { console.error('Webhook error:', err); res.status(500).json({ error: 'Webhook processing failed' }); }
});

router.use(authenticateToken);

router.post('/create-order', async (req, res) => {
    try {
        const { order_id } = req.body;
        if (!order_id) return res.status(400).json({ error: 'Validation Error', message: 'order_id is required' });
        const orderResult = await req.db.query('SELECT * FROM orders WHERE id = $1', [order_id]);
        if (!orderResult.rows.length) return res.status(404).json({ error: 'Not Found', message: 'Order not found' });
        const order = orderResult.rows[0];
        if (order.user_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
        if (order.payment_status === 'paid') return res.status(400).json({ error: 'Already Paid', message: 'This order is already paid' });
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(parseFloat(order.total_amount) * 100),
            currency: 'INR',
            receipt: order.order_number,
            notes: { order_id: order.id.toString(), user_id: req.user.userId.toString() }
        });
        await req.db.query(
            `INSERT INTO payments (order_id, user_id, amount, currency, payment_gateway, status, payment_method)
             VALUES ($1,$2,$3,'INR','razorpay','initiated',$4)`,
            [order.id, req.user.userId, order.total_amount, order.payment_method]
        );
        res.json({ razorpay_order_id: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency, order_number: order.order_number, key_id: process.env.RAZORPAY_KEY_ID });
    } catch (err) { console.error('Create payment order error:', err); res.status(500).json({ error: 'Server error', message: err.message }); }
});

router.post('/verify', async (req, res) => {
    const client = await req.db.connect();
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !order_id)
            return res.status(400).json({ error: 'Validation Error', message: 'All razorpay fields and order_id are required' });
        const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
        if (expected !== razorpay_signature) return res.status(400).json({ error: 'Payment Verification Failed', message: 'Invalid payment signature' });
        await client.query('BEGIN');
        await client.query(`UPDATE payments SET status='completed', updated_at=CURRENT_TIMESTAMP WHERE order_id=$1 AND user_id=$2`, [order_id, req.user.userId]);
        await client.query(`UPDATE orders SET payment_status='paid', status='confirmed', updated_at=CURRENT_TIMESTAMP WHERE id=$1`, [order_id]);
        await client.query('COMMIT');
        res.json({ message: 'Payment verified successfully', payment_id: razorpay_payment_id });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Verify payment error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    } finally { client.release(); }
});

router.get('/order/:order_id', async (req, res) => {
    try {
        const orderResult = await req.db.query('SELECT user_id FROM orders WHERE id = $1', [req.params.order_id]);
        if (!orderResult.rows.length) return res.status(404).json({ error: 'Not Found', message: 'Order not found' });
        if (req.user.role !== 'admin' && orderResult.rows[0].user_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
        const result = await req.db.query('SELECT * FROM payments WHERE order_id = $1', [req.params.order_id]);
        res.json({ payment: result.rows[0] || null });
    } catch (err) { console.error('Get payment error:', err); res.status(500).json({ error: 'Server error', message: err.message }); }
});

module.exports = router;
