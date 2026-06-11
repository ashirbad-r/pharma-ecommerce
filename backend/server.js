const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://pharma-frontend-13bz.onrender.com',
    'https://pharma-admin-q4bx.onrender.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Make pool available to routes
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/addresses', require('./routes/addresses'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/advertisements', require('./routes/advertisements'));
app.use('/api/analytics', require('./routes/analytics'));

// Admin seed endpoint
const adminSeedRouter = require('./routes/admin-seed');
app.use('/api/admin', adminSeedRouter);

module.exports = app;

// Start server
const port = process.env.PORT || 3000;
if (require.main === module) {
  const http = require('http');
  http.createServer(app).listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
  });
}

// CRM routes
const crmRouter = require('./routes/crm');
app.use('/api/crm', crmRouter);

// Inventory routes
const inventoryRouter = require('./routes/inventory');
app.use('/api/inventory', inventoryRouter);
