const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const {
  getPersonalizedRecommendations,
  getPopularRecommendations,
  getSimilarRecommendations,
  normalizeLimit,
} = require('../services/recommendations');
const { getSemanticServiceHealth } = require('../services/semanticEmbeddings');

// GET /api/v1/recommendations - personalized recommendations (Block S)
router.get('/', authenticate, async (req, res) => {
  try {
    const limit = normalizeLimit(req.query.limit, 10);
    const recommendations = await getPersonalizedRecommendations(req.user.user_id, limit);

    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Get personalized recommendations error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to get personalized recommendations',
      },
    });
  }
});

// GET /api/v1/recommendations/popular - popular products (Block S)
router.get('/popular', optionalAuth, async (req, res) => {
  try {
    const limit = normalizeLimit(req.query.limit, 10);
    const categoryId = req.query.category_id ? Number(req.query.category_id) : null;
    const recommendations = await getPopularRecommendations({ limit, categoryId });

    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Get popular recommendations error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to get popular products',
      },
    });
  }
});

// GET /api/v1/recommendations/similar/:productId - similar products (Block S)
router.get('/similar/:productId', optionalAuth, async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const limit = normalizeLimit(req.query.limit, 6);

    if (!Number.isInteger(productId) || productId < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid productId is required',
        },
      });
    }

    const recommendations = await getSimilarRecommendations(productId, limit);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Get similar recommendations error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to get similar products',
      },
    });
  }
});

// GET /api/v1/recommendations/semantic/health - semantic AI service health
router.get('/semantic/health', async (req, res) => {
  try {
    const health = await getSemanticServiceHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    console.error('Get semantic service health error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to reach semantic AI service',
      },
    });
  }
});

module.exports = router;