const db = require('../config/database');

const ACTION_WEIGHTS = {
  VIEW: 1.0,
  ADD_TO_CART: 3.0,
  PURCHASE: 5.0,
  WISHLIST_ADD: 2.0,
  SEARCH: 0.5,
  CLICK_RECOMMENDATION: 2.0,
};

const VALID_ACTION_TYPES = new Set(Object.keys(ACTION_WEIGHTS));

function normalizeLimit(limit, fallback, max = 20) {
  return Math.min(max, Math.max(1, parseInt(limit, 10) || fallback));
}

function buildWeightCase(alias = 'ub') {
  return `CASE ${alias}.action_type
    WHEN 'VIEW' THEN 1.0
    WHEN 'ADD_TO_CART' THEN 3.0
    WHEN 'PURCHASE' THEN 5.0
    WHEN 'WISHLIST_ADD' THEN 2.0
    WHEN 'SEARCH' THEN 0.5
    WHEN 'CLICK_RECOMMENDATION' THEN 2.0
    ELSE 0
  END`;
}

function clampScore(value) {
  return Math.max(0, Number.parseFloat(value || 0));
}

function parseMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  return metadata;
}

function mergeScoreMaps(scoreMaps) {
  const merged = new Map();

  for (const { scores, weight, reason } of scoreMaps) {
    for (const entry of scores) {
      const productId = Number(entry.product_id);
      const current = merged.get(productId) || {
        product_id: productId,
        score: 0,
        reasons: new Set(),
        sources: new Set(),
      };

      current.score += clampScore(entry.score) * weight;
      if (reason) current.reasons.add(reason);
      if (entry.reason) current.reasons.add(entry.reason);
      if (entry.algorithm_type) current.sources.add(entry.algorithm_type);
      merged.set(productId, current);
    }
  }

  return merged;
}

async function getProductSummaries(productIds) {
  if (!productIds.length) {
    return [];
  }

  const result = await db.query(
    `SELECT p.product_id, p.sku, p.name, p.slug, p.short_description, p.description,
      p.price, p.sale_price, p.stock_quantity, p.category_id, p.created_at,
      c.name AS category_name,
      (SELECT image_url FROM product_image pi WHERE pi.product_id = p.product_id AND pi.is_primary = true LIMIT 1) AS primary_image,
      (SELECT pp.promotional_price FROM product_promotion pp
       JOIN promotion pr ON pp.promotion_id = pr.promotion_id
       WHERE pp.product_id = p.product_id AND pr.is_active = true
         AND pr.start_date <= CURRENT_DATE AND pr.end_date >= CURRENT_DATE
       ORDER BY pp.promotional_price ASC LIMIT 1) AS promotional_price,
      (SELECT pr.name FROM product_promotion pp
       JOIN promotion pr ON pp.promotion_id = pr.promotion_id
       WHERE pp.product_id = p.product_id AND pr.is_active = true
         AND pr.start_date <= CURRENT_DATE AND pr.end_date >= CURRENT_DATE
       ORDER BY pp.promotional_price ASC LIMIT 1) AS promotion_name
     FROM product p
     LEFT JOIN category c ON c.category_id = p.category_id
     WHERE p.product_id = ANY($1::int[])
       AND p.is_active = true
       AND p.stock_quantity > 0`,
    [productIds]
  );

  const byId = new Map(result.rows.map((row) => [row.product_id, row]));
  return productIds.map((productId) => byId.get(productId)).filter(Boolean);
}

async function getExcludedProductIds(userId) {
  const result = await db.query(
    `SELECT DISTINCT product_id
     FROM user_behavior
     WHERE user_id = $1 AND product_id IS NOT NULL
     UNION
     SELECT DISTINCT product_id
     FROM wishlist_item wi
     JOIN wishlist w ON w.wishlist_id = wi.wishlist_id
     WHERE w.user_id = $1
     UNION
     SELECT DISTINCT product_id
     FROM cart_item ci
     JOIN cart c ON c.cart_id = ci.cart_id
     WHERE c.user_id = $1`,
    [userId]
  );

  return result.rows.map((row) => Number(row.product_id));
}

