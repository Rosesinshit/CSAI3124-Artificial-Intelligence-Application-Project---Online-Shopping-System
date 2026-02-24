const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { getPagination, paginationMeta } = require('../utils/helpers');

// All wishlist routes require authentication
router.use(authenticate);

// Helper: get or create wishlist for user
async function getOrCreateWishlist(userId) {
  let result = await db.query('SELECT wishlist_id FROM wishlist WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    result = await db.query(
      'INSERT INTO wishlist (user_id) VALUES ($1) RETURNING wishlist_id',
      [userId]
    );
  }
  return result.rows[0].wishlist_id;
}

// GET /api/v1/wishlist - Get wish list items (U1)
router.get('/', async (req, res) => {
  try {
    const wishlistId = await getOrCreateWishlist(req.user.user_id);
    const { page, limit, offset } = getPagination(req.query);

    const countResult = await db.query(
      'SELECT COUNT(*) FROM wishlist_item WHERE wishlist_id = $1',
      [wishlistId]
    );
    const total = parseInt(countResult.rows[0].count);

    const items = await db.query(
      `SELECT wi.*, p.name, p.price, p.sale_price, p.slug, p.stock_quantity, p.is_active,
        p.short_description,
        (SELECT image_url FROM product_image pi WHERE pi.product_id = p.product_id AND pi.is_primary = true LIMIT 1) as image_url,
        CASE 
          WHEN p.sale_price IS NOT NULL AND p.sale_price < wi.price_when_added THEN true
          WHEN p.price < wi.price_when_added THEN true
          ELSE false
        END as price_dropped,
        COALESCE(p.sale_price, p.price) as current_price
       FROM wishlist_item wi
       JOIN product p ON wi.product_id = p.product_id
       WHERE wi.wishlist_id = $1
       ORDER BY wi.added_at DESC
       LIMIT $2 OFFSET $3`,
      [wishlistId, limit, offset]
    );

    res.json({
      success: true,
      data: {
        wishlist_id: wishlistId,
        items: items.rows,
        item_count: total
      },
      meta: paginationMeta(page, limit, total)
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get wish list' } });
  }
});

// POST /api/v1/wishlist/items - Add to wish list (U1)
router.post('/items', [
  body('product_id').isInt({ min: 1 }).withMessage('Valid product_id required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
    }

    const { product_id } = req.body;

    // Check product exists
    const product = await db.query(
      'SELECT product_id, price, sale_price FROM product WHERE product_id = $1 AND is_active = true',
      [product_id]
    );
    if (product.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found or unavailable' }
      });
    }

    const wishlistId = await getOrCreateWishlist(req.user.user_id);
    const currentPrice = product.rows[0].sale_price || product.rows[0].price;

    // Upsert: ignore if already in wishlist
    const result = await db.query(
      `INSERT INTO wishlist_item (wishlist_id, product_id, price_when_added)
       VALUES ($1, $2, $3)
       ON CONFLICT (wishlist_id, product_id) DO NOTHING
       RETURNING *`,
      [wishlistId, product_id, currentPrice]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        success: false,
        error: { code: 'ALREADY_EXISTS', message: 'Product already in wish list' }
      });
    }

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add to wish list' } });
  }
});

// DELETE /api/v1/wishlist/items/:id - Remove from wish list (U1)
router.delete('/items/:id', async (req, res) => {
  try {
    const wishlistId = await getOrCreateWishlist(req.user.user_id);

    const result = await db.query(
      'DELETE FROM wishlist_item WHERE wishlist_item_id = $1 AND wishlist_id = $2 RETURNING *',
      [req.params.id, wishlistId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Wish list item not found' }
      });
    }

    res.json({ success: true, data: { message: 'Item removed from wish list' } });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to remove from wish list' } });
  }
});

