const crypto = require('crypto');

const db = require('../config/database');

const SEMANTIC_SERVICE_URL = process.env.SEMANTIC_SERVICE_URL || 'http://127.0.0.1:8001';
const SEMANTIC_EMBEDDING_MODEL = process.env.SEMANTIC_EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';
const SEMANTIC_EMBEDDING_VERSION = process.env.SEMANTIC_EMBEDDING_VERSION || 'v1';

const refreshQueue = new Set();

function normalizeProductIds(productIds) {
  return [...new Set((productIds || []).map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))];
}

function hashSourceText(sourceText) {
  return crypto.createHash('sha256').update(sourceText, 'utf8').digest('hex');
}

function normalizeEmbedding(embedding) {
  if (!Array.isArray(embedding)) {
    return null;
  }

  return embedding.map((value) => Number.parseFloat(value));
}

function buildProductSemanticText(product) {
  const sections = [
    `Product Name: ${product.name || ''}`,
    `Short Description: ${product.short_description || ''}`,
    `Full Description: ${product.description || ''}`,
    `Category: ${product.category_name || ''}`,
    `Tags: ${(product.tags || []).join(', ')}`,
    `Promotions: ${(product.promotion_names || []).join(', ')}`,
  ];

  return sections.join('\n').trim();
}

