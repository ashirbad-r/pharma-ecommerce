const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// ====================================
// AUTH MIDDLEWARE
// ====================================
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden', message: 'Admin access required' });
    }
    next();
};

// Helper: generate slug from name
const slugify = (text) =>
    text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// ====================================
// GET /api/products
// Public - list with search, filter, pagination
// ====================================
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            category_id,
            requires_prescription,
            min_price,
            max_price,
            form,
            in_stock
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const params = [];
        const conditions = ['p.is_active = true'];

        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(p.name ILIKE $${params.length} OR p.salt_composition ILIKE $${params.length} OR p.manufacturer ILIKE $${params.length})`);
        }
        if (category_id) {
            params.push(parseInt(category_id));
            conditions.push(`p.category_id = $${params.length}`);
        }
        if (requires_prescription !== undefined) {
            params.push(requires_prescription === 'true');
            conditions.push(`p.requires_prescription = $${params.length}`);
        }
        if (min_price) {
            params.push(parseFloat(min_price));
            conditions.push(`p.selling_price >= $${params.length}`);
        }
        if (max_price) {
            params.push(parseFloat(max_price));
            conditions.push(`p.selling_price <= $${params.length}`);
        }
        if (form) {
            params.push(form);
            conditions.push(`p.form = $${params.length}`);
        }
        if (in_stock === 'true') {
            conditions.push(`p.stock_quantity > 0`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const countResult = await req.db.query(
            `SELECT COUNT(*) FROM products p ${where}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        params.push(parseInt(limit));
        params.push(offset);

        const result = await req.db.query(
            `SELECT p.*, c.name AS category_name, c.slug AS category_slug
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             ${where}
             ORDER BY p.created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        res.json({
            products: result.rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (err) {
        console.error('Get products error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// ====================================
// GET /api/products/:identifier
// Public - get by id, uuid, or slug
// ====================================
router.get('/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;

        // Determine lookup column
        let column;
        if (/^\d+$/.test(identifier)) column = 'p.id';
        else if (/^[0-9a-f-]{36}$/i.test(identifier)) column = 'p.uuid';
        else column = 'p.slug';

        const result = await req.db.query(
            `SELECT p.*, c.name AS category_name, c.slug AS category_slug
             FROM products p
             LEFT JOIN categories c ON p.category_id = c.id
             WHERE ${column} = $1`,
            [identifier]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: 'Not Found', message: 'Product not found' });
        }

        res.json({ product: result.rows[0] });
    } catch (err) {
        console.error('Get product error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// ====================================
// POST /api/products
// Admin only - create product
// ====================================
router.post('/', authenticate, requireAdmin, async (req, res) => {
    try {
        const {
            name, category_id, description,
            base_price, selling_price,
            stock_quantity = 0,
            manufacturer, salt_composition, strength, form,
            batch_number, expiry_date,
            requires_prescription = false,
            primary_image_url
        } = req.body;

        if (!name || !base_price || !selling_price) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'name, base_price, and selling_price are required'
            });
        }

        // Auto-generate slug, ensure uniqueness
        let slug = slugify(name);
        const existing = await req.db.query('SELECT id FROM products WHERE slug = $1', [slug]);
        if (existing.rows.length) slug = `${slug}-${Date.now()}`;

        const discount = base_price > 0
            ? (((base_price - selling_price) / base_price) * 100).toFixed(2)
            : 0;

        const result = await req.db.query(
            `INSERT INTO products
                (name, slug, category_id, description, base_price, selling_price,
                 discount_percentage, stock_quantity, manufacturer, salt_composition,
                 strength, form, batch_number, expiry_date, requires_prescription, primary_image_url)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
             RETURNING *`,
            [
                name, slug, category_id || null, description || null,
                base_price, selling_price, discount, stock_quantity,
                manufacturer || null, salt_composition || null,
                strength || null, form || null,
                batch_number || null, expiry_date || null,
                requires_prescription, primary_image_url || null
            ]
        );

        res.status(201).json({
            message: 'Product created successfully',
            product: result.rows[0]
        });
    } catch (err) {
        console.error('Create product error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// ====================================
// PUT /api/products/:id
// Admin only - update product
// ====================================
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await req.db.query('SELECT * FROM products WHERE id = $1', [id]);
        if (!existing.rows.length) {
            return res.status(404).json({ error: 'Not Found', message: 'Product not found' });
        }

        const current = existing.rows[0];
        const {
            name = current.name,
            category_id = current.category_id,
            description = current.description,
            base_price = current.base_price,
            selling_price = current.selling_price,
            stock_quantity = current.stock_quantity,
            manufacturer = current.manufacturer,
            salt_composition = current.salt_composition,
            strength = current.strength,
            form = current.form,
            batch_number = current.batch_number,
            expiry_date = current.expiry_date,
            requires_prescription = current.requires_prescription,
            primary_image_url = current.primary_image_url,
            is_active = current.is_active
        } = req.body;

        const discount = base_price > 0
            ? (((base_price - selling_price) / base_price) * 100).toFixed(2)
            : 0;

        const result = await req.db.query(
            `UPDATE products SET
                name = $1, category_id = $2, description = $3,
                base_price = $4, selling_price = $5, discount_percentage = $6,
                stock_quantity = $7, manufacturer = $8, salt_composition = $9,
                strength = $10, form = $11, batch_number = $12, expiry_date = $13,
                requires_prescription = $14, primary_image_url = $15,
                is_active = $16, updated_at = CURRENT_TIMESTAMP
             WHERE id = $17
             RETURNING *`,
            [
                name, category_id, description,
                base_price, selling_price, discount,
                stock_quantity, manufacturer, salt_composition,
                strength, form, batch_number, expiry_date,
                requires_prescription, primary_image_url,
                is_active, id
            ]
        );

        res.json({ message: 'Product updated successfully', product: result.rows[0] });
    } catch (err) {
        console.error('Update product error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

// ====================================
// DELETE /api/products/:id
// Admin only - soft delete (sets is_active = false)
// ====================================
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await req.db.query(
            `UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 RETURNING id, name`,
            [id]
        );
        if (!result.rows.length) {
            return res.status(404).json({ error: 'Not Found', message: 'Product not found' });
        }
        res.json({ message: 'Product deactivated successfully', product: result.rows[0] });
    } catch (err) {
        console.error('Delete product error:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

module.exports = router;
