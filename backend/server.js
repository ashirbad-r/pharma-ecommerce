const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(helmet());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'https://pharma-frontend-13bz.onrender.com',
    'https://pharma-admin-s43l.onrender.com',
    'https://pharma-frontend-hkg6.onrender.com',
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) callback(null, true);
        else callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.query('SELECT NOW()', (err) => {
    if (err) console.error('❌ Database connection error:', err.message);
    else console.log('✓ Database connected successfully');
});

app.use((req, res, next) => {
    req.db = pool;
    next();
});

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString(), uptime: process.uptime(), environment: process.env.NODE_ENV });
});

app.get('/', (req, res) => {
    res.json({ message: '🌿 KEVA Pharmacy API', version: '1.0.0', status: 'running' });
});

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/products',      require('./routes/products'));
app.use('/api/cart',          require('./routes/cart'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/addresses',     require('./routes/addresses'));
app.use('/api/prescriptions', require('./routes/prescriptions'));

app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.url} does not exist`, timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message, timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`\n=====================================\n🌿 KEVA PHARMACY BACKEND\n=====================================\nServer running on port: ${PORT}\nEnvironment: ${process.env.NODE_ENV}\n=====================================\n`);
});

process.on('SIGTERM', () => server.close(() => pool.end(() => process.exit(0))));
process.on('SIGINT', () => server.close(() => pool.end(() => process.exit(0))));

module.exports = app;