async function getPopularCandidates({ limit = 10, categoryId = null, excludeProductIds = [] } = {}) {
  const params = [];
  let paramIndex = 1;
  let filters = 'WHERE p.is_active = true AND p.stock_quantity > 0';

  if (categoryId) {
    filters += ` AND p.category_id = $${paramIndex}`;
    params.push(Number(categoryId));
    paramIndex += 1;
  }

  if (excludeProductIds.length) {
    filters += ` AND p.product_id <> ALL($${paramIndex}::int[])`;
    params.push(excludeProductIds);
    paramIndex += 1;
  }

  params.push(limit);

  const result = await db.query(
    `WITH behavior_scores AS (
       SELECT ub.product_id,
         SUM(${buildWeightCase()} * CASE WHEN ub.action_time >= NOW() - INTERVAL '30 days' THEN 1.2 ELSE 1 END) AS behavior_score
       FROM user_behavior ub
       WHERE ub.product_id IS NOT NULL
       GROUP BY ub.product_id
     ),
     order_scores AS (
       SELECT oi.product_id,
         SUM(oi.quantity * 5.0) AS order_score
       FROM order_item oi
       GROUP BY oi.product_id
     )
     SELECT p.product_id,
       COALESCE(bs.behavior_score, 0) + COALESCE(os.order_score, 0) AS score,
       'popularity' AS algorithm_type,
       CASE
         WHEN COALESCE(os.order_score, 0) > 0 THEN 'Trending based on purchases'
         ELSE 'Popular with shoppers'
       END AS reason
     FROM product p
     LEFT JOIN behavior_scores bs ON bs.product_id = p.product_id
     LEFT JOIN order_scores os ON os.product_id = p.product_id
     ${filters}
     ORDER BY score DESC, p.created_at DESC
     LIMIT $${paramIndex}`,
    params
  );

  return result.rows;
}

async function getCollaborativeCandidates(userId, excludeProductIds, limit = 24) {
  const myActivity = await db.query(
    `SELECT COUNT(*) AS total
     FROM user_behavior
     WHERE user_id = $1 AND product_id IS NOT NULL`,
    [userId]
  );

  if (Number(myActivity.rows[0].total) === 0) {
    return [];
  }

  const result = await db.query(
    `WITH my_products AS (
       SELECT ub.product_id,
         SUM(${buildWeightCase()}) AS my_score
       FROM user_behavior ub
       WHERE ub.user_id = $1
         AND ub.product_id IS NOT NULL
       GROUP BY ub.product_id
     ),
     similar_users AS (
       SELECT ub.user_id,
         SUM(mp.my_score * ${buildWeightCase()}) AS similarity_score
       FROM user_behavior ub
       JOIN my_products mp ON mp.product_id = ub.product_id
       WHERE ub.user_id <> $1
       GROUP BY ub.user_id
       HAVING SUM(mp.my_score * ${buildWeightCase()}) > 0
     )
     SELECT ub.product_id,
       SUM(su.similarity_score * ${buildWeightCase()}) AS score,
       'collaborative' AS algorithm_type,
       'Customers with similar taste also engaged with this' AS reason
     FROM similar_users su
     JOIN user_behavior ub ON ub.user_id = su.user_id
     JOIN product p ON p.product_id = ub.product_id
     WHERE ub.product_id IS NOT NULL
       AND p.is_active = true
       AND p.stock_quantity > 0
       AND ub.product_id <> ALL($2::int[])
     GROUP BY ub.product_id
     ORDER BY score DESC
     LIMIT $3`,
    [userId, excludeProductIds.length ? excludeProductIds : [0], limit]
  );

  return result.rows;
}

async function getContentCandidates(userId, excludeProductIds, limit = 24) {
  const result = await db.query(
    `WITH category_preferences AS (
       SELECT p.category_id,
         SUM(${buildWeightCase()}) AS category_score
       FROM user_behavior ub
       JOIN product p ON p.product_id = ub.product_id
       WHERE ub.user_id = $1
         AND ub.product_id IS NOT NULL
       GROUP BY p.category_id
     ),
     tag_preferences AS (
       SELECT ptm.tag_id,
         SUM(${buildWeightCase()}) AS tag_score
       FROM user_behavior ub
       JOIN product_tag_mapping ptm ON ptm.product_id = ub.product_id
       WHERE ub.user_id = $1
         AND ub.product_id IS NOT NULL
       GROUP BY ptm.tag_id
     )
     SELECT p.product_id,
       (COALESCE(cp.category_score, 0) * 1.5) + COALESCE(SUM(tp.tag_score), 0) AS score,
       'content' AS algorithm_type,
       CASE
         WHEN COALESCE(SUM(tp.tag_score), 0) > 0 THEN 'Matches your preferred categories and tags'
         ELSE 'Matches categories you browse most'
       END AS reason
     FROM product p
     LEFT JOIN category_preferences cp ON cp.category_id = p.category_id
     LEFT JOIN product_tag_mapping ptm ON ptm.product_id = p.product_id
     LEFT JOIN tag_preferences tp ON tp.tag_id = ptm.tag_id
     WHERE p.is_active = true
       AND p.stock_quantity > 0
       AND p.product_id <> ALL($2::int[])
     GROUP BY p.product_id, cp.category_score
     HAVING (COALESCE(cp.category_score, 0) * 1.5) + COALESCE(SUM(tp.tag_score), 0) > 0
     ORDER BY score DESC, p.created_at DESC
     LIMIT $3`,
    [userId, excludeProductIds.length ? excludeProductIds : [0], limit]
  );

  return result.rows;
}

