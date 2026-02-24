const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { getPagination, paginationMeta } = require('../utils/helpers');

// =============================================
// Public: Get active promotions
// =============================================

// GET /api/v1/promotions - List active promotions with their products
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT pr.*, 
        (SELECT COUNT(*) FROM product_promotion pp WHERE pp.promotion_id = pr.promotion_id) as product_count
       FROM promotion pr
       WHERE pr.is_active = true 
         AND pr.start_date <= CURRENT_DATE 
         AND pr.end_date >= CURRENT_DATE
       ORDER BY pr.end_date ASC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List promotions error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list promotions' } });
  }
});

// GET /api/v1/promotions/:id/products - Get products in a promotion
router.get('/:id/products', async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);

    const countResult = await db.query(
      `SELECT COUNT(*) FROM product_promotion pp
       JOIN promotion pr ON pp.promotion_id = pr.promotion_id
       JOIN product p ON pp.product_id = p.product_id
       WHERE pp.promotion_id = $1 AND pr.is_active = true AND p.is_active = true
         AND pr.start_date <= CURRENT_DATE AND pr.end_date >= CURRENT_DATE`,
      [req.params.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT p.*, pp.promotional_price, pr.name as promotion_name, pr.type as promotion_type,
        pr.discount_value, pr.end_date as promotion_end_date,
        c.name as category_name,
        (SELECT image_url FROM product_image pi WHERE pi.product_id = p.product_id AND pi.is_primary = true LIMIT 1) as primary_image
       FROM product_promotion pp
       JOIN promotion pr ON pp.promotion_id = pr.promotion_id
       JOIN product p ON pp.product_id = p.product_id
       LEFT JOIN category c ON p.category_id = c.category_id
       WHERE pp.promotion_id = $1 AND pr.is_active = true AND p.is_active = true
         AND pr.start_date <= CURRENT_DATE AND pr.end_date >= CURRENT_DATE
       ORDER BY p.name
       LIMIT $2 OFFSET $3`,
      [req.params.id, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      meta: paginationMeta(page, limit, total)
    });
  } catch (error) {
    console.error('List promotion products error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list promotion products' } });
  }
});

// =============================================
// Admin: Promotion Management (Block U - Promotional Pricing)
// =============================================

// GET /api/v1/promotions/admin/all - List all promotions (admin)
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);

    const countResult = await db.query('SELECT COUNT(*) FROM promotion');
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT pr.*,
        (SELECT COUNT(*) FROM product_promotion pp WHERE pp.promotion_id = pr.promotion_id) as product_count
       FROM promotion pr
       ORDER BY pr.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ success: true, data: result.rows, meta: paginationMeta(page, limit, total) });
  } catch (error) {
    console.error('Admin list promotions error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list promotions' } });
  }
});

// POST /api/v1/promotions/admin - Create promotion (U3)
router.post('/admin', authenticate, requireAdmin, [
  body('name').trim().notEmpty().withMessage('Promotion name is required'),
  body('type').isIn(['percentage', 'fixed', 'special_price']).withMessage('Type must be percentage, fixed, or special_price'),
  body('discount_value').isFloat({ min: 0 }).withMessage('Valid discount_value required'),
  body('start_date').isISO8601().withMessage('Valid start_date required'),
  body('end_date').isISO8601().withMessage('Valid end_date required'),
  body('min_purchase').optional().isFloat({ min: 0 }),
  body('product_ids').optional().isArray(),
], async (req, res) => {
  const client = await db.getClient();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
    }

    const { name, type, discount_value, min_purchase, start_date, end_date, product_ids } = req.body;

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO promotion (name, type, discount_value, min_purchase, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, type, discount_value, min_purchase || 0, start_date, end_date]
    );

    const promotion = result.rows[0];

    // Add products to promotion if provided
    if (product_ids && product_ids.length > 0) {
      for (const productId of product_ids) {
        // Calculate promotional price
        const product = await client.query('SELECT price FROM product WHERE product_id = $1', [productId]);
        if (product.rows.length > 0) {
          let promoPrice;
          if (type === 'percentage') {
            promoPrice = product.rows[0].price * (1 - discount_value / 100);
          } else if (type === 'fixed') {
            promoPrice = Math.max(0, product.rows[0].price - discount_value);
          } else {
            promoPrice = discount_value; // special_price
          }

          await client.query(
            `INSERT INTO product_promotion (product_id, promotion_id, promotional_price)
             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [productId, promotion.promotion_id, promoPrice.toFixed(2)]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: promotion });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create promotion error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create promotion' } });
  } finally {
    client.release();
  }
});

