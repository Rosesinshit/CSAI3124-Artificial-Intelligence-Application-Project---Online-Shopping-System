const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Clean existing seed data for re-runnability
    await client.query('DELETE FROM price_alert');
    await client.query('DELETE FROM wishlist_item');
    await client.query('DELETE FROM wishlist');
    await client.query('DELETE FROM product_promotion');
    await client.query('DELETE FROM promotion');
    await client.query('DELETE FROM order_status_history');
    await client.query('DELETE FROM order_item');
    await client.query('DELETE FROM purchase_order');
    await client.query('DELETE FROM cart_item');
    await client.query('DELETE FROM cart');
    await client.query('DELETE FROM product_tag_mapping');
    await client.query('DELETE FROM product_attribute');
    await client.query('DELETE FROM product_image');
    await client.query('DELETE FROM product');
    await client.query('DELETE FROM product_tag');
    await client.query('DELETE FROM category');
    await client.query('DELETE FROM "user"');

    // ── Admin User ──
    const adminHash = await bcrypt.hash('admin123', 12);
    const { rows: [admin] } = await client.query(
      `INSERT INTO "user" (email, password_hash, full_name, role)
       VALUES ($1,$2,$3,$4) RETURNING user_id`,
      ['admin@shop.com', adminHash, 'Admin User', 'admin']
    );

    // ── Customer User ──
    const custHash = await bcrypt.hash('customer123', 12);
    const { rows: [customer] } = await client.query(
      `INSERT INTO "user" (email, password_hash, full_name, phone, shipping_address, role)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING user_id`,
      ['customer@shop.com', custHash, 'Jane Doe', '123-456-7890', '123 Main St, Springfield, IL 62701', 'customer']
    );

    // ── Categories ──
    const cats = {};
    for (const c of [
      { name: 'Electronics', desc: 'Gadgets, devices, and tech accessories', slug: 'electronics' },
      { name: 'Clothing', desc: 'Apparel for men, women, and kids', slug: 'clothing' },
      { name: 'Home & Kitchen', desc: 'Essentials for home and cooking', slug: 'home-kitchen' },
      { name: 'Books', desc: 'Fiction, non-fiction, and educational books', slug: 'books' },
      { name: 'Sports', desc: 'Sporting goods and outdoor equipment', slug: 'sports' },
    ]) {
      const { rows: [r] } = await client.query(
        `INSERT INTO category (name, description, slug) VALUES ($1,$2,$3)
         RETURNING category_id`,
        [c.name, c.desc, c.slug]
      );
      cats[c.slug] = r.category_id;
    }

    // Sub‑categories
    const subCats = [
      { name: 'Laptops', slug: 'laptops', parent: cats['electronics'] },
      { name: 'Smartphones', slug: 'smartphones', parent: cats['electronics'] },
      { name: 'Men\'s', slug: 'mens', parent: cats['clothing'] },
      { name: 'Women\'s', slug: 'womens', parent: cats['clothing'] },
    ];
    for (const sc of subCats) {
      const { rows: [r] } = await client.query(
        `INSERT INTO category (name, slug, parent_id) VALUES ($1,$2,$3)
         RETURNING category_id`,
        [sc.name, sc.slug, sc.parent]
      );
      cats[sc.slug] = r.category_id;
    }

    // ── Tags ──
    const tagMap = {};
    for (const t of ['premium', 'sale', 'new', 'featured', 'bestseller', 'eco-friendly', 'wireless', 'portable']) {
      const { rows: [r] } = await client.query(
        `INSERT INTO product_tag (name, slug) VALUES ($1,$2)
         RETURNING tag_id`,
        [t, t]
      );
      tagMap[t] = r.tag_id;
    }

    // ── Products ──
    const products = [
      {
        name: 'ProBook Laptop X1', sku: 'ELEC-LAP-001', price: 1299.99, sale_price: 1099.99,
        stock: 25, short_desc: 'High-performance laptop for professionals',
        desc: '<p>The ProBook X1 features a 15.6" 4K display, 32GB RAM, 1TB SSD, and the latest Intel i9 processor. Perfect for developers and designers.</p>',
        category: cats['laptops'],
        tags: ['premium', 'featured', 'bestseller'],
        images: [
          'https://picsum.photos/seed/laptop1/600/600',
          'https://picsum.photos/seed/laptop2/600/600',
          'https://picsum.photos/seed/laptop3/600/600',
        ],
        attrs: [
          { name: 'Brand', value: 'ProTech' },
          { name: 'Processor', value: 'Intel Core i9-13900H' },
          { name: 'RAM', value: '32GB DDR5' },
          { name: 'Storage', value: '1TB NVMe SSD' },
          { name: 'Display', value: '15.6" 4K IPS' },
          { name: 'Specifications', value: '<table><tr><td><strong>Weight</strong></td><td>1.8 kg</td></tr><tr><td><strong>Battery</strong></td><td>72 Wh</td></tr><tr><td><strong>Ports</strong></td><td>USB-C ×3, HDMI 2.1</td></tr></table>', is_html: true },
        ],
      },
      {
        name: 'SmartPhone Pro Max', sku: 'ELEC-PHN-001', price: 999.99, sale_price: null,
        stock: 50, short_desc: 'Flagship smartphone with triple camera',
        desc: '<p>Experience the best mobile photography with a 200MP main sensor, 120Hz AMOLED display, and all-day battery life.</p>',
        category: cats['smartphones'],
        tags: ['premium', 'new', 'featured'],
        images: [
          'https://picsum.photos/seed/phone1/600/600',
          'https://picsum.photos/seed/phone2/600/600',
        ],
        attrs: [
          { name: 'Brand', value: 'VisionTech' },
          { name: 'Camera', value: '200MP + 50MP + 12MP' },
          { name: 'Battery', value: '5000mAh' },
          { name: 'Display', value: '6.7" AMOLED 120Hz' },
        ],
      },
      {
        name: 'Wireless Noise-Cancelling Headphones', sku: 'ELEC-AUD-001', price: 349.99, sale_price: 279.99,
        stock: 100, short_desc: 'Premium ANC headphones with 40h battery',
        desc: 'Industry-leading active noise cancellation with hi-res audio support.',
        category: cats['electronics'],
        tags: ['wireless', 'premium', 'sale', 'bestseller'],
        images: [
          'https://picsum.photos/seed/headphone1/600/600',
          'https://picsum.photos/seed/headphone2/600/600',
        ],
        attrs: [
          { name: 'Brand', value: 'SoundWave' },
          { name: 'Driver Size', value: '40mm' },
          { name: 'Battery Life', value: '40 hours' },
          { name: 'Bluetooth', value: '5.3' },
        ],
      },
      {
        name: 'Classic Fit Oxford Shirt', sku: 'CLTH-MEN-001', price: 59.99, sale_price: null,
        stock: 200, short_desc: 'Timeless Oxford shirt for every occasion',
        desc: '100% cotton Oxford weave shirt with button-down collar.',
        category: cats['mens'],
        tags: ['bestseller'],
        images: [
          'https://picsum.photos/seed/shirt1/600/600',
          'https://picsum.photos/seed/shirt2/600/600',
          'https://picsum.photos/seed/shirt3/600/600',
        ],
        attrs: [
          { name: 'Material', value: '100% Cotton Oxford' },
          { name: 'Fit', value: 'Classic/Regular' },
          { name: 'Sizes Available', value: '<ul><li>S</li><li>M</li><li>L</li><li>XL</li><li>XXL</li></ul>', is_html: true },
        ],
      },
      {
        name: 'Women\'s Running Jacket', sku: 'CLTH-WMN-001', price: 89.99, sale_price: 69.99,
        stock: 80, short_desc: 'Lightweight, water-resistant running jacket',
        desc: 'Breathable and reflective jacket perfect for early morning runs.',
        category: cats['womens'],
        tags: ['sale', 'eco-friendly', 'new'],
        images: [
          'https://picsum.photos/seed/jacket1/600/600',
          'https://picsum.photos/seed/jacket2/600/600',
        ],
        attrs: [
          { name: 'Material', value: 'Recycled Polyester' },
          { name: 'Water Resistance', value: 'DWR Coated' },
        ],
      },
      {
        name: 'Smart Coffee Maker', sku: 'HOME-KIT-001', price: 179.99, sale_price: null,
        stock: 40, short_desc: 'WiFi-connected coffee maker with app control',
        desc: 'Schedule your brew from bed. Makes up to 12 cups with precision temperature control.',
        category: cats['home-kitchen'],
        tags: ['featured', 'wireless'],
        images: [
          'https://picsum.photos/seed/coffee1/600/600',
          'https://picsum.photos/seed/coffee2/600/600',
        ],
        attrs: [
          { name: 'Capacity', value: '12 Cups / 1.8L' },
          { name: 'Connectivity', value: 'WiFi + Bluetooth' },
          { name: 'Brew Modes', value: 'Regular, Bold, Iced, Cold Brew' },
        ],
      },
      {
        name: 'Ergonomic Office Chair', sku: 'HOME-FUR-001', price: 449.99, sale_price: 399.99,
        stock: 15, short_desc: 'Fully adjustable ergonomic mesh chair',
        desc: '<p>Lumbar support, adjustable headrest, 4D armrests, and breathable mesh back. Rated for 8+ hours of comfortable sitting.</p>',
        category: cats['home-kitchen'],
        tags: ['premium', 'sale'],
        images: [
          'https://picsum.photos/seed/chair1/600/600',
          'https://picsum.photos/seed/chair2/600/600',
        ],
        attrs: [
          { name: 'Weight Capacity', value: '150 kg / 330 lbs' },
          { name: 'Material', value: 'Mesh back, foam seat' },
        ],
      },
      {
        name: 'JavaScript: The Good Parts', sku: 'BOOK-PROG-001', price: 29.99, sale_price: null,
        stock: 120, short_desc: 'Classic guide to JavaScript fundamentals',
        desc: 'Douglas Crockford reveals the good parts of JavaScript, helping you write elegant and efficient code.',
        category: cats['books'],
        tags: ['bestseller'],
        images: [
          'https://picsum.photos/seed/book1/600/600',
        ],
        attrs: [
          { name: 'Author', value: 'Douglas Crockford' },
          { name: 'Pages', value: '176' },
          { name: 'Publisher', value: 'O\'Reilly Media' },
        ],
      },
      {
        name: 'Yoga Mat Premium', sku: 'SPRT-YGA-001', price: 49.99, sale_price: 39.99,
        stock: 150, short_desc: 'Extra thick non-slip yoga mat',
        desc: '6mm thick TPE material with alignment lines. Eco-friendly and non-toxic.',
        category: cats['sports'],
        tags: ['eco-friendly', 'sale', 'portable'],
        images: [
          'https://picsum.photos/seed/yoga1/600/600',
          'https://picsum.photos/seed/yoga2/600/600',
        ],
        attrs: [
          { name: 'Thickness', value: '6mm' },
          { name: 'Material', value: 'TPE (Eco-friendly)' },
          { name: 'Dimensions', value: '183cm × 61cm' },
        ],
      },
      {
        name: 'Portable Bluetooth Speaker', sku: 'ELEC-SPK-001', price: 79.99, sale_price: null,
        stock: 200, short_desc: 'Waterproof speaker with 360° sound',
        desc: 'IP67 waterproof, 24-hour battery, and rich bass. Perfect for outdoor adventures.',
        category: cats['electronics'],
        tags: ['wireless', 'portable', 'new'],
        images: [
          'https://picsum.photos/seed/speaker1/600/600',
          'https://picsum.photos/seed/speaker2/600/600',
        ],
        attrs: [
          { name: 'Brand', value: 'SoundWave' },
          { name: 'Waterproof Rating', value: 'IP67' },
          { name: 'Battery Life', value: '24 hours' },
        ],
      },
    ];

    for (const p of products) {
      const { rows: [prod] } = await client.query(
        `INSERT INTO product (name, sku, slug, price, sale_price, stock_quantity, short_description, description, category_id, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
         RETURNING product_id`,
        [p.name, p.sku, p.sku.toLowerCase(), p.price, p.sale_price, p.stock, p.short_desc, p.desc, p.category]
      );
      const pid = prod.product_id;

      // Images (B1)
      for (let i = 0; i < (p.images || []).length; i++) {
        await client.query(
          `INSERT INTO product_image (product_id, image_url, alt_text, sort_order, is_primary)
           VALUES ($1,$2,$3,$4,$5)`,
          [pid, p.images[i], p.name, i, i === 0]
        );
      }

      // Tags
      for (const t of (p.tags || [])) {
        if (tagMap[t]) {
          await client.query(
            `INSERT INTO product_tag_mapping (product_id, tag_id) VALUES ($1,$2)`,
            [pid, tagMap[t]]
          );
        }
      }

      // Attributes (C1/C5)
      for (let i = 0; i < (p.attrs || []).length; i++) {
        const a = p.attrs[i];
        await client.query(
          `INSERT INTO product_attribute (product_id, attribute_name, attribute_value, is_html)
           VALUES ($1,$2,$3,$4)`,
          [pid, a.name, a.value, a.is_html || false]
        );
      }
    }

    // ── Block U: Promotions ──
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { rows: [promo1] } = await client.query(
      `INSERT INTO promotion (name, description, type, discount_value, start_date, end_date, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING promotion_id`,
      ['Summer Tech Sale', 'Up to 20% off on electronics!', 'percentage', 20, now.toISOString(), in30Days.toISOString(), true]
    );

    const { rows: [promo2] } = await client.query(
      `INSERT INTO promotion (name, description, type, discount_value, start_date, end_date, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING promotion_id`,
      ['Flash Deal', '$15 off selected items', 'fixed', 15, now.toISOString(), in7Days.toISOString(), true]
    );

    // Get some product IDs to link to promotions
    const { rows: allProducts } = await client.query(
      `SELECT product_id, price, sale_price FROM product ORDER BY product_id LIMIT 10`
    );

    // Link first 3 products to Summer Tech Sale (20% off)
    for (let i = 0; i < Math.min(3, allProducts.length); i++) {
      const p = allProducts[i];
      const basePrice = p.sale_price ? parseFloat(p.sale_price) : parseFloat(p.price);
      const promoPrice = (basePrice * 0.8).toFixed(2);
      await client.query(
        `INSERT INTO product_promotion (product_id, promotion_id, promotional_price)
         VALUES ($1,$2,$3)`,
        [p.product_id, promo1.promotion_id, promoPrice]
      );
    }

    // Link next 2 products to Flash Deal ($15 off)
    for (let i = 3; i < Math.min(5, allProducts.length); i++) {
      const p = allProducts[i];
      const basePrice = p.sale_price ? parseFloat(p.sale_price) : parseFloat(p.price);
      const promoPrice = Math.max(0, basePrice - 15).toFixed(2);
      await client.query(
        `INSERT INTO product_promotion (product_id, promotion_id, promotional_price)
         VALUES ($1,$2,$3)`,
        [p.product_id, promo2.promotion_id, promoPrice]
      );
    }

    await client.query('COMMIT');
    console.log('✔ Seed data inserted successfully');
    console.log('  Admin login:    admin@shop.com / admin123');
    console.log('  Customer login: customer@shop.com / customer123');
    console.log('  Promotions:     2 active promotions with product links');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await db.pool.end();
  }
}

seed();
