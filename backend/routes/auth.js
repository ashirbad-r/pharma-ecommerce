const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');

const { authenticateToken } = require('../middleware/auth');

// ====================================
// VALIDATION MIDDLEWARE
// ====================================
const validateRegister = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
    body('phone').notEmpty().withMessage('Phone is required')
];

const validateLogin = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
];

// ====================================
// REGISTER - POST /api/auth/register
// ====================================
router.post('/register', validateRegister, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, first_name, last_name, phone, role = 'customer' } = req.body;

        // Check if user already exists
        const existingUser = await req.db.query(
            'SELECT id FROM users WHERE email = $1 OR phone = $2',
            [email, phone]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: 'User already exists',
                message: 'Email or phone number already registered'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await req.db.query(
            `INSERT INTO users (
                uuid, email, password, first_name, last_name, phone, role, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, uuid, email, first_name, last_name, phone, role, created_at`,
            [uuidv4(), email, hashedPassword, first_name, last_name, phone, role, 'active']
        );

        const user = result.rows[0];

        // Create JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                uuid: user.uuid,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || '7d' }
        );

        // Log audit
        await req.db.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address) VALUES ($1, $2, $3, $4, $5)',
            [user.id, 'USER_REGISTRATION', 'user', user.id, req.ip]
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                uuid: user.uuid,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            error: 'Registration failed',
            message: error.message
        });
    }
});

// ====================================
// LOGIN - POST /api/auth/login
// ====================================
router.post('/login', validateLogin, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user
        const result = await req.db.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        const user = result.rows[0];

        // Check if account is active
        if (user.status !== 'active') {
            return res.status(403).json({
                error: 'Account inactive',
                message: `Your account status is ${user.status}`
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Invalid credentials',
                message: 'Email or password is incorrect'
            });
        }

        // Update last login
        await req.db.query(
            'UPDATE users SET last_login = NOW() WHERE id = $1',
            [user.id]
        );

        // Create JWT token
        const token = jwt.sign(
            {
                userId: user.id,
                uuid: user.uuid,
                email: user.email,
                role: user.role,
                kyc_verified: user.kyc_verified
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRY || '7d' }
        );

        // Log audit
        await req.db.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address) VALUES ($1, $2, $3, $4, $5)',
            [user.id, 'USER_LOGIN', 'user', user.id, req.ip]
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                uuid: user.uuid,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                phone: user.phone,
                role: user.role,
                kyc_verified: user.kyc_verified
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            error: 'Login failed',
            message: error.message
        });
    }
});

// ====================================
// GET CURRENT USER - GET /api/auth/me
// ====================================
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await req.db.query(
            `SELECT id, uuid, email, first_name, last_name, phone, role, 
                    kyc_verified, status, last_login, created_at 
             FROM users WHERE id = $1`,
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch user',
            message: error.message
        });
    }
});

// ====================================
// LOGOUT - POST /api/auth/logout
// ====================================
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // Log audit
        await req.db.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address) VALUES ($1, $2, $3, $4, $5)',
            [req.user.userId, 'USER_LOGOUT', 'user', req.user.userId, req.ip]
        );

        res.json({ message: 'Logged out successfully' });

    } catch (error) {
        res.status(500).json({
            error: 'Logout failed',
            message: error.message
        });
    }
});

module.exports = router;
