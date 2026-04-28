require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function initDatabase() {
  try {
    console.log('Initializing database...');
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await db.query(schemaSQL);
    console.log('Database schema created successfully!');

    // Create uploads directory
    const uploadDir = path.join(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads');
    const productImagesDir = path.join(uploadDir, 'products');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    if (!fs.existsSync(productImagesDir)) fs.mkdirSync(productImagesDir, { recursive: true });
    console.log('Upload directories created.');

    process.exit(0);
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