async function persistRecommendations(userId, rankedProducts) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM recommendation WHERE user_id = $1', [userId]);

    const inserted = [];
    for (const product of rankedProducts) {
      const result = await client.query(
        `INSERT INTO recommendation (user_id, product_id, score, algorithm_type)
         VALUES ($1, $2, $3, $4)
         RETURNING recommendation_id, generated_at`,
        [userId, product.product_id, product.recommendation_score, product.algorithm_type]
      );

      inserted.push({
        ...product,
        recommendation_id: result.rows[0].recommendation_id,
        generated_at: result.rows[0].generated_at,
      });
    }

    await client.query('COMMIT');
    return inserted;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function diversifyRecommendations(products, limit) {
  const categoryCounts = new Map();
  const selected = [];

  for (const product of products) {
    const categoryId = product.category_id || 0;
    const currentCount = categoryCounts.get(categoryId) || 0;

    if (currentCount >= 2) {
      continue;
    }

    selected.push(product);
    categoryCounts.set(categoryId, currentCount + 1);

    if (selected.length >= limit) {
      break;
    }
  }

  if (selected.length < limit) {
    for (const product of products) {
      if (selected.some((entry) => entry.product_id === product.product_id)) {
        continue;
      }

      selected.push(product);
      if (selected.length >= limit) {
        break;
      }
    }
  }

  return selected;
}

function getPrimaryAlgorithmType(sources) {
  if (!sources || sources.size === 0) {
    return 'hybrid';
  }

  if (sources.size > 1) {
    return 'hybrid';
  }

  return [...sources][0];
}

async function getPersonalizedRecommendations(userId, limit = 10) {
  const normalizedLimit = normalizeLimit(limit, 10);
  const excludeProductIds = await getExcludedProductIds(userId);

  const [collaborative, content, popular] = await Promise.all([
    getCollaborativeCandidates(userId, excludeProductIds, normalizedLimit * 3),
    getContentCandidates(userId, excludeProductIds, normalizedLimit * 3),
    getPopularCandidates({ limit: normalizedLimit * 3, excludeProductIds }),
  ]);

  const merged = mergeScoreMaps([
    { scores: collaborative, weight: 0.45, reason: 'Recommended from similar shoppers' },
    { scores: content, weight: 0.35, reason: 'Recommended from your browsing patterns' },
    { scores: popular, weight: 0.20, reason: 'Popular right now' },
  ]);

  const rankedIds = [...merged.values()]
    .sort((left, right) => right.score - left.score)
    .slice(0, normalizedLimit * 4)
    .map((entry) => entry.product_id);

  if (!rankedIds.length) {
    const fallback = await getPopularRecommendations({ limit: normalizedLimit });
    return fallback.map((product) => ({
      ...product,
      algorithm_type: 'popularity',
      recommendation_reason: product.recommendation_reason || 'Popular with shoppers',
      recommendation_score: clampScore(product.recommendation_score),
    }));
  }

  const products = await getProductSummaries(rankedIds);
  const enriched = products.map((product) => {
    const aggregate = merged.get(product.product_id);
    const promoBoost = product.promotional_price ? 0.35 : 0;

    return {
      ...product,
      algorithm_type: getPrimaryAlgorithmType(aggregate.sources),
      recommendation_reason: [...aggregate.reasons][0] || 'Personalized for you',
      recommendation_score: Number((aggregate.score + promoBoost).toFixed(4)),
    };
  }).sort((left, right) => right.recommendation_score - left.recommendation_score);

  const diversified = diversifyRecommendations(enriched, normalizedLimit);
  return persistRecommendations(userId, diversified);
}

