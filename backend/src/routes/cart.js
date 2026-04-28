const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { trackBehavior } = require('../services/recommendations');

// All cart routes require authentication
router.use(authenticate);

// Helper: get or create cart for user
async function getOrCreateCart(userId) {
  let result = await db.query('SELECT cart_id FROM cart WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    result = await db.query(
      'INSERT INTO cart (user_id) VALUES ($1) RETURNING cart_id',
      [userId]
    );
  }
  return result.rows[0].cart_id;
}

// GET /api/v1/cart - Get cart contents (A7)
router.get('/', async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.user_id);
    const items = await db.query(
      `SELECT ci.*, p.name, p.price, p.sale_price, p.slug, p.stock_quantity, p.is_active,
        (SELECT image_url FROM product_image pi WHERE pi.product_id = p.product_id AND pi.is_primary = true LIMIT 1) as image_url,
        (COALESCE(p.sale_price, p.price) * ci.quantity) as line_total
       FROM cart_item ci
       JOIN product p ON ci.product_id = p.product_id
       WHERE ci.cart_id = $1
       ORDER BY ci.added_at DESC`,
      [cartId]
    );

    const totalAmount = items.rows.reduce((sum, item) => sum + parseFloat(item.line_total), 0);

    res.json({
      success: true,
      data: {
        cart_id: cartId,
        items: items.rows,
        total_amount: totalAmount.toFixed(2),
        item_count: items.rows.length
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get cart' } });
  }
});

// POST /api/v1/cart/items - Add item to cart (A8)
router.post('/items', [
  body('product_id').isInt({ min: 1 }),
  body('quantity').optional().isInt({ min: 1 }).default(1),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: errors.array() }
      });
    }

    const { product_id, quantity = 1 } = req.body;

    // Check product exists and is active
    const product = await db.query(
      'SELECT product_id, stock_quantity, is_active FROM product WHERE product_id = $1',
      [product_id]
    );
    if (product.rows.length === 0 || !product.rows[0].is_active) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found or unavailable' }
      });
    }

    if (product.rows[0].stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        error: { code: 'INSUFFICIENT_STOCK', message: 'Not enough stock available' }
      });
    }

    const cartId = await getOrCreateCart(req.user.user_id);

    // Upsert: if item already in cart, increase quantity
    const result = await db.query(
      `INSERT INTO cart_item (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_item.quantity + $3
       RETURNING *`,
      [cartId, product_id, quantity]
    );

    await trackBehavior({
      userId: req.user.user_id,
      productId: Number(product_id),
      actionType: 'ADD_TO_CART',
      metadata: { quantity: Number(quantity) },
    });

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add to cart' } });
  }
});

// PUT /api/v1/cart/items/:id - Update item quantity (A9)
router.put('/items/:id', [
  body('quantity').isInt({ min: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid quantity', details: errors.array() }
      });
    }

    const { id } = req.params;
    const { quantity } = req.body;
    const cartId = await getOrCreateCart(req.user.user_id);

    // Verify item belongs to user's cart
    const item = await db.query(
      'SELECT ci.*, p.stock_quantity FROM cart_item ci JOIN product p ON ci.product_id = p.product_id WHERE ci.cart_item_id = $1 AND ci.cart_id = $2',
      [id, cartId]
    );
    if (item.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cart item not found' }
      });
    }

    if (item.rows[0].stock_quantity < quantity) {
      return res.status(400).json({
        success: false,
        error: { code: 'INSUFFICIENT_STOCK', message: 'Not enough stock available' }
      });
    }

    const result = await db.query(
      'UPDATE cart_item SET quantity = $1 WHERE cart_item_id = $2 RETURNING *',
      [quantity, id]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Update failed' } });
  }
});

// DELETE /api/v1/cart/items/:id - Remove item from cart (A10)
router.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cartId = await getOrCreateCart(req.user.user_id);

    const result = await db.query(
      'DELETE FROM cart_item WHERE cart_item_id = $1 AND cart_id = $2 RETURNING *',
      [id, cartId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Cart item not found' }
      });
    }

    res.json({ success: true, data: { message: 'Item removed from cart' } });
  } catch (error) {
    console.error('Delete cart item error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Delete failed' } });
  }
});

// DELETE /api/v1/cart - Clear entire cart
router.delete('/', async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.user_id);
    await db.query('DELETE FROM cart_item WHERE cart_id = $1', [cartId]);
    res.json({ success: true, data: { message: 'Cart cleared' } });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to clear cart' } });
  }
});

module.exports = router;
