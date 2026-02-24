const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { optionalAuth } = require('../middleware/auth');
const { getPagination, paginationMeta } = require('../utils/helpers');

// GET /api/v1/products - List products (paginated) (A3)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { category, sort } = req.query;

    let whereClause = 'WHERE p.is_active = true';
    const params = [];
    let paramIndex = 1;

    if (category) {
      whereClause += ` AND p.category_id = $${paramIndex}`;
      params.push(parseInt(category));
      paramIndex++;
    }

    let orderBy = 'ORDER BY p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'ORDER BY p.price ASC';
    else if (sort === 'price_desc') orderBy = 'ORDER BY p.price DESC';
    else if (sort === 'name') orderBy = 'ORDER BY p.name ASC';
    else if (sort === 'newest') orderBy = 'ORDER BY p.created_at DESC';

    // Count total
    const countResult = await db.query(
      `SELECT COUNT(*) FROM product p ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get products with primary image and active promotional pricing (Block U)
    const result = await db.query(
      `SELECT p.*, c.name as category_name,
        (SELECT image_url FROM product_image pi WHERE pi.product_id = p.product_id AND pi.is_primary = true LIMIT 1) as primary_image,
        (SELECT pp.promotional_price FROM product_promotion pp
         JOIN promotion pr ON pp.promotion_id = pr.promotion_id
         WHERE pp.product_id = p.product_id AND pr.is_active = true
           AND pr.start_date <= CURRENT_DATE AND pr.end_date >= CURRENT_DATE
         ORDER BY pp.promotional_price ASC LIMIT 1) as promotional_price,
        (SELECT pr.name FROM product_promotion pp
         JOIN promotion pr ON pp.promotion_id = pr.promotion_id
         WHERE pp.product_id = p.product_id AND pr.is_active = true
           AND pr.start_date <= CURRENT_DATE AND pr.end_date >= CURRENT_DATE
         ORDER BY pp.promotional_price ASC LIMIT 1) as promotion_name
       FROM product p
       LEFT JOIN category c ON p.category_id = c.category_id
       ${whereClause}
       ${orderBy}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      meta: paginationMeta(page, limit, total)
    });
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list products' } });
  }
});

// GET /api/v1/products/search - Search products (C2, C3)
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { q, category, tags, min_price, max_price, sort } = req.query;

    let whereClause = 'WHERE p.is_active = true';
    const params = [];
    let paramIndex = 1;

    // Keyword search across name, description, short_description, and attributes (C2)
    if (q && q.trim()) {
      whereClause += ` AND (
        to_tsvector('english', p.name) @@ plainto_tsquery('english', $${paramIndex})
        OR to_tsvector('english', COALESCE(p.description, '')) @@ plainto_tsquery('english', $${paramIndex})
        OR to_tsvector('english', COALESCE(p.short_description, '')) @@ plainto_tsquery('english', $${paramIndex})
        OR p.name ILIKE $${paramIndex + 1}
        OR p.short_description ILIKE $${paramIndex + 1}
        OR EXISTS (
          SELECT 1 FROM product_attribute pa 
          WHERE pa.product_id = p.product_id 
          AND (to_tsvector('english', pa.attribute_value) @@ plainto_tsquery('english', $${paramIndex})
               OR pa.attribute_value ILIKE $${paramIndex + 1})
        )
      )`;
      params.push(q.trim());
      params.push(`%${q.trim()}%`);
      paramIndex += 2;
    }

    // Category filter (C3)
    if (category) {
      whereClause += ` AND p.category_id = $${paramIndex}`;
      params.push(parseInt(category));
      paramIndex++;
    }

    // Price filters (C3)
    if (min_price) {
      whereClause += ` AND p.price >= $${paramIndex}`;
      params.push(parseFloat(min_price));
      paramIndex++;
    }
    if (max_price) {
      whereClause += ` AND p.price <= $${paramIndex}`;
      params.push(parseFloat(max_price));
      paramIndex++;
    }

    // Tag filter (C3)
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      if (tagList.length > 0) {
        whereClause += ` AND EXISTS (
          SELECT 1 FROM product_tag_mapping ptm
          JOIN product_tag pt ON ptm.tag_id = pt.tag_id
          WHERE ptm.product_id = p.product_id 
          AND pt.slug = ANY($${paramIndex})
        )`;
        params.push(tagList);
        paramIndex++;
      }
    }

    let orderBy = 'ORDER BY p.created_at DESC';
    if (sort === 'price_asc') orderBy = 'ORDER BY p.price ASC';
    else if (sort === 'price_desc') orderBy = 'ORDER BY p.price DESC';
    else if (sort === 'name') orderBy = 'ORDER BY p.name ASC';
    else if (sort === 'newest') orderBy = 'ORDER BY p.created_at DESC';

    const countResult = await db.query(
      `SELECT COUNT(DISTINCT p.product_id) FROM product p ${whereClause}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await db.query(
      `SELECT DISTINCT p.*, c.name as category_name,
        (SELECT image_url FROM product_image pi WHERE pi.product_id = p.product_id AND pi.is_primary = true LIMIT 1) as primary_image
       FROM product p
       LEFT JOIN category c ON p.category_id = c.category_id
       ${whereClause}
       ${orderBy}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows,
      meta: paginationMeta(page, limit, total)
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Search failed' } });
  }
});