// GET /api/v1/wishlist/check/:productId - Check if product is in wishlist
router.get('/check/:productId', async (req, res) => {
  try {
    const wishlistId = await getOrCreateWishlist(req.user.user_id);
    const result = await db.query(
      'SELECT wishlist_item_id FROM wishlist_item WHERE wishlist_id = $1 AND product_id = $2',
      [wishlistId, req.params.productId]
    );
    res.json({
      success: true,
      data: { in_wishlist: result.rows.length > 0, wishlist_item_id: result.rows[0]?.wishlist_item_id || null }
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Check failed' } });
  }
});

// =============================================
// Price Alerts (Block U - Price Drop Notifications)
// =============================================

// POST /api/v1/wishlist/price-alerts - Set price alert (U2)
router.post('/price-alerts', [
  body('product_id').isInt({ min: 1 }).withMessage('Valid product_id required'),
  body('target_price').isFloat({ min: 0 }).withMessage('Valid target_price required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
    }

    const { product_id, target_price } = req.body;

    // Check product exists
    const product = await db.query(
      'SELECT product_id, price, sale_price FROM product WHERE product_id = $1 AND is_active = true',
      [product_id]
    );
    if (product.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }

    // Upsert price alert
    const result = await db.query(
      `INSERT INTO price_alert (user_id, product_id, target_price)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) 
       DO UPDATE SET target_price = $3, is_active = true, notified_at = NULL
       RETURNING *`,
      [req.user.user_id, product_id, target_price]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Set price alert error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to set price alert' } });
  }
});

// GET /api/v1/wishlist/price-alerts - Get user's price alerts (U2)
router.get('/price-alerts', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT pa.*, p.name, p.price, p.sale_price, p.slug, p.is_active as product_active,
        COALESCE(p.sale_price, p.price) as current_price,
        (SELECT image_url FROM product_image pi WHERE pi.product_id = p.product_id AND pi.is_primary = true LIMIT 1) as image_url,
        CASE WHEN COALESCE(p.sale_price, p.price) <= pa.target_price THEN true ELSE false END as target_reached
       FROM price_alert pa
       JOIN product p ON pa.product_id = p.product_id
       WHERE pa.user_id = $1
       ORDER BY pa.created_at DESC`,
      [req.user.user_id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get price alerts error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get price alerts' } });
  }
});

// DELETE /api/v1/wishlist/price-alerts/:id - Remove price alert (U2)
router.delete('/price-alerts/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM price_alert WHERE alert_id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Price alert not found' }
      });
    }

    res.json({ success: true, data: { message: 'Price alert removed' } });
  } catch (error) {
    console.error('Delete price alert error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete price alert' } });
  }
});

// GET /api/v1/wishlist/notifications - Get price drop notifications (U2)
router.get('/notifications', async (req, res) => {
  try {
    // Check wishlist items with price drops
    const wishlistId = await getOrCreateWishlist(req.user.user_id);
    
    const wishlistDrops = await db.query(
      `SELECT wi.*, p.name, p.price, p.sale_price, p.slug,
        COALESCE(p.sale_price, p.price) as current_price,
        (SELECT image_url FROM product_image pi WHERE pi.product_id = p.product_id AND pi.is_primary = true LIMIT 1) as image_url
       FROM wishlist_item wi
       JOIN product p ON wi.product_id = p.product_id
       WHERE wi.wishlist_id = $1
         AND p.is_active = true
         AND COALESCE(p.sale_price, p.price) < wi.price_when_added`,
      [wishlistId]
    );

    // Check price alerts that reached target
    const alertsReached = await db.query(
      `SELECT pa.*, p.name, p.price, p.sale_price, p.slug,
        COALESCE(p.sale_price, p.price) as current_price,
        (SELECT image_url FROM product_image pi WHERE pi.product_id = p.product_id AND pi.is_primary = true LIMIT 1) as image_url
       FROM price_alert pa
       JOIN product p ON pa.product_id = p.product_id
       WHERE pa.user_id = $1
         AND pa.is_active = true
         AND COALESCE(p.sale_price, p.price) <= pa.target_price`,
      [req.user.user_id]
    );

    res.json({
      success: true,
      data: {
        price_drops: wishlistDrops.rows,
        alerts_reached: alertsReached.rows,
        total_notifications: wishlistDrops.rows.length + alertsReached.rows.length
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get notifications' } });
  }
});

module.exports = router;
