const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { Pool } = require('pg');

// ====================================
// EXPRESS APP INITIALIZATION
// ====================================
const app = express();

// ====================================
// SECURITY MIDDLEWARE
// ====================================
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later'
});

app.use('/api/', limiter);

// ====================================
// CORS CONFIGURATION
// ====================================
const corsOptions = {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000', 'http://localhost:5173', 'https://pharma-frontend-13bz.onrender.com,https://pharma-admin-s43l.onrender.com', 'http://localhost:5173', 'http://172.20.10.2:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// ====================================
// BODY PARSER & JSON MIDDLEWARE
// ====================================
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ====================================
// DATABASE SETUP
// ====================================
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env.DB_POOL_SIZE) || 20,
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
});

// Test database connection
pool.query('SELECT NOW()', (err, result) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
    } else {
        console.log('✓ Database connected successfully');
    }
});

// Make pool accessible to routes
app.use((req, res, next) => {
    req.db = pool;
    next();
});

// ====================================
// REQUEST LOGGING MIDDLEWARE
// ====================================
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ====================================
// HEALTH CHECK ENDPOINT
// ====================================
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// ====================================
// API VERSION ENDPOINT
// ====================================
app.get('/api/version', (req, res) => {
    res.json({
        version: '1.0.0',
        api: 'Pharma E-Commerce Platform',
        description: 'Complete pharma platform with compliance features'
    });
});

// ====================================
// SIMPLE TEST ROUTE
// ====================================
app.get('/', (req, res) => {
    res.json({
        message: '🏥 Pharma E-Commerce API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/health',
            version: '/api/version',
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                me: 'GET /api/auth/me',
                logout: 'POST /api/auth/logout'
            }
        }
    });
});

// ====================================
// ROUTES REGISTRATION
// ====================================
// ROUTES REGISTRATION
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/products',      require('./routes/products'));
app.use('/api/cart',          require('./routes/cart'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/payments',      require('./routes/payments'));
app.use('/api/addresses',     require('./routes/addresses'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/products', require('./routes/products'));

// ====================================
// 404 HANDLER
// ====================================
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} does not exist`,
        timestamp: new Date().toISOString()
    });
});

// ====================================
// GLOBAL ERROR HANDLER
// ====================================
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';

    console.error(`❌ Error: ${message}`);

    res.status(status).json({
        error: message,
        status: status,
        timestamp: new Date().toISOString()
    });
});

// ====================================
// SERVER STARTUP
// ====================================
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

// ====================================
// GRACEFUL SHUTDOWN
// ====================================
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    
    server.close(() => {
        console.log('HTTP server closed');
        pool.end(() => {
            console.log('Database pool closed');
            process.exit(0);
        });
    });
    
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
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
