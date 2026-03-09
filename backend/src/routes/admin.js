const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { body, validationResult } = require('express-validator');
const { slugify, getPagination, paginationMeta } = require('../utils/helpers');
const fs = require('fs');
const path = require('path');

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(requireAdmin);

// =============================================
// Product Management (A14-A17)
// =============================================

// GET /api/v1/admin/products - List all products
router.get('/products', async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { q, is_active, sort } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (q) {
      whereClause += ` AND (p.name ILIKE $${paramIndex} OR p.sku ILIKE $${paramIndex} OR CAST(p.product_id AS TEXT) ILIKE $${paramIndex})`;
      params.push(`%${q}%`);
      paramIndex++;
    }
    if (is_active !== undefined) {
      whereClause += ` AND p.is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }

    // Sort options for admin
    const sortOptions = {
      newest: 'p.created_at DESC',
      oldest: 'p.created_at ASC',
      name_asc: 'p.name ASC',
      name_desc: 'p.name DESC',
      price_asc: 'p.price ASC',
      price_desc: 'p.price DESC',
      stock_asc: 'p.stock_quantity ASC',
      stock_desc: 'p.stock_quantity DESC',
      id_asc: 'p.product_id ASC',
      id_desc: 'p.product_id DESC',
    };
    const orderBy = sortOptions[sort] || sortOptions.newest;

    const countResult = await db.query(`SELECT COUNT(*) FROM product p ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT p.*, c.name as category_name,
        (SELECT image_url FROM product_image pi WHERE pi.product_id = p.product_id AND pi.is_primary = true LIMIT 1) as primary_image
       FROM product p
       LEFT JOIN category c ON p.category_id = c.category_id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ success: true, data: result.rows, meta: paginationMeta(page, limit, total) });
  } catch (error) {
    console.error('Admin list products error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list products' } });
  }
});

