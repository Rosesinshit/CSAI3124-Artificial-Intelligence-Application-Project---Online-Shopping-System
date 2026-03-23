const express = require('express');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { trackBehavior, VALID_ACTION_TYPES } = require('../services/recommendations');

router.use(authenticate);

// POST /api/v1/behaviors - explicit behavior tracking endpoint (Block S)
router.post('/', [
  body('product_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('product_id must be a positive integer'),
  body('action_type').isString().custom((value) => VALID_ACTION_TYPES.has(value)).withMessage('Unsupported action_type'),
  body('session_id').optional().isString(),
  body('metadata').optional().isObject().withMessage('metadata must be an object'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid behavior payload',
          details: errors.array(),
        },
      });
    }

    const behavior = await trackBehavior({
      userId: req.user.user_id,
      productId: req.body.product_id || null,
      actionType: req.body.action_type,
      sessionId: req.body.session_id || null,
      metadata: req.body.metadata || {},
    });

    res.status(201).json({ success: true, data: behavior });
  } catch (error) {
    console.error('Track behavior error:', error);
    res.status(error.status || 500).json({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Failed to track behavior',
      },
    });
  }
});

module.exports = router;