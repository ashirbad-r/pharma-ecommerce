const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { Pool } = require('pg');
const app = express();

app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later'
});
app.use('/api/', limiter);

// CORS - allow all render URLs and localhost
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

// Also add any from env
if (process.env.CORS_ORIGIN) {
    process.env.CORS_ORIGIN.split(',').forEach(o => {
        const trimmed = o.trim();
        if (!allowedOrigins.includes(trimmed)) allowedOrigins.push(trimmed);
    });
}

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('CORS blocked:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env.DB_POOL_SIZE) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
});

pool.query('SELECT NOW()', (err, result) => {
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

app.get('/api/version', (req, res) => {
    res.json({ version: '1.0.0', api: 'Pharma E-Commerce Platform' });
});

app.get('/', (req, res) => {
    res.json({ message: '🏥 Pharma E-Commerce API', version: '1.0.0', status: 'running' });
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
    const status = err.status || 500;
    res.status(status).json({ error: err.message, status, timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`
    =====================================
    🏥 PHARMA E-COMMERCE BACKEND
    =====================================
    Server running on port: ${PORT}
    Environment: ${process.env.NODE_ENV}
    URL: http://localhost:${PORT}
    =====================================
    `);
});

process.on('SIGTERM', () => {
    server.close(() => {
        pool.end(() => process.exit(0));
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('HTTP server closed');
        pool.end(() => {
            console.log('Database pool closed');
            process.exit(0);
        });
    });
});

module.exports = app;

// Initialize database with seed data
const initializeDatabase = require('./init-db');
initializeDatabase(pool).catch(err => console.error('Init error:', err));
