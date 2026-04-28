require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const { backfillProductEmbeddings } = require('../services/semanticEmbeddings');

async function main() {
  const force = process.argv.includes('--force');
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : null;

  try {
    const summary = await backfillProductEmbeddings({
      force,
      limit: Number.isInteger(limit) && limit > 0 ? limit : null,
    });

    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Embedding backfill failed:', error);
    process.exit(1);
  }
}

main();