const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');

// POST /api/v1/auth/register (A1)
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
    }

    const { email, password, full_name, phone, shipping_address } = req.body;

    // Check duplicate email
    const existing = await db.query('SELECT user_id FROM "user" WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_EMAIL', message: 'Email already registered' }
      });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      `INSERT INTO "user" (email, password_hash, full_name, phone, shipping_address, role)
       VALUES ($1, $2, $3, $4, $5, 'customer') RETURNING user_id, email, full_name, role, created_at`,
      [email, password_hash, full_name, phone || null, shipping_address || null]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.user_id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.status(201).json({
      success: true,
      data: { user, token }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Registration failed' } });
  }
});

// POST /api/v1/auth/login (A2)
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password required', details: errors.array() }
      });
    }

    const { email, password } = req.body;
    const result = await db.query(
      'SELECT user_id, email, password_hash, full_name, role, is_active FROM "user" WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_DISABLED', message: 'Account is disabled' }
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    const token = jwt.sign({ userId: user.user_id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.json({
      success: true,
      data: {
        user: { user_id: user.user_id, email: user.email, full_name: user.full_name, role: user.role },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Login failed' } });
  }
});

// GET /api/v1/auth/profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT user_id, email, full_name, phone, shipping_address, role, created_at FROM "user" WHERE user_id = $1',
      [req.user.user_id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get profile' } });
  }
});

// PUT /api/v1/auth/profile
router.put('/profile', authenticate, [
  body('full_name').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('shipping_address').optional().trim(),
], async (req, res) => {
  try {
    const { full_name, phone, shipping_address } = req.body;
    const result = await db.query(
      `UPDATE "user" SET 
        full_name = COALESCE($1, full_name), 
        phone = COALESCE($2, phone), 
        shipping_address = COALESCE($3, shipping_address)
       WHERE user_id = $4
       RETURNING user_id, email, full_name, phone, shipping_address, role`,
      [full_name, phone, shipping_address, req.user.user_id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Update failed' } });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', authenticate, (req, res) => {
  const token = jwt.sign({ userId: req.user.user_id, role: req.user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
  res.json({ success: true, data: { token } });
});

module.exports = router;
