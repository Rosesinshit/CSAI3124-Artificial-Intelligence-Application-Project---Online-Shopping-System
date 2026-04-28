require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const db = require('../config/database');

const migrationSql = `
CREATE TABLE IF NOT EXISTS product_embedding (
  product_id INT PRIMARY KEY REFERENCES product(product_id) ON DELETE CASCADE,
  embedding_model VARCHAR(255) NOT NULL,
  embedding_version VARCHAR(50) NOT NULL DEFAULT 'v1',
  source_text_hash VARCHAR(64) NOT NULL,
  source_text TEXT NOT NULL,
  embedding_dimensions INT NOT NULL,
  embedding_payload JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_embedding_model ON product_embedding(embedding_model);
CREATE INDEX IF NOT EXISTS idx_product_embedding_updated_at ON product_embedding(updated_at DESC);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_name = 'recommendation'
      AND constraint_name = 'recommendation_algorithm_type_check'
  ) THEN
    ALTER TABLE recommendation DROP CONSTRAINT recommendation_algorithm_type_check;
  END IF;

  ALTER TABLE recommendation
    ADD CONSTRAINT recommendation_algorithm_type_check
    CHECK (algorithm_type IN ('hybrid', 'collaborative', 'content', 'popularity', 'similarity', 'semantic_ai'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
`;

async function runMigration() {
  try {
    console.log('Applying semantic recommendation migration...');
    await db.query(migrationSql);
    console.log('Semantic recommendation migration completed.');
    process.exit(0);
  } catch (error) {
    console.error('Semantic recommendation migration failed:', error);
    process.exit(1);
  }
}

runMigration();