// PUT /api/v1/promotions/admin/:id - Update promotion (U3)
router.put('/admin/:id', authenticate, requireAdmin, [
  body('name').optional().trim().notEmpty(),
  body('type').optional().isIn(['percentage', 'fixed', 'special_price']),
  body('discount_value').optional().isFloat({ min: 0 }),
  body('start_date').optional().isISO8601(),
  body('end_date').optional().isISO8601(),
  body('is_active').optional().isBoolean(),
  body('product_ids').optional().isArray(),
], async (req, res) => {
  const client = await db.getClient();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
    }

    const { id } = req.params;

    const existing = await client.query('SELECT * FROM promotion WHERE promotion_id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Promotion not found' }
      });
    }

    const { name, type, discount_value, min_purchase, start_date, end_date, is_active, product_ids } = req.body;

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE promotion SET
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        discount_value = COALESCE($3, discount_value),
        min_purchase = COALESCE($4, min_purchase),
        start_date = COALESCE($5, start_date),
        end_date = COALESCE($6, end_date),
        is_active = COALESCE($7, is_active)
       WHERE promotion_id = $8
       RETURNING *`,
      [name, type, discount_value, min_purchase, start_date, end_date, is_active, id]
    );

    const promotion = result.rows[0];

    // Update product associations if provided
    if (product_ids && Array.isArray(product_ids)) {
      await client.query('DELETE FROM product_promotion WHERE promotion_id = $1', [id]);
      for (const productId of product_ids) {
        const product = await client.query('SELECT price FROM product WHERE product_id = $1', [productId]);
        if (product.rows.length > 0) {
          let promoPrice;
          const promoType = type || promotion.type;
          const promoDiscount = discount_value || promotion.discount_value;
          if (promoType === 'percentage') {
            promoPrice = product.rows[0].price * (1 - promoDiscount / 100);
          } else if (promoType === 'fixed') {
            promoPrice = Math.max(0, product.rows[0].price - promoDiscount);
          } else {
            promoPrice = promoDiscount;
          }

          await client.query(
            `INSERT INTO product_promotion (product_id, promotion_id, promotional_price)
             VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
            [productId, id, promoPrice.toFixed(2)]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, data: promotion });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update promotion error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Update failed' } });
  } finally {
    client.release();
  }
});

// DELETE /api/v1/promotions/admin/:id - Delete promotion
router.delete('/admin/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM promotion WHERE promotion_id = $1 RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Promotion not found' }
      });
    }
    res.json({ success: true, data: { message: 'Promotion deleted' } });
  } catch (error) {
    console.error('Delete promotion error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Delete failed' } });
  }
});

// POST /api/v1/promotions/admin/:id/products - Add products to promotion
router.post('/admin/:id/products', authenticate, requireAdmin, [
  body('product_ids').isArray({ min: 1 }).withMessage('product_ids array required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
    }

    const promotion = await db.query('SELECT * FROM promotion WHERE promotion_id = $1', [req.params.id]);
    if (promotion.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Promotion not found' }
      });
    }

    const promo = promotion.rows[0];
    const added = [];

    for (const productId of req.body.product_ids) {
      const product = await db.query('SELECT price FROM product WHERE product_id = $1', [productId]);
      if (product.rows.length > 0) {
        let promoPrice;
        if (promo.type === 'percentage') {
          promoPrice = product.rows[0].price * (1 - promo.discount_value / 100);
        } else if (promo.type === 'fixed') {
          promoPrice = Math.max(0, product.rows[0].price - promo.discount_value);
        } else {
          promoPrice = promo.discount_value;
        }

        const result = await db.query(
          `INSERT INTO product_promotion (product_id, promotion_id, promotional_price)
           VALUES ($1, $2, $3) ON CONFLICT DO NOTHING RETURNING *`,
          [productId, req.params.id, promoPrice.toFixed(2)]
        );
        if (result.rows.length > 0) added.push(result.rows[0]);
      }
    }

    res.status(201).json({ success: true, data: added });
  } catch (error) {
    console.error('Add products to promotion error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add products' } });
  }
});

module.exports = router;