// POST /api/v1/admin/products - Create product (A14)
router.post('/products', [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('sku').trim().notEmpty().withMessage('SKU is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price required'),
  body('description').optional().trim(),
  body('short_description').optional().trim(),
  body('sale_price').optional().isFloat({ min: 0 }),
  body('stock_quantity').optional().isInt({ min: 0 }),
  body('category_id').optional().isInt(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
    }

    const {
      name, sku, price, description, short_description,
      sale_price, stock_quantity = 0, category_id,
      meta_title, meta_description, meta_keywords,
      tags, attributes
    } = req.body;

    const slug = slugify(name) + '-' + Date.now().toString(36);

    // Check duplicate SKU
    const existing = await db.query('SELECT product_id FROM product WHERE sku = $1', [sku]);
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'DUPLICATE_SKU', message: 'SKU already exists' }
      });
    }

    const result = await db.query(
      `INSERT INTO product (sku, name, slug, short_description, description, price, sale_price, stock_quantity, category_id, meta_title, meta_description, meta_keywords)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [sku, name, slug, short_description || null, description || null, price, sale_price || null, stock_quantity, category_id || null, meta_title || null, meta_description || null, meta_keywords || null]
    );

    const product = result.rows[0];

    // Add tags if provided
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        const tagSlug = slugify(tagName);
        const tagResult = await db.query(
          `INSERT INTO product_tag (name, slug) VALUES ($1, $2)
           ON CONFLICT (slug) DO UPDATE SET name = $1
           RETURNING tag_id`,
          [tagName, tagSlug]
        );
        await db.query(
          'INSERT INTO product_tag_mapping (product_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [product.product_id, tagResult.rows[0].tag_id]
        );
      }
    }

    // Add attributes if provided (C1, C5)
    if (attributes && Array.isArray(attributes)) {
      for (const attr of attributes) {
        await db.query(
          'INSERT INTO product_attribute (product_id, attribute_name, attribute_value, is_html) VALUES ($1, $2, $3, $4)',
          [product.product_id, attr.name, attr.value, attr.is_html || false]
        );
      }
    }

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Product creation failed' } });
  }
});

// PUT /api/v1/admin/products/:id - Update product (A15, C5)
router.put('/products/:id', [
  body('name').optional().trim().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
], async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await db.query('SELECT * FROM product WHERE product_id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }

    const {
      name, sku, price, description, short_description,
      sale_price, stock_quantity, category_id,
      meta_title, meta_description, meta_keywords, is_active,
      tags, attributes
    } = req.body;

    const result = await db.query(
      `UPDATE product SET
        name = COALESCE($1, name),
        sku = COALESCE($2, sku),
        price = COALESCE($3, price),
        description = COALESCE($4, description),
        short_description = COALESCE($5, short_description),
        sale_price = $6,
        stock_quantity = COALESCE($7, stock_quantity),
        category_id = $8,
        meta_title = COALESCE($9, meta_title),
        meta_description = COALESCE($10, meta_description),
        meta_keywords = COALESCE($11, meta_keywords),
        is_active = COALESCE($12, is_active)
       WHERE product_id = $13
       RETURNING *`,
      [name, sku, price, description, short_description,
       sale_price !== undefined ? sale_price : existing.rows[0].sale_price,
       stock_quantity, category_id !== undefined ? category_id : existing.rows[0].category_id,
       meta_title, meta_description, meta_keywords, is_active, id]
    );

    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      await db.query('DELETE FROM product_tag_mapping WHERE product_id = $1', [id]);
      for (const tagName of tags) {
        const tagSlug = slugify(tagName);
        const tagResult = await db.query(
          `INSERT INTO product_tag (name, slug) VALUES ($1, $2)
           ON CONFLICT (slug) DO UPDATE SET name = $1
           RETURNING tag_id`,
          [tagName, tagSlug]
        );
        await db.query(
          'INSERT INTO product_tag_mapping (product_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, tagResult.rows[0].tag_id]
        );
      }
    }

    // Update attributes if provided (C5)
    if (attributes && Array.isArray(attributes)) {
      await db.query('DELETE FROM product_attribute WHERE product_id = $1', [id]);
      for (const attr of attributes) {
        await db.query(
          'INSERT INTO product_attribute (product_id, attribute_name, attribute_value, is_html) VALUES ($1, $2, $3, $4)',
          [id, attr.name, attr.value, attr.is_html || false]
        );
      }
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Update failed' } });
  }
});

// DELETE /api/v1/admin/products/:id - Delete product (A16)
router.delete('/products/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM product WHERE product_id = $1 RETURNING product_id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }
    res.json({ success: true, data: { message: 'Product deleted' } });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Delete failed' } });
  }
});

// PUT /api/v1/admin/products/:id/status - Toggle product active (A17)
router.put('/products/:id/status', [
  body('is_active').isBoolean(),
], async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE product SET is_active = $1 WHERE product_id = $2 RETURNING *',
      [req.body.is_active, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Status update failed' } });
  }
});

// =============================================
// Product Images (B1)
// =============================================

// POST /api/v1/admin/products/:id/images - Upload product images (B1)
router.post('/products/:id/images', upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;

    // Verify product exists
    const product = await db.query('SELECT product_id FROM product WHERE product_id = $1', [id]);
    if (product.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILES', message: 'No image files uploaded' }
      });
    }

    // Check if product has existing images
    const existingImages = await db.query(
      'SELECT COUNT(*) FROM product_image WHERE product_id = $1', [id]
    );
    const hasExisting = parseInt(existingImages.rows[0].count) > 0;

    const images = [];
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const imageUrl = `/uploads/products/${file.filename}`;
      const isPrimary = !hasExisting && i === 0; // First image is primary if no existing images
      const altText = req.body.alt_text || '';

      const result = await db.query(
        `INSERT INTO product_image (product_id, image_url, alt_text, sort_order, is_primary)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [id, imageUrl, altText, i, isPrimary]
      );
      images.push(result.rows[0]);
    }

    res.status(201).json({ success: true, data: images });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Upload failed' } });
  }
});

// DELETE /api/v1/admin/products/:id/images/:imageId - Delete image
router.delete('/products/:id/images/:imageId', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM product_image WHERE image_id = $1 AND product_id = $2 RETURNING *',
      [req.params.imageId, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Image not found' }
      });
    }

    // Try to delete the file
    const imageUrl = result.rows[0].image_url;
    const filePath = path.join(__dirname, '../..', imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, data: { message: 'Image deleted' } });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Delete failed' } });
  }
});

// =============================================
// Order Management (A18-A20, B2)
// =============================================

