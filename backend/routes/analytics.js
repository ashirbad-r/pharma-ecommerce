const express = require('express');
const router = express.Router();

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const orders = await req.pool.query('SELECT COUNT(*) as total, SUM(total_amount) as revenue FROM orders');
    const customers = await req.pool.query('SELECT COUNT(*) as total FROM users');
    const products = await req.pool.query('SELECT COUNT(*) as total FROM products');
    
    res.json({
      total_orders: orders.rows[0].total,
      total_revenue: orders.rows[0].revenue || 0,
      total_customers: customers.rows[0].total,
      total_products: products.rows[0].total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get sales trends
router.get('/sales', async (req, res) => {
  try {
    const result = await req.pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total_amount) as sales
      FROM orders
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);
    res.json({ trends: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get customer insights
router.get('/customers', async (req, res) => {
  try {
    const result = await req.pool.query(`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_customers,
             COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as this_week
      FROM users
    `);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top products
router.get('/products', async (req, res) => {
  try {
    const result = await req.pool.query(`
      SELECT p.name, COUNT(oi.id) as sold, SUM(oi.quantity * oi.price) as revenue
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY p.id, p.name
      ORDER BY sold DESC
      LIMIT 10
    `);
    res.json({ top_products: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get revenue forecast
router.get('/forecast', async (req, res) => {
  try {
    const result = await req.pool.query(`
      SELECT DATE(created_at) as date, AVG(total_amount) as avg_daily_revenue
      FROM orders
      WHERE created_at > NOW() - INTERVAL '90 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);
    res.json({ forecast: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
