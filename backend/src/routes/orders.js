const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { generateOrderNumber, getPagination, paginationMeta } = require('../utils/helpers');

router.use(authenticate);

// POST /api/v1/orders - Create order from cart (A11-A13)
router.post('/', [
  body('shipping_address').trim().notEmpty().withMessage('Shipping address required'),
  body('notes').optional().trim(),
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

    await client.query('BEGIN');

    // Get cart items
    const cartResult = await client.query(
      'SELECT cart_id FROM cart WHERE user_id = $1', [req.user.user_id]
    );
    if (cartResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: { code: 'EMPTY_CART', message: 'Cart is empty' }
      });
    }

    const cartId = cartResult.rows[0].cart_id;
    const items = await client.query(
      `SELECT ci.*, p.name, p.price, p.sale_price, p.stock_quantity, p.is_active
       FROM cart_item ci
       JOIN product p ON ci.product_id = p.product_id
       WHERE ci.cart_id = $1`,
      [cartId]
    );

    if (items.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: { code: 'EMPTY_CART', message: 'Cart is empty' }
      });
    }

    // Validate stock and calculate total
    let totalAmount = 0;
    const orderItems = [];
    for (const item of items.rows) {
      if (!item.is_active) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: { code: 'PRODUCT_UNAVAILABLE', message: `Product "${item.name}" is no longer available` }
        });
      }
      if (item.stock_quantity < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: { code: 'INSUFFICIENT_STOCK', message: `Insufficient stock for "${item.name}"` }
        });
      }

      const unitPrice = item.sale_price || item.price;
      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;
      orderItems.push({
        product_id: item.product_id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal: subtotal
      });
    }

    // Create order
    const orderNumber = generateOrderNumber();
    const orderResult = await client.query(
      `INSERT INTO purchase_order (order_number, user_id, total_amount, status, shipping_address, notes)
       VALUES ($1, $2, $3, 'PENDING', $4, $5)
       RETURNING *`,
      [orderNumber, req.user.user_id, totalAmount, req.body.shipping_address, req.body.notes || null]
    );
    const order = orderResult.rows[0];

    // Create order items
    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_item (order_id, product_id, product_name, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [order.order_id, item.product_id, item.product_name, item.quantity, item.unit_price, item.subtotal]
      );

      // Reduce stock
      await client.query(
        'UPDATE product SET stock_quantity = stock_quantity - $1 WHERE product_id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Record initial status history (B4)
    await client.query(
      `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes)
       VALUES ($1, NULL, 'PENDING', $2, 'Order placed')`,
      [order.order_id, req.user.email]
    );

    // Clear cart
    await client.query('DELETE FROM cart_item WHERE cart_id = $1', [cartId]);

    await client.query('COMMIT');

    // Return order with items
    order.items = orderItems;
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create order error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Order creation failed' } });
  } finally {
    client.release();
  }
});

// GET /api/v1/orders - List user orders (B3 - with status filtering)
router.get('/', async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status } = req.query;

    let whereClause = 'WHERE o.user_id = $1';
    const params = [req.user.user_id];
    let paramIndex = 2;

    // Status filtering (B3)
    if (status) {
      whereClause += ` AND o.status = $${paramIndex}`;
      params.push(status.toUpperCase());
      paramIndex++;
    }

    const countResult = await db.query(
      `SELECT COUNT(*) FROM purchase_order o ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT o.* FROM purchase_order o
       ${whereClause}
       ORDER BY o.order_date DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    // Get items for each order
    const orders = [];
    for (const order of result.rows) {
      const items = await db.query(
        `SELECT oi.*,
          (SELECT image_url FROM product_image pi WHERE pi.product_id = oi.product_id AND pi.is_primary = true LIMIT 1) as image_url
         FROM order_item oi WHERE oi.order_id = $1`,
        [order.order_id]
      );
      orders.push({ ...order, items: items.rows });
    }

    res.json({
      success: true,
      data: orders,
      meta: paginationMeta(page, limit, total)
    });
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list orders' } });
  }
});

// GET /api/v1/orders/:id - Get order detail
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM purchase_order WHERE order_id = $1 AND user_id = $2',
      [req.params.id, req.user.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' }
      });
    }

    const order = result.rows[0];

    // Get items
    const items = await db.query(
      `SELECT oi.*,
        (SELECT image_url FROM product_image pi WHERE pi.product_id = oi.product_id AND pi.is_primary = true LIMIT 1) as image_url
       FROM order_item oi WHERE oi.order_id = $1`,
      [order.order_id]
    );

    // Get status history (B4)
    const history = await db.query(
      'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY changed_at ASC',
      [order.order_id]
    );

    order.items = items.rows;
    order.status_history = history.rows;

    res.json({ success: true, data: order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get order' } });
  }
});

// PUT /api/v1/orders/:id/cancel - Cancel order
router.put('/:id/cancel', async (req, res) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      'SELECT * FROM purchase_order WHERE order_id = $1 AND user_id = $2 FOR UPDATE',
      [req.params.id, req.user.user_id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' }
      });
    }

    const order = result.rows[0];
    if (!['PENDING', 'HOLD'].includes(order.status)) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: `Cannot cancel order with status: ${order.status}` }
      });
    }

    // Update order status
    await client.query(
      "UPDATE purchase_order SET status = 'CANCELLED', cancelled_date = CURRENT_TIMESTAMP WHERE order_id = $1",
      [order.order_id]
    );

    // Restore stock
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

    // Record status change (B4)
    await client.query(
      `INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes)
       VALUES ($1, $2, 'CANCELLED', $3, 'Cancelled by customer')`,
      [order.order_id, order.status, req.user.email]
    );

    await client.query('COMMIT');
    res.json({ success: true, data: { message: 'Order cancelled successfully' } });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel order error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Cancellation failed' } });
  } finally {
    client.release();
  }
});

// GET /api/v1/orders/:id/history - Get order status history (B4)
router.get('/:id/history', async (req, res) => {
  try {
    // Verify order belongs to user
    const order = await db.query(
      'SELECT order_id FROM purchase_order WHERE order_id = $1 AND user_id = $2',
      [req.params.id, req.user.user_id]
    );
    if (order.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found' }
      });
    }

    const result = await db.query(
      'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY changed_at ASC',
      [req.params.id]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Order history error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get history' } });
  }
});

module.exports = router;