// GET /api/v1/admin/orders - List all orders (A18)
router.get('/orders', async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status) {
      whereClause += ` AND o.status = $${paramIndex}`;
      params.push(status.toUpperCase());
      paramIndex++;
    }

    const countResult = await db.query(`SELECT COUNT(*) FROM purchase_order o ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT o.*, u.full_name as customer_name, u.email as customer_email
       FROM purchase_order o
       JOIN "user" u ON o.user_id = u.user_id
       ${whereClause}
       ORDER BY o.order_date DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({ success: true, data: result.rows, meta: paginationMeta(page, limit, total) });
  } catch (error) {
    console.error('Admin list orders error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list orders' } });
  }
});

// GET /api/v1/admin/orders/:id - Get order detail (A19)
router.get('/orders/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*, u.full_name as customer_name, u.email as customer_email
       FROM purchase_order o
       JOIN "user" u ON o.user_id = u.user_id
       WHERE o.order_id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' }
      });
    }

    const order = result.rows[0];
    const items = await db.query(
      `SELECT oi.*,
        (SELECT image_url FROM product_image pi WHERE pi.product_id = oi.product_id AND pi.is_primary = true LIMIT 1) as image_url
       FROM order_item oi WHERE oi.order_id = $1`,
      [order.order_id]
    );
    const history = await db.query(
      'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY changed_at ASC',
      [order.order_id]
    );

    order.items = items.rows;
    order.status_history = history.rows;

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Admin get order error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get order' } });
  }
});

// PUT /api/v1/admin/orders/:id/status - Update order status (A20, B2)
router.put('/orders/:id/status', [
  body('status').isIn(['PENDING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'HOLD']),
  body('notes').optional().trim(),
], async (req, res) => {
  const client = await db.getClient();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid status', details: errors.array() }
      });
    }

    await client.query('BEGIN');

    const result = await client.query(
      'SELECT * FROM purchase_order WHERE order_id = $1 FOR UPDATE',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' }
      });
    }

    const order = result.rows[0];
    const newStatus = req.body.status;
    const oldStatus = order.status;

    // Validate status transitions (B2)
    const validTransitions = {
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['SHIPPED', 'HOLD'],
      'SHIPPED': ['COMPLETED'],
      'COMPLETED': [],
      'CANCELLED': [],
      'HOLD': ['SHIPPED', 'CANCELLED']
    };

    if (!validTransitions[oldStatus].includes(newStatus)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TRANSITION', message: `Cannot transition from ${oldStatus} to ${newStatus}` }
      });
    }

    // Update order with appropriate date fields
    let dateUpdate = '';
    if (newStatus === 'SHIPPED') dateUpdate = ', shipped_date = CURRENT_TIMESTAMP';
    else if (newStatus === 'COMPLETED') dateUpdate = ', completed_date = CURRENT_TIMESTAMP';
    else if (newStatus === 'CANCELLED') dateUpdate = ', cancelled_date = CURRENT_TIMESTAMP';

    await client.query(
      `UPDATE purchase_order SET status = $1 ${dateUpdate} WHERE order_id = $2`,
      [newStatus, order.order_id]
    );

    // If cancelled, restore stock
    if (newStatus === 'CANCELLED') {
      const items = await client.query(
        'SELECT product_id, quantity FROM order_item WHERE order_id = $1',
        [order.order_id]
      );
      for (const item of items.rows) {
        await client.query(
          'UPDATE product SET stock_quantity = stock_quantity + $1 WHERE product_id = $2',
          [item.quantity, item.product_id]
        );
      }
    }

    // Record status change (B4)
    await client.query(
      `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [order.order_id, oldStatus, newStatus, req.user.email, req.body.notes || null]
    );

    await client.query('COMMIT');
    res.json({ success: true, data: { message: `Order status updated to ${newStatus}` } });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Status update failed' } });
  } finally {
    client.release();
  }
});

// =============================================
// Category Management
// =============================================

router.get('/categories', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM category ORDER BY sort_order, name');
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list categories' } });
  }
});

router.post('/categories', [
  body('name').trim().notEmpty(),
  body('parent_id').optional().isInt(),
], async (req, res) => {
  try {
    const { name, description, parent_id, sort_order } = req.body;
    const slug = slugify(name);
    const result = await db.query(
      'INSERT INTO category (name, slug, description, parent_id, sort_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, slug, description || null, parent_id || null, sort_order || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create category' } });
  }
});

router.put('/categories/:id', async (req, res) => {
  try {
    const { name, description, parent_id, sort_order, is_active } = req.body;
    const result = await db.query(
      `UPDATE category SET 
        name = COALESCE($1, name), description = COALESCE($2, description),
        parent_id = $3, sort_order = COALESCE($4, sort_order), is_active = COALESCE($5, is_active)
       WHERE category_id = $6 RETURNING *`,
      [name, description, parent_id !== undefined ? parent_id : null, sort_order, is_active, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Update failed' } });
  }
});

module.exports = router;
