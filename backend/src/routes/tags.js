const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /api/v1/tags - List all tags
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT pt.*, COUNT(ptm.product_id) as product_count
       FROM product_tag pt
       LEFT JOIN product_tag_mapping ptm ON pt.tag_id = ptm.tag_id
       GROUP BY pt.tag_id
       ORDER BY pt.name`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('List tags error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list tags' } });
  }
});

module.exports = router;
