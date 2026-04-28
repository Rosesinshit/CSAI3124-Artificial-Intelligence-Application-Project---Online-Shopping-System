require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { getSemanticServiceHealth } = require('../services/semanticEmbeddings');

async function main() {
  try {
    const health = await getSemanticServiceHealth();
    console.log(JSON.stringify(health, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Semantic service health check failed:', error);
    process.exit(1);
  }
}

main();