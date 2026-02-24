const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/v1/categories - List all categories
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM product p WHERE p.category_id = c.category_id AND p.is_active = true) as product_count
       FROM category c 
       WHERE c.is_active = true 
       ORDER BY c.sort_order, c.name`
    );

    // Build tree structure
    const categories = result.rows;
    const tree = [];
    const map = {};

    categories.forEach(cat => {
      map[cat.category_id] = { ...cat, children: [] };
    });

    categories.forEach(cat => {
      if (cat.parent_id && map[cat.parent_id]) {
        map[cat.parent_id].children.push(map[cat.category_id]);
      } else {
        tree.push(map[cat.category_id]);
      }
    });

    res.json({ success: true, data: tree });
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list categories' } });
  }
});

// GET /api/v1/categories/:id/products - Products by category
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    // Include subcategories
    const countResult = await db.query(
      `SELECT COUNT(*) FROM product p
       WHERE p.is_active = true 
       AND (p.category_id = $1 OR p.category_id IN (SELECT category_id FROM category WHERE parent_id = $1))`,
      [id]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT p.*, c.name as category_name,
        (SELECT image_url FROM product_image pi WHERE pi.product_id = p.product_id AND pi.is_primary = true LIMIT 1) as primary_image
       FROM product p
       LEFT JOIN category c ON p.category_id = c.category_id
       WHERE p.is_active = true 
       AND (p.category_id = $1 OR p.category_id IN (SELECT category_id FROM category WHERE parent_id = $1))
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Category products error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get category products' } });
  }
});

module.exports = router;
