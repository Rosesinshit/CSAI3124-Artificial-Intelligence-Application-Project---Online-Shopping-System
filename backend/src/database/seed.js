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
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=600&fit=crop',
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
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&h=600&fit=crop',
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
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&h=600&fit=crop',
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
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1598033129183-c4f50c736c10?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&h=600&fit=crop',
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
          'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1544966503-7cc5ac882d5a?w=600&h=600&fit=crop',
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
          'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&h=600&fit=crop',
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
          'https://images.unsplash.com/photo-1589384267710-7a170981ca78?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=600&h=600&fit=crop',
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
          'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=600&fit=crop',
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
          'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1588286840104-8957b019727f?w=600&h=600&fit=crop',
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
          'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=600&h=600&fit=crop',
        ],
        attrs: [
          { name: 'Brand', value: 'SoundWave' },
          { name: 'Waterproof Rating', value: 'IP67' },
          { name: 'Battery Life', value: '24 hours' },
        ],
      },
      {
        name: 'UltraBook Air 14', sku: 'ELEC-LAP-002', price: 899.99, sale_price: 799.99,
        stock: 30, short_desc: 'Lightweight ultrabook for everyday use',
        desc: 'Ultra-thin 14" laptop with 16GB RAM, 512GB SSD, and all-day battery life.',
        category: cats['laptops'], tags: ['new', 'portable'],
        images: ['https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Brand', value: 'ProTech' }, { name: 'RAM', value: '16GB DDR5' }],
      },
      {
        name: 'Gaming Laptop Titan', sku: 'ELEC-LAP-003', price: 1899.99, sale_price: null,
        stock: 10, short_desc: 'High-end gaming laptop with RTX 4080',
        desc: 'Dominate every game with a 17.3" 240Hz display, RTX 4080, and liquid cooling.',
        category: cats['laptops'], tags: ['premium', 'featured'],
        images: ['https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Brand', value: 'TitanTech' }, { name: 'GPU', value: 'RTX 4080 16GB' }],
      },
      {
        name: 'Budget Chromebook 11', sku: 'ELEC-LAP-004', price: 249.99, sale_price: null,
        stock: 60, short_desc: 'Affordable Chromebook for students',
        desc: 'Perfect for browsing, documents, and streaming with 11.6" HD display.',
        category: cats['laptops'], tags: ['sale', 'bestseller'],
        images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Brand', value: 'EduTech' }, { name: 'OS', value: 'ChromeOS' }],
      },
      {
        name: 'SmartPhone Lite', sku: 'ELEC-PHN-002', price: 499.99, sale_price: 449.99,
        stock: 80, short_desc: 'Mid-range smartphone with great camera',
        desc: 'Excellent value with a 108MP camera, 90Hz OLED display, and 4500mAh battery.',
        category: cats['smartphones'], tags: ['sale', 'bestseller'],
        images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Brand', value: 'VisionTech' }, { name: 'Camera', value: '108MP + 12MP' }],
      },
      {
        name: 'SmartPhone Budget SE', sku: 'ELEC-PHN-003', price: 299.99, sale_price: null,
        stock: 120, short_desc: 'Affordable smartphone for everyone',
        desc: 'All the essentials in a compact design with 64MP camera and 5G support.',
        category: cats['smartphones'], tags: ['new'],
        images: ['https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Brand', value: 'VisionTech' }, { name: 'Display', value: '6.1" LCD 60Hz' }],
      },
      {
        name: 'Wireless Earbuds Pro', sku: 'ELEC-AUD-002', price: 199.99, sale_price: 159.99,
        stock: 150, short_desc: 'True wireless earbuds with ANC',
        desc: 'Compact earbuds with active noise cancellation, transparency mode, and 8h battery.',
        category: cats['electronics'], tags: ['wireless', 'bestseller', 'sale'],
        images: ['https://images.unsplash.com/photo-1505236273191-1dce886b01e9?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'],
        attrs: [{ name: 'Brand', value: 'SoundWave' }, { name: 'Battery Life', value: '8h (32h with case)' }],
      },
      {
        name: 'Smart Watch Ultra', sku: 'ELEC-WCH-001', price: 399.99, sale_price: null,
        stock: 45, short_desc: 'Premium smartwatch with health tracking',
        desc: 'Advanced health monitoring, GPS, water resistance to 100m, and titanium case.',
        category: cats['electronics'], tags: ['premium', 'new', 'featured'],
        images: ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=1744&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'],
        attrs: [{ name: 'Brand', value: 'TimeTech' }, { name: 'Water Resistance', value: '100m' }],
      },
      {
        name: 'Tablet Pro 12.9', sku: 'ELEC-TAB-001', price: 1099.99, sale_price: 999.99,
        stock: 20, short_desc: 'Professional tablet with stylus support',
        desc: '12.9" Liquid Retina XDR display, M2 chip, perfect for creatives and professionals.',
        category: cats['electronics'], tags: ['premium', 'featured'],
        images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Brand', value: 'ProTech' }, { name: 'Display', value: '12.9" Liquid Retina XDR' }],
      },
      {
        name: 'USB-C Hub 10-in-1', sku: 'ELEC-ACC-001', price: 59.99, sale_price: 49.99,
        stock: 200, short_desc: 'Multi-port USB-C hub for laptops',
        desc: 'HDMI 4K, 3x USB-A, USB-C PD, SD/microSD, Ethernet, and 3.5mm audio.',
        category: cats['electronics'], tags: ['portable', 'sale'],
        images: ['https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Brand', value: 'ConnectPro' }, { name: 'Ports', value: '10' }],
      },
      {
        name: 'Mechanical Keyboard RGB', sku: 'ELEC-ACC-002', price: 129.99, sale_price: null,
        stock: 75, short_desc: 'Wireless mechanical keyboard with RGB',
        desc: 'Hot-swappable switches, per-key RGB, and tri-mode connectivity (USB-C, 2.4GHz, BT).',
        category: cats['electronics'], tags: ['wireless', 'premium'],
        images: ['https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Brand', value: 'KeyCraft' }, { name: 'Switch Type', value: 'Mechanical (Hot-swap)' }],
      },
      {
        name: 'Webcam 4K Pro', sku: 'ELEC-ACC-003', price: 149.99, sale_price: 129.99,
        stock: 55, short_desc: '4K webcam with auto-framing',
        desc: '4K resolution, AI-powered auto-framing, noise-cancelling microphones, and privacy shutter.',
        category: cats['electronics'], tags: ['new', 'featured'],
        images: ['https://images.unsplash.com/photo-1715869618915-a7bf6608d4c3?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'],
        attrs: [{ name: 'Brand', value: 'ClearView' }, { name: 'Resolution', value: '4K 30fps' }],
      },
      {
        name: 'Men\'s Slim Fit Chinos', sku: 'CLTH-MEN-002', price: 69.99, sale_price: null,
        stock: 100, short_desc: 'Comfortable slim fit chinos',
        desc: 'Stretch cotton blend chinos with a modern slim fit. Perfect for work or casual wear.',
        category: cats['mens'], tags: ['new'],
        images: ['https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Material', value: '98% Cotton, 2% Elastane' }, { name: 'Fit', value: 'Slim' }],
      },
      {
        name: 'Men\'s Wool Blazer', sku: 'CLTH-MEN-003', price: 199.99, sale_price: 169.99,
        stock: 35, short_desc: 'Classic wool blend blazer',
        desc: 'Tailored wool blend blazer with half-canvas construction. Ideal for business or smart casual.',
        category: cats['mens'], tags: ['premium', 'sale'],
        images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Material', value: '60% Wool, 40% Polyester' }, { name: 'Fit', value: 'Regular' }],
      },
      {
        name: 'Men\'s Athletic Shorts', sku: 'CLTH-MEN-004', price: 34.99, sale_price: null,
        stock: 180, short_desc: 'Moisture-wicking athletic shorts',
        desc: 'Lightweight and breathable athletic shorts with built-in brief liner.',
        category: cats['mens'], tags: ['bestseller', 'eco-friendly'],
        images: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Material', value: 'Recycled Polyester' }],
      },
      {
        name: 'Women\'s Cashmere Sweater', sku: 'CLTH-WMN-002', price: 149.99, sale_price: null,
        stock: 40, short_desc: 'Luxurious cashmere crew neck sweater',
        desc: '100% Grade-A Mongolian cashmere, ultra-soft and lightweight.',
        category: cats['womens'], tags: ['premium', 'featured'],
        images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Material', value: '100% Cashmere' }],
      },
      {
        name: 'Women\'s High-Waist Leggings', sku: 'CLTH-WMN-003', price: 54.99, sale_price: 44.99,
        stock: 200, short_desc: 'Squat-proof high-waist leggings',
        desc: 'Buttery-soft, four-way stretch leggings with hidden pocket. Squat-proof and sweat-wicking.',
        category: cats['womens'], tags: ['bestseller', 'sale'],
        images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Material', value: '75% Nylon, 25% Spandex' }],
      },
      {
        name: 'Women\'s Denim Jacket', sku: 'CLTH-WMN-004', price: 79.99, sale_price: null,
        stock: 65, short_desc: 'Classic denim jacket with stretch',
        desc: 'Timeless denim jacket with comfortable stretch. Pairs with everything.',
        category: cats['womens'], tags: ['new', 'bestseller'],
        images: ['https://images.unsplash.com/photo-1760624294535-40dfdc84a48f?q=80&w=930&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'],
        attrs: [{ name: 'Material', value: '99% Cotton, 1% Elastane' }],
      },
      {
        name: 'Women\'s Silk Blouse', sku: 'CLTH-WMN-005', price: 119.99, sale_price: 99.99,
        stock: 50, short_desc: 'Elegant silk blouse for office or evening',
        desc: 'Pure mulberry silk blouse with relaxed fit and French cuffs.',
        category: cats['womens'], tags: ['premium', 'sale'],
        images: ['https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Material', value: '100% Mulberry Silk' }],
      },
      {
        name: 'Air Purifier HEPA Pro', sku: 'HOME-AIR-001', price: 299.99, sale_price: 249.99,
        stock: 30, short_desc: 'HEPA air purifier for large rooms',
        desc: 'True HEPA H13 filter removes 99.97% of particles. Covers up to 1000 sq ft.',
        category: cats['home-kitchen'], tags: ['featured', 'eco-friendly'],
        images: ['https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Coverage', value: '1000 sq ft' }, { name: 'Filter Type', value: 'True HEPA H13' }],
      },
      {
        name: 'Robot Vacuum Smart', sku: 'HOME-VAC-001', price: 449.99, sale_price: null,
        stock: 25, short_desc: 'Self-emptying robot vacuum with mapping',
        desc: 'LiDAR navigation, self-emptying base, and app control for effortless cleaning.',
        category: cats['home-kitchen'], tags: ['wireless', 'premium'],
        images: ['https://images.unsplash.com/photo-1762501748150-7fd88647fc2c?q=80&w=1548&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'],
        attrs: [{ name: 'Brand', value: 'CleanBot' }, { name: 'Battery Life', value: '180 minutes' }],
      },
      {
        name: 'Cast Iron Dutch Oven', sku: 'HOME-KIT-002', price: 89.99, sale_price: null,
        stock: 50, short_desc: 'Enameled cast iron dutch oven 6qt',
        desc: 'Perfect for braising, baking bread, and slow cooking. Oven safe to 500°F.',
        category: cats['home-kitchen'], tags: ['bestseller'],
        images: ['https://images.unsplash.com/photo-1766746842414-e7a999ca83ce?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'],
        attrs: [{ name: 'Capacity', value: '6 Quarts' }, { name: 'Material', value: 'Enameled Cast Iron' }],
      },
      {
        name: 'Bamboo Cutting Board Set', sku: 'HOME-KIT-003', price: 39.99, sale_price: 29.99,
        stock: 90, short_desc: 'Set of 3 bamboo cutting boards',
        desc: 'Eco-friendly bamboo cutting boards in small, medium, and large sizes. Antimicrobial.',
        category: cats['home-kitchen'], tags: ['eco-friendly', 'sale'],
        images: ['https://images.unsplash.com/photo-1594226801341-41427b4e5c22?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Material', value: 'Organic Bamboo' }],
      },
      {
        name: 'Stainless Steel Water Bottle', sku: 'HOME-KIT-004', price: 29.99, sale_price: null,
        stock: 250, short_desc: 'Insulated water bottle 32oz',
        desc: 'Double-wall vacuum insulation keeps drinks cold 24h or hot 12h. BPA-free.',
        category: cats['home-kitchen'], tags: ['eco-friendly', 'portable', 'bestseller'],
        images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Capacity', value: '32 oz / 946 ml' }, { name: 'Material', value: '18/8 Stainless Steel' }],
      },
      {
        name: 'LED Desk Lamp Pro', sku: 'HOME-FUR-002', price: 79.99, sale_price: 64.99,
        stock: 70, short_desc: 'Adjustable LED desk lamp with USB port',
        desc: 'Eye-caring LED with 5 color modes, 7 brightness levels, USB charging port, and memory function.',
        category: cats['home-kitchen'], tags: ['featured', 'sale'],
        images: ['https://images.unsplash.com/photo-1571406487954-dc11b0c0767d?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'],
        attrs: [{ name: 'Brightness Levels', value: '7' }, { name: 'Color Modes', value: '5 (2700K-6500K)' }],
      },
      {
        name: 'Clean Code', sku: 'BOOK-PROG-002', price: 34.99, sale_price: null,
        stock: 90, short_desc: 'A handbook of agile software craftsmanship',
        desc: 'Robert C. Martin presents principles, patterns, and practices of writing clean code.',
        category: cats['books'], tags: ['bestseller', 'featured'],
        images: ['https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Author', value: 'Robert C. Martin' }, { name: 'Pages', value: '464' }],
      },
      {
        name: 'Design Patterns', sku: 'BOOK-PROG-003', price: 44.99, sale_price: 39.99,
        stock: 60, short_desc: 'Elements of reusable object-oriented software',
        desc: 'The classic Gang of Four book on design patterns. A must-have for software engineers.',
        category: cats['books'], tags: ['premium'],
        images: ['https://images.unsplash.com/photo-1589998059171-988d887df646?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Author', value: 'Erich Gamma et al.' }, { name: 'Pages', value: '395' }],
      },
      {
        name: 'The Pragmatic Programmer', sku: 'BOOK-PROG-004', price: 49.99, sale_price: null,
        stock: 75, short_desc: 'Your journey to mastery',
        desc: 'Updated 20th anniversary edition. Practical advice for modern software development.',
        category: cats['books'], tags: ['new', 'featured'],
        images: ['https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Author', value: 'David Thomas, Andrew Hunt' }, { name: 'Pages', value: '352' }],
      },
      {
        name: 'Atomic Habits', sku: 'BOOK-SELF-001', price: 16.99, sale_price: null,
        stock: 200, short_desc: 'Tiny changes, remarkable results',
        desc: 'James Clear reveals how small behavioral changes can lead to remarkable results.',
        category: cats['books'], tags: ['bestseller'],
        images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Author', value: 'James Clear' }, { name: 'Pages', value: '320' }],
      },
      {
        name: 'Sapiens: A Brief History', sku: 'BOOK-HIST-001', price: 19.99, sale_price: 14.99,
        stock: 110, short_desc: 'A brief history of humankind',
        desc: 'Yuval Noah Harari explores how Homo sapiens came to dominate the world.',
        category: cats['books'], tags: ['sale', 'bestseller'],
        images: ['https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Author', value: 'Yuval Noah Harari' }, { name: 'Pages', value: '498' }],
      },
      {
        name: 'Running Shoes CloudRunner', sku: 'SPRT-RUN-001', price: 139.99, sale_price: null,
        stock: 80, short_desc: 'Lightweight running shoes with cloud cushioning',
        desc: 'Engineered mesh upper, responsive cloud-foam midsole, and durable rubber outsole.',
        category: cats['sports'], tags: ['new', 'featured'],
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Brand', value: 'RunFit' }, { name: 'Weight', value: '250g' }],
      },
      {
        name: 'Resistance Bands Set', sku: 'SPRT-FIT-001', price: 24.99, sale_price: 19.99,
        stock: 300, short_desc: 'Set of 5 resistance bands',
        desc: 'Five resistance levels from light to extra heavy. Includes carrying bag and exercise guide.',
        category: cats['sports'], tags: ['sale', 'portable', 'bestseller'],
        images: ['https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Levels', value: '5 (10-50 lbs)' }],
      },
      {
        name: 'Adjustable Dumbbell Set', sku: 'SPRT-FIT-002', price: 299.99, sale_price: null,
        stock: 15, short_desc: 'Adjustable dumbbells 5-52.5 lbs',
        desc: 'Replace 15 pairs of dumbbells. Quick-change weight selector dial.',
        category: cats['sports'], tags: ['premium'],
        images: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Weight Range', value: '5-52.5 lbs per dumbbell' }],
      },
      {
        name: 'Camping Tent 4-Person', sku: 'SPRT-OUT-001', price: 189.99, sale_price: 159.99,
        stock: 25, short_desc: 'Waterproof 4-person camping tent',
        desc: 'Easy setup in under 5 minutes. Waterproof rainfly, mesh windows, and gear loft included.',
        category: cats['sports'], tags: ['sale', 'portable'],
        images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Capacity', value: '4 Person' }, { name: 'Weight', value: '4.2 kg' }],
      },
      {
        name: 'Hiking Backpack 50L', sku: 'SPRT-OUT-002', price: 119.99, sale_price: null,
        stock: 40, short_desc: 'Durable 50L hiking backpack',
        desc: 'Ventilated back panel, rain cover included, multiple compartments and hydration sleeve.',
        category: cats['sports'], tags: ['eco-friendly', 'portable'],
        images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Capacity', value: '50 Liters' }, { name: 'Material', value: 'Ripstop Nylon' }],
      },
      {
        name: 'Fitness Tracker Band', sku: 'SPRT-FIT-003', price: 49.99, sale_price: 39.99,
        stock: 150, short_desc: 'Slim fitness tracker with heart rate',
        desc: 'Track steps, heart rate, sleep, and 14 sport modes. Water resistant to 50m.',
        category: cats['sports'], tags: ['wireless', 'sale'],
        images: ['https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Battery Life', value: '14 days' }, { name: 'Water Resistance', value: '5 ATM' }],
      },
      {
        name: 'Electric Kettle Glass', sku: 'HOME-KIT-005', price: 44.99, sale_price: null,
        stock: 85, short_desc: 'Glass electric kettle with LED',
        desc: 'Borosilicate glass kettle with blue LED illumination. Boils water in under 4 minutes.',
        category: cats['home-kitchen'], tags: ['new'],
        images: ['https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Capacity', value: '1.7 Liters' }, { name: 'Material', value: 'Borosilicate Glass' }],
      },
      {
        name: 'Wireless Mouse Ergonomic', sku: 'ELEC-ACC-004', price: 69.99, sale_price: 59.99,
        stock: 95, short_desc: 'Ergonomic vertical wireless mouse',
        desc: 'Reduces wrist strain with 57° vertical design. Silent clicks, 6 buttons, adjustable DPI.',
        category: cats['electronics'], tags: ['wireless', 'eco-friendly'],
        images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Brand', value: 'ErgoTech' }, { name: 'DPI', value: 'Up to 4000' }],
      },
      {
        name: 'Portable Power Bank 20000', sku: 'ELEC-ACC-005', price: 39.99, sale_price: null,
        stock: 130, short_desc: '20000mAh portable charger',
        desc: 'Fast charge 3 devices simultaneously. USB-C PD 65W output charges laptops too.',
        category: cats['electronics'], tags: ['portable', 'bestseller'],
        images: ['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Capacity', value: '20000mAh' }, { name: 'Max Output', value: '65W USB-C PD' }],
      },
      {
        name: 'Men\'s Leather Belt', sku: 'CLTH-MEN-005', price: 44.99, sale_price: null,
        stock: 110, short_desc: 'Genuine leather dress belt',
        desc: 'Full-grain Italian leather belt with brushed nickel buckle. 35mm width.',
        category: cats['mens'], tags: ['premium'],
        images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Material', value: 'Full-Grain Italian Leather' }],
      },
      {
        name: 'Insulated Travel Mug', sku: 'HOME-KIT-006', price: 24.99, sale_price: 19.99,
        stock: 160, short_desc: 'Leak-proof insulated travel mug 16oz',
        desc: 'Double-wall vacuum insulation, leak-proof lid, and one-hand drinking. Fits car cup holders.',
        category: cats['home-kitchen'], tags: ['portable', 'sale', 'eco-friendly'],
        images: ['https://images.unsplash.com/photo-1577937927133-66ef06acdf18?w=600&h=600&fit=crop'],
        attrs: [{ name: 'Capacity', value: '16 oz / 473 ml' }, { name: 'Material', value: 'Stainless Steel' }],
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
      `INSERT INTO promotion (name, type, discount_value, start_date, end_date, is_active)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING promotion_id`,
      ['Summer Tech Sale', 'percentage', 20, now.toISOString(), in30Days.toISOString(), true]
    );

    const { rows: [promo2] } = await client.query(
      `INSERT INTO promotion (name, type, discount_value, start_date, end_date, is_active)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING promotion_id`,
      ['Flash Deal', 'fixed', 15, now.toISOString(), in7Days.toISOString(), true]
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