async function requestSemanticService(pathname, options = {}) {
  const response = await fetch(`${SEMANTIC_SERVICE_URL}${pathname}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    const error = new Error(`Semantic service request failed: ${response.status} ${message}`);
    error.status = 502;
    error.code = 'SEMANTIC_SERVICE_ERROR';
    throw error;
  }

  return response.json();
}

async function getProductSemanticSourceRows(productIds, executor = db) {
  const normalizedIds = normalizeProductIds(productIds);
  if (!normalizedIds.length) {
    return [];
  }

  const result = await executor.query(
    `SELECT p.product_id, p.name, p.short_description, p.description,
      c.name AS category_name,
      COALESCE(array_remove(array_agg(DISTINCT pt.name), NULL), '{}') AS tags,
      COALESCE(array_remove(array_agg(DISTINCT pr.name), NULL), '{}') AS promotion_names
     FROM product p
     LEFT JOIN category c ON c.category_id = p.category_id
     LEFT JOIN product_tag_mapping ptm ON ptm.product_id = p.product_id
     LEFT JOIN product_tag pt ON pt.tag_id = ptm.tag_id
     LEFT JOIN product_promotion pp ON pp.product_id = p.product_id
     LEFT JOIN promotion pr ON pr.promotion_id = pp.promotion_id
       AND pr.is_active = true
       AND pr.start_date <= CURRENT_DATE
       AND pr.end_date >= CURRENT_DATE
     WHERE p.product_id = ANY($1::int[])
     GROUP BY p.product_id, c.name
     ORDER BY p.product_id ASC`,
    [normalizedIds]
  );

  return result.rows.map((row) => ({
    ...row,
    tags: row.tags || [],
    promotion_names: row.promotion_names || [],
    source_text: buildProductSemanticText(row),
  }));
}

async function embedTexts(texts) {
  if (!texts.length) {
    return { embeddings: [], model: SEMANTIC_EMBEDDING_MODEL, dimensions: 0 };
  }

  const response = await requestSemanticService('/embed', {
    method: 'POST',
    body: {
      texts,
      normalize: true,
      model: SEMANTIC_EMBEDDING_MODEL,
    },
  });

  return {
    model: response.model || SEMANTIC_EMBEDDING_MODEL,
    dimensions: Number(response.dimensions || 0),
    embeddings: (response.embeddings || []).map(normalizeEmbedding),
  };
}

async function upsertProductEmbeddings(productIds, { force = false } = {}) {
  const normalizedIds = normalizeProductIds(productIds);
  if (!normalizedIds.length) {
    return {
      requested: 0,
      embedded: 0,
      skipped: 0,
      model: SEMANTIC_EMBEDDING_MODEL,
      version: SEMANTIC_EMBEDDING_VERSION,
    };
  }

  const sourceRows = await getProductSemanticSourceRows(normalizedIds);
  if (!sourceRows.length) {
    return {
      requested: normalizedIds.length,
      embedded: 0,
      skipped: normalizedIds.length,
      model: SEMANTIC_EMBEDDING_MODEL,
      version: SEMANTIC_EMBEDDING_VERSION,
    };
  }

  const existingResult = await db.query(
    `SELECT product_id, source_text_hash
     FROM product_embedding
     WHERE product_id = ANY($1::int[])`,
    [sourceRows.map((row) => row.product_id)]
  );

  const existingById = new Map(existingResult.rows.map((row) => [Number(row.product_id), row.source_text_hash]));
  const rowsToEmbed = sourceRows.filter((row) => {
    const sourceTextHash = hashSourceText(row.source_text);
    return force || existingById.get(Number(row.product_id)) !== sourceTextHash;
  });

  if (!rowsToEmbed.length) {
    return {
      requested: normalizedIds.length,
      embedded: 0,
      skipped: sourceRows.length,
      model: SEMANTIC_EMBEDDING_MODEL,
      version: SEMANTIC_EMBEDDING_VERSION,
    };
  }

  const embeddingResponse = await embedTexts(rowsToEmbed.map((row) => row.source_text));
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    for (let index = 0; index < rowsToEmbed.length; index += 1) {
      const row = rowsToEmbed[index];
      const embedding = embeddingResponse.embeddings[index];

      if (!embedding || !embedding.length) {
        continue;
      }

      await client.query(
        `INSERT INTO product_embedding (
          product_id,
          embedding_model,
          embedding_version,
          source_text_hash,
          source_text,
          embedding_dimensions,
          embedding_payload,
          updated_at
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, CURRENT_TIMESTAMP)
         ON CONFLICT (product_id) DO UPDATE SET
           embedding_model = EXCLUDED.embedding_model,
           embedding_version = EXCLUDED.embedding_version,
           source_text_hash = EXCLUDED.source_text_hash,
           source_text = EXCLUDED.source_text,
           embedding_dimensions = EXCLUDED.embedding_dimensions,
           embedding_payload = EXCLUDED.embedding_payload,
           updated_at = CURRENT_TIMESTAMP`,
        [
          row.product_id,
          embeddingResponse.model,
          SEMANTIC_EMBEDDING_VERSION,
          hashSourceText(row.source_text),
          row.source_text,
          embedding.length,
          JSON.stringify(embedding),
        ]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return {
    requested: normalizedIds.length,
    embedded: rowsToEmbed.length,
    skipped: sourceRows.length - rowsToEmbed.length,
    model: embeddingResponse.model,
    version: SEMANTIC_EMBEDDING_VERSION,
  };
}

async function getStoredProductEmbeddings(productIds) {
  const normalizedIds = normalizeProductIds(productIds);
  if (!normalizedIds.length) {
    return new Map();
  }

  const result = await db.query(
    `SELECT product_id, embedding_model, embedding_version, embedding_payload, updated_at
     FROM product_embedding
     WHERE product_id = ANY($1::int[])`,
    [normalizedIds]
  );

  return new Map(result.rows.map((row) => [
    Number(row.product_id),
    {
      product_id: Number(row.product_id),
      embedding_model: row.embedding_model,
      embedding_version: row.embedding_version,
      embedding: normalizeEmbedding(row.embedding_payload),
      updated_at: row.updated_at,
    },
  ]));
}

async function getActiveProductEmbeddings({ excludeProductId = null } = {}) {
  const params = [];
  let whereClause = 'WHERE p.is_active = true AND p.stock_quantity > 0';

  if (excludeProductId) {
    params.push(Number(excludeProductId));
    whereClause += ` AND p.product_id <> $${params.length}`;
  }

  const result = await db.query(
    `SELECT p.product_id, p.category_id, pe.embedding_model, pe.embedding_version, pe.embedding_payload
     FROM product p
     JOIN product_embedding pe ON pe.product_id = p.product_id
     ${whereClause}`,
    params
  );

  return result.rows.map((row) => ({
    product_id: Number(row.product_id),
    category_id: row.category_id ? Number(row.category_id) : null,
    embedding_model: row.embedding_model,
    embedding_version: row.embedding_version,
    embedding: normalizeEmbedding(row.embedding_payload),
  }));
}

function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || !left.length) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  if (!leftMagnitude || !rightMagnitude) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

function normalizeSemanticScore(value) {
  return Math.max(0, Math.min(1, (Number(value) + 1) / 2));
}

function buildWeightedEmbedding(weightedEmbeddings) {
  const validEntries = (weightedEmbeddings || []).filter((entry) => Array.isArray(entry.embedding) && entry.embedding.length && Number(entry.weight) > 0);
  if (!validEntries.length) {
    return null;
  }

  const dimensions = validEntries[0].embedding.length;
  const vector = new Array(dimensions).fill(0);
  let totalWeight = 0;

  for (const entry of validEntries) {
    if (entry.embedding.length !== dimensions) {
      continue;
    }

    totalWeight += Number(entry.weight);
    for (let index = 0; index < dimensions; index += 1) {
      vector[index] += entry.embedding[index] * Number(entry.weight);
    }
  }

  if (!totalWeight) {
    return null;
  }

  return vector.map((value) => value / totalWeight);
}

function queueProductEmbeddingRefresh(productIds, options = {}) {
  const normalizedIds = normalizeProductIds(productIds).filter((productId) => !refreshQueue.has(productId));
  if (!normalizedIds.length) {
    return false;
  }

  for (const productId of normalizedIds) {
    refreshQueue.add(productId);
  }

  setTimeout(async () => {
    try {
      await upsertProductEmbeddings(normalizedIds, options);
    } catch (error) {
      console.error('Queued product embedding refresh failed:', error.message);
    } finally {
      for (const productId of normalizedIds) {
        refreshQueue.delete(productId);
      }
    }
  }, 0);

  return true;
}

async function refreshProductEmbedding(productId, options = {}) {
  return upsertProductEmbeddings([productId], options);
}

async function backfillProductEmbeddings({ limit = null, force = false } = {}) {
  const params = [];
  let limitClause = '';

  if (Number.isInteger(limit) && limit > 0) {
    params.push(limit);
    limitClause = `LIMIT $${params.length}`;
  }

  const result = await db.query(
    `SELECT product_id
     FROM product
     WHERE is_active = true
     ORDER BY updated_at DESC, product_id DESC
     ${limitClause}`,
    params
  );

  const productIds = result.rows.map((row) => Number(row.product_id));
  const summary = await upsertProductEmbeddings(productIds, { force });

  return {
    ...summary,
    totalProducts: productIds.length,
  };
}

async function getSemanticServiceHealth() {
  return requestSemanticService('/health');
}

module.exports = {
  SEMANTIC_SERVICE_URL,
  SEMANTIC_EMBEDDING_MODEL,
  SEMANTIC_EMBEDDING_VERSION,
  backfillProductEmbeddings,
  buildWeightedEmbedding,
  cosineSimilarity,
  getActiveProductEmbeddings,
  getSemanticServiceHealth,
  getStoredProductEmbeddings,
  normalizeSemanticScore,
  queueProductEmbeddingRefresh,
  refreshProductEmbedding,
  upsertProductEmbeddings,
};