// GET /api/v1/products/:id - Get product detail (A4-A6, Y1 - supports id or slug)
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    // Support both numeric ID and slug lookups for SEO-friendly URLs (Block Y)
    const isNumeric = /^\d+$/.test(id);
    const result = await db.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM product p 
       LEFT JOIN category c ON p.category_id = c.category_id
       WHERE ${isNumeric ? 'p.product_id = $1' : 'p.slug = $1'} AND p.is_active = true`,
      [isNumeric ? parseInt(id) : id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }

    const product = result.rows[0];

    // Get active promotional pricing (Block U)
    const promotions = await db.query(
      `SELECT pp.promotional_price, pr.name as promotion_name, pr.type as promotion_type,
        pr.discount_value, pr.end_date as promotion_end_date
       FROM product_promotion pp
       JOIN promotion pr ON pp.promotion_id = pr.promotion_id
       WHERE pp.product_id = $1 AND pr.is_active = true
         AND pr.start_date <= CURRENT_DATE AND pr.end_date >= CURRENT_DATE
       ORDER BY pp.promotional_price ASC`,
      [id]
    );
    if (promotions.rows.length > 0) {
      product.promotional_price = promotions.rows[0].promotional_price;
      product.promotion_name = promotions.rows[0].promotion_name;
      product.promotion_end_date = promotions.rows[0].promotion_end_date;
    }

    // Get images (B1)
    const images = await db.query(
      'SELECT * FROM product_image WHERE product_id = $1 ORDER BY sort_order, image_id',
      [id]
    );

    // Get attributes (C1)
    const attributes = await db.query(
      'SELECT * FROM product_attribute WHERE product_id = $1 ORDER BY attribute_id',
      [id]
    );

    // Get tags
    const tags = await db.query(
      `SELECT pt.* FROM product_tag pt
       JOIN product_tag_mapping ptm ON pt.tag_id = ptm.tag_id
       WHERE ptm.product_id = $1`,
      [id]
    );

    product.images = images.rows;
    product.attributes = attributes.rows;
    product.tags = tags.rows;

    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get product' } });
  }
});

// GET /api/v1/products/:id/images - Get product images (B1)
router.get('/:id/images', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM product_image WHERE product_id = $1 ORDER BY sort_order, image_id',
      [req.params.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get images' } });
  }
});

// GET /api/v1/products/:id/related - Get related products (C4)
router.get('/:id/related', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(20, parseInt(req.query.limit) || 6);

    // Get current product's category and tags
    const product = await db.query(
      'SELECT product_id, category_id FROM product WHERE product_id = $1', [id]
    );
    if (product.rows.length === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } });
    }

    const { category_id } = product.rows[0];

    // Get products from same category or sharing tags, excluding current product
    const result = await db.query(
      `SELECT DISTINCT p.*, c.name as category_name,
        (SELECT image_url FROM product_image pi WHERE pi.product_id = p.product_id AND pi.is_primary = true LIMIT 1) as primary_image,
        (
          CASE WHEN p.category_id = $2 THEN 2 ELSE 0 END +
          (SELECT COUNT(*) FROM product_tag_mapping ptm1
           JOIN product_tag_mapping ptm2 ON ptm1.tag_id = ptm2.tag_id
           WHERE ptm1.product_id = p.product_id AND ptm2.product_id = $1)
        ) as relevance_score
       FROM product p
       LEFT JOIN category c ON p.category_id = c.category_id
       WHERE p.product_id != $1 
         AND p.is_active = true
         AND (
           p.category_id = $2
           OR EXISTS (
             SELECT 1 FROM product_tag_mapping ptm1
             JOIN product_tag_mapping ptm2 ON ptm1.tag_id = ptm2.tag_id
             WHERE ptm1.product_id = p.product_id AND ptm2.product_id = $1
           )
         )
       ORDER BY relevance_score DESC, p.created_at DESC
       LIMIT $3`,
      [id, category_id, limit]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Related products error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get related products' } });
  }
});

module.exports = router;
