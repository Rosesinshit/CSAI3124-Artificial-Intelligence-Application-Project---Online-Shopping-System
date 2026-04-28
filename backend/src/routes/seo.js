const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET /sitemap.xml - Generate XML sitemap (Block Y - Y4)
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;

    // Get all active products
    const products = await db.query(
      `SELECT slug, product_id, updated_at FROM product WHERE is_active = true ORDER BY updated_at DESC`
    );

    // Get all active categories
    const categories = await db.query(
      `SELECT slug, category_id FROM category WHERE is_active = true ORDER BY name`
    );

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Homepage
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    // Products page
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/products</loc>\n`;
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `  </url>\n`;

    // Category pages
    for (const cat of categories.rows) {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/category/${cat.slug}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    // Product pages
    for (const prod of products.rows) {
      const lastmod = prod.updated_at ? new Date(prod.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/product/${prod.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += '</urlset>';

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// GET /robots.txt - Serve robots.txt (Block Y - Y4)
router.get('/robots.txt', (req, res) => {
  const baseUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /cart
Disallow: /checkout
Disallow: /profile
Disallow: /orders
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;
  res.set('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

// GET /api/v1/seo/product/:id - Get SEO metadata for a product (Block Y - Y2, Y3)
router.get('/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const baseUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;

    // Use product_id if numeric, otherwise match by slug
    const isNumeric = /^[0-9]+$/.test(id);
    const result = await db.query(
      `SELECT p.*, c.name as category_name, c.slug as category_slug
       FROM product p
       LEFT JOIN category c ON p.category_id = c.category_id
       WHERE (${isNumeric ? 'p.product_id = $1' : 'p.slug = $1'}) AND p.is_active = true`,
      [isNumeric ? parseInt(id, 10) : id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found' }
      });
    }

    const product = result.rows[0];

    // Get images
    const images = await db.query(
      'SELECT image_url, alt_text FROM product_image WHERE product_id = $1 ORDER BY sort_order',
      [product.product_id]
    );

    // Get active promotions for this product
    const promotions = await db.query(
      `SELECT pp.promotional_price, pr.name as promotion_name, pr.end_date
       FROM product_promotion pp
       JOIN promotion pr ON pp.promotion_id = pr.promotion_id
       WHERE pp.product_id = $1 AND pr.is_active = true
         AND pr.start_date <= CURRENT_DATE AND pr.end_date >= CURRENT_DATE
       LIMIT 1`,
      [product.product_id]
    );

    const currentPrice = promotions.rows.length > 0
      ? promotions.rows[0].promotional_price
      : (product.sale_price || product.price);
    const productUrl = `${baseUrl}/product/${product.slug}`;
    const siteName = 'ShopOnline';

    // Meta tags (Y2)
    const metaTags = {
      title: product.meta_title || `${product.name} | ${product.category_name || 'Products'} | ${siteName}`,
      description: product.meta_description || product.short_description || (product.description ? product.description.replace(/<[^>]*>/g, '').substring(0, 160) : ''),
      keywords: product.meta_keywords || `${product.name}, ${product.category_name || ''}, online shopping`,
      canonical: productUrl,
      ogTitle: product.meta_title || product.name,
      ogDescription: product.meta_description || product.short_description || '',
      ogImage: images.rows.length > 0 ? `${baseUrl}${images.rows[0].image_url}` : '',
      ogUrl: productUrl,
      ogType: 'product',
      ogSiteName: siteName,
      twitterCard: 'summary_large_image',
      twitterTitle: product.name,
      twitterDescription: product.short_description || '',
      twitterImage: images.rows.length > 0 ? `${baseUrl}${images.rows[0].image_url}` : '',
    };

    // JSON-LD structured data (Y3)
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: images.rows.map(img => `${baseUrl}${img.image_url}`),
      description: product.short_description || product.description?.replace(/<[^>]*>/g, '') || '',
      sku: product.sku,
      offers: {
        '@type': 'Offer',
        url: productUrl,
        priceCurrency: 'HKD',
        price: parseFloat(currentPrice).toFixed(2),
        availability: product.stock_quantity > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: siteName,
        },
      },
    };

    if (promotions.rows.length > 0) {
      jsonLd.offers.priceValidUntil = promotions.rows[0].end_date;
    }

    // Breadcrumb JSON-LD (Y3)
    const breadcrumbLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl + '/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Products',
          item: baseUrl + '/products',
        },
      ],
    };

    if (product.category_name) {
      breadcrumbLd.itemListElement.push({
        '@type': 'ListItem',
        position: 3,
        name: product.category_name,
        item: `${baseUrl}/category/${product.category_slug}`,
      });
      breadcrumbLd.itemListElement.push({
        '@type': 'ListItem',
        position: 4,
        name: product.name,
      });
    } else {
      breadcrumbLd.itemListElement.push({
        '@type': 'ListItem',
        position: 3,
        name: product.name,
      });
    }

    res.json({
      success: true,
      data: {
        metaTags,
        jsonLd,
        breadcrumbLd,
      },
    });
  } catch (error) {
    console.error('Get product SEO error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get SEO data' } });
  }
});

// GET /api/v1/seo/category/:slug - Get SEO metadata for a category (Block Y)
router.get('/category/:slug', async (req, res) => {
  try {
    const baseUrl = process.env.SITE_URL || `${req.protocol}://${req.get('host')}`;
    const { slug } = req.params;

    const result = await db.query(
      'SELECT * FROM category WHERE slug = $1 AND is_active = true',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found' }
      });
    }

    const category = result.rows[0];
    const siteName = 'ShopOnline';
    const categoryUrl = `${baseUrl}/category/${category.slug}`;

    const metaTags = {
      title: `${category.name} Products | ${siteName}`,
      description: category.description || `Browse ${category.name} products at ${siteName}`,
      canonical: categoryUrl,
      ogTitle: `${category.name} Products`,
      ogDescription: category.description || `Browse ${category.name} products at ${siteName}`,
      ogUrl: categoryUrl,
      ogType: 'website',
      ogSiteName: siteName,
    };

    const breadcrumbLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl + '/',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: category.name,
          item: categoryUrl,
        },
      ],
    };

    res.json({
      success: true,
      data: { metaTags, breadcrumbLd },
    });
  } catch (error) {
    console.error('Get category SEO error:', error);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get SEO data' } });
  }
});

module.exports = router;