async function getPopularRecommendations({ limit = 10, categoryId = null, excludeProductIds = [] } = {}) {
  const normalizedLimit = normalizeLimit(limit, 10);
  const candidates = await getPopularCandidates({
    limit: normalizedLimit,
    categoryId,
    excludeProductIds,
  });
  const summaries = await getProductSummaries(candidates.map((candidate) => Number(candidate.product_id)));
  const candidateMap = new Map(candidates.map((candidate) => [Number(candidate.product_id), candidate]));

  return summaries.map((product) => {
    const candidate = candidateMap.get(product.product_id);
    return {
      ...product,
      algorithm_type: 'popularity',
      recommendation_reason: candidate?.reason || 'Popular with shoppers',
      recommendation_score: Number(clampScore(candidate?.score).toFixed(4)),
    };
  });
}

async function getSimilarRecommendations(productId, limit = 6) {
  const normalizedLimit = normalizeLimit(limit, 6);

  const result = await db.query(
    `WITH current_product AS (
       SELECT product_id, category_id
       FROM product
       WHERE product_id = $1 AND is_active = true
     ),
     shared_tags AS (
       SELECT ptm.product_id,
         COUNT(*)::float AS shared_tag_count
       FROM product_tag_mapping ptm
       JOIN product_tag_mapping base ON base.tag_id = ptm.tag_id
       WHERE base.product_id = $1
         AND ptm.product_id <> $1
       GROUP BY ptm.product_id
     ),
     co_behavior AS (
       SELECT ub.product_id,
         COUNT(DISTINCT ub.user_id)::float AS co_behavior_count
       FROM user_behavior ub
       JOIN user_behavior seed ON seed.user_id = ub.user_id
       WHERE seed.product_id = $1
         AND ub.product_id <> $1
       GROUP BY ub.product_id
     )
     SELECT p.product_id,
       (CASE WHEN p.category_id = cp.category_id THEN 3 ELSE 0 END)
         + COALESCE(st.shared_tag_count, 0) * 2
         + COALESCE(cb.co_behavior_count, 0) * 1.5 AS score,
       'similarity' AS algorithm_type,
       CASE
         WHEN COALESCE(st.shared_tag_count, 0) > 0 THEN 'Similar category and tags'
         ELSE 'Frequently explored together'
       END AS reason
     FROM product p
     JOIN current_product cp ON TRUE
     LEFT JOIN shared_tags st ON st.product_id = p.product_id
     LEFT JOIN co_behavior cb ON cb.product_id = p.product_id
     WHERE p.product_id <> $1
       AND p.is_active = true
       AND p.stock_quantity > 0
       AND ((CASE WHEN p.category_id = cp.category_id THEN 3 ELSE 0 END)
         + COALESCE(st.shared_tag_count, 0) * 2
         + COALESCE(cb.co_behavior_count, 0) * 1.5) > 0
     ORDER BY score DESC, p.created_at DESC
     LIMIT $2`,
    [productId, normalizedLimit]
  );

  if (!result.rows.length) {
    return getPopularRecommendations({ limit: normalizedLimit, excludeProductIds: [productId] });
  }

  const summaries = await getProductSummaries(result.rows.map((row) => Number(row.product_id)));
  const scoreMap = new Map(result.rows.map((row) => [Number(row.product_id), row]));

  return summaries.map((product) => {
    const score = scoreMap.get(product.product_id);
    return {
      ...product,
      algorithm_type: 'similarity',
      recommendation_reason: score.reason,
      recommendation_score: Number(clampScore(score.score).toFixed(4)),
    };
  });
}

async function trackBehavior({ userId, productId = null, actionType, sessionId = null, metadata = {}, client = null }) {
  if (!VALID_ACTION_TYPES.has(actionType)) {
    const error = new Error('Unsupported behavior action type');
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const executor = client || db;
  const sanitizedMetadata = parseMetadata(metadata);

  const result = await executor.query(
    `INSERT INTO user_behavior (user_id, product_id, action_type, session_id, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING *`,
    [userId, productId, actionType, sessionId, JSON.stringify(sanitizedMetadata)]
  );

  if (actionType === 'CLICK_RECOMMENDATION' && sanitizedMetadata.recommendation_id) {
    await executor.query(
      `UPDATE recommendation
       SET is_clicked = true
       WHERE recommendation_id = $1 AND user_id = $2`,
      [sanitizedMetadata.recommendation_id, userId]
    );
  }

  return result.rows[0];
}

module.exports = {
  ACTION_WEIGHTS,
  VALID_ACTION_TYPES,
  getPersonalizedRecommendations,
  getPopularRecommendations,
  getSimilarRecommendations,
  normalizeLimit,
  trackBehavior,
};