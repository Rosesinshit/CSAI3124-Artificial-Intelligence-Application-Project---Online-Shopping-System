# ShopOnline — Developer Documentation

> Full-stack e-commerce platform built with React + Express + PostgreSQL, featuring an Apple-inspired glass UI, SEO optimization, wish lists, promotional pricing, and multi-photo product management.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Quick Start](#quick-start)
3. [Project Structure](#project-structure)
4. [Backend Architecture](#backend-architecture)
5. [Frontend Architecture](#frontend-architecture)
6. [Block Implementation Reference](#block-implementation-reference)
7. [SEO Implementation](#seo-implementation)
8. [Database Schema](#database-schema)
9. [API Reference](#api-reference)
10. [Default Accounts](#default-accounts)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18.3, React Router 6.26, Vite 5.4, Tailwind CSS 3.4, Axios |
| Backend | Node.js, Express 4.21, pg (PostgreSQL driver), JWT, bcrypt, multer |
| Database | PostgreSQL 14+ |
| Design | Apple-style glass morphism UI with custom Tailwind theme |

---

## Quick Start

```bash
# 1. Install dependencies
cd backend && npm install
cd ../frontend && npm install

# 2. Set up PostgreSQL
#    Create a database named "shopping_db" (user: postgres, password: postgres)

# 3. Initialize schema and seed data
cd ../backend
node src/database/init.js    # Creates all tables
node src/database/seed.js    # Inserts demo data

# 4. Start servers
node src/server.js           # Backend → http://localhost:5000
cd ../frontend
npm run dev                  # Frontend → http://localhost:3000
```

---

## Project Structure

```
Shopping-Website/
├── Project_Scope_and_Activity_List.md   # WBS, activity list, critical path
├── System_Design.md                      # Architecture & design docs
├── README.md                             # This file
├── backend/                              # Express API server
│   ├── package.json
│   ├── uploads/products/                 # Uploaded product images (disk storage)
│   └── src/
│       ├── server.js                     # App entry point
│       ├── config/
│       │   └── database.js               # PostgreSQL pool config
│       ├── database/
│       │   ├── schema.sql                # Full DDL (19 tables, indexes, triggers)
│       │   ├── init.js                   # Schema initialization script
│       │   └── seed.js                   # Demo data seeder
│       ├── middleware/
│       │   ├── auth.js                   # JWT auth + role guard
│       │   └── upload.js                 # Multer image upload
│       ├── routes/
│       │   ├── auth.js                   # Registration, login, profile
│       │   ├── products.js               # Product listing, search, detail
│       │   ├── cart.js                   # Cart CRUD
│       │   ├── orders.js                 # Order lifecycle
│       │   ├── admin.js                  # Admin product/order/category mgmt
│       │   ├── categories.js             # Category tree + product counts
│       │   ├── tags.js                   # Tag listing
│       │   ├── wishlist.js               # Wish list + price alerts
│       │   ├── promotions.js             # Promotional pricing management
│       │   └── seo.js                    # Sitemap, robots.txt, product SEO metadata
│       └── utils/
│           └── helpers.js                # Slugify, pagination, order number gen
└── frontend/                             # React SPA
    ├── package.json
    ├── index.html                        # HTML shell
    ├── vite.config.js                    # Vite config (proxy, port 3000)
    ├── tailwind.config.js                # Apple design system (colors, fonts, glass)
    ├── postcss.config.js                 # PostCSS + Tailwind + Autoprefixer
    └── src/
        ├── main.jsx                      # React DOM root
        ├── App.jsx                       # Router + Context providers
        ├── api.js                        # Axios client (base URL, JWT interceptor)
        ├── index.css                     # Glass utilities, Apple component classes
        ├── components/
        │   ├── Navbar.jsx                # Top navigation (frosted glass, search)
        │   ├── Footer.jsx                # Site footer
        │   ├── ProductCard.jsx           # Product grid card (glass card)
        │   ├── Pagination.jsx            # Page controls
        │   ├── OrderStatusBadge.jsx      # Color-coded status pills
        │   └── SEOHead.jsx               # Dynamic <head> meta tag manager
        ├── context/
        │   ├── AuthContext.jsx           # Auth state (user, login, register, logout)
        │   ├── CartContext.jsx           # Cart state (items, add, remove, clear)
        │   └── WishlistContext.jsx       # Wishlist state + price notifications
        └── pages/
            ├── HomePage.jsx              # Hero + categories + latest products
            ├── ProductListPage.jsx       # Filtered/sorted product grid
            ├── ProductDetailPage.jsx     # Full product view (gallery, cart, wishlist)
            ├── SearchPage.jsx            # Multi-attribute search results
            ├── CartPage.jsx              # Shopping cart
            ├── CheckoutPage.jsx          # Order placement
            ├── OrdersPage.jsx            # Customer order history
            ├── OrderDetailPage.jsx       # Single order detail + status history
            ├── LoginPage.jsx             # Dark glass login card
            ├── RegisterPage.jsx          # Dark glass registration card
            ├── ProfilePage.jsx           # User profile editing
            ├── WishlistPage.jsx          # Wish list + price drop alerts
            ├── PromotionsPage.jsx        # Active promotions browser
            └── admin/
                ├── AdminDashboard.jsx    # Stats, quick links, recent orders
                ├── AdminProducts.jsx     # Product list management
                ├── AdminProductForm.jsx  # Create/edit product (images, attrs, tags)
                ├── AdminOrders.jsx       # All orders management
                ├── AdminOrderDetail.jsx  # Order detail + status transitions
                └── AdminPromotions.jsx   # Promotion CRUD + product linking
```

---

## Backend Architecture

### Entry Point — `server.js`

Sets up Express with CORS, JSON parsing, and mounts 10 route modules under `/api/v1/`. Serves uploaded files from `/uploads/` and SEO routes (`/sitemap.xml`, `/robots.txt`) at root level. Includes global error handling middleware and a health check at `GET /api/v1/health`.

### Config — `config/database.js`

PostgreSQL connection pool via `pg.Pool`. Reads from environment variables with defaults (`localhost:5432`, database `shopping_db`, user `postgres`). Exports `query()` for one-shot queries, `getClient()` for transactions, and raw `pool` reference. Max 20 connections, 30s idle timeout.

### Database — `database/`

| File | Purpose |
|------|---------|
| `schema.sql` | Complete DDL for 19 tables with indexes, foreign keys, recommendation/event tracking tables, and an `update_updated_at_column` trigger. Recreates the schema from scratch for clean local resets. |
| `init.js` | CLI script — reads `schema.sql`, executes it against the database, creates `uploads/products/` directory, then exits. Run once before first use. |
| `seed.js` | CLI script — truncates all data, then inserts: 2 users (admin + customer), 5 categories + 4 subcategories, 8 tags, 10 products with images/attributes/tags, and 2 active promotions linked to products. Transactional (rolls back on failure). |

### Middleware — `middleware/`

| File | Exports | Purpose |
|------|---------|---------|
| `auth.js` | `authenticate`, `optionalAuth`, `requireAdmin` | JWT verification via Bearer token. `authenticate` is required auth (401 on failure). `optionalAuth` silently attaches user if token exists. `requireAdmin` checks `role === 'admin'` (403 on failure). |
| `upload.js` | Multer instance | Disk storage in `uploads/products/` with UUID filenames. Accepts JPEG/PNG/GIF/WebP, max 5MB, up to 10 files per request. |

### Routes — `routes/`

| File | Prefix | Auth | Purpose |
|------|--------|------|---------|
| `auth.js` | `/api/v1/auth` | Mixed | `POST /register`, `POST /login` (public); `GET /profile`, `PUT /profile`, `POST /refresh` (auth required). Uses express-validator for input validation. Returns JWT tokens. |
| `products.js` | `/api/v1/products` | Public | `GET /` (paginated list with category/sort/promo pricing), `GET /search` (full-text search across name, description, attributes with tag/category/price filters), `GET /:id` (detail with images, attrs, tags, promos — supports ID or slug), `GET /:id/images`, `GET /:id/related` (related by shared category/tags with relevance score). |
| `cart.js` | `/api/v1/cart` | Auth | `GET /` (cart with line totals), `POST /items` (add/upsert with stock validation), `PUT /items/:id` (update qty), `DELETE /items/:id` (remove), `DELETE /` (clear). Auto-creates cart per user. |
| `orders.js` | `/api/v1/orders` | Auth | `POST /` (transactional: validate stock → deduct inventory → create order → clear cart → record status history), `GET /` (list with status filter + pagination), `GET /:id` (detail with items + history), `PUT /:id/cancel` (only PENDING/HOLD, restores stock), `GET /:id/history`. |
| `admin.js` | `/api/v1/admin` | Admin | Products CRUD (`GET/POST/PUT/DELETE`), image upload/delete (via multer), order management with validated status transitions (PENDING→CONFIRMED→SHIPPED→COMPLETED, with HOLD/CANCELLED branches; cancel restores stock), category CRUD. |
| `categories.js` | `/api/v1/categories` | Public | `GET /` (tree structure with product counts using parent→children nesting), `GET /:id/products` (includes subcategory products, paginated). |
| `tags.js` | `/api/v1/tags` | Public | `GET /` (all tags with product_count via LEFT JOIN). |
| `wishlist.js` | `/api/v1/wishlist` | Auth | `GET /` (items with current price + `price_dropped` flag), `POST /items` (add with price snapshot), `DELETE /items/:id`, `GET /check/:productId`, price alerts (`POST /price-alerts`, `DELETE /price-alerts/:id`), `GET /notifications` (price drops + triggered alerts). |
| `promotions.js` | `/api/v1/promotions` | Mixed | Public: `GET /` (active promotions), `GET /:id` (detail), `GET /:id/products`. Admin: `POST /`, `PUT /:id`, `DELETE /:id`, `POST /:id/products` (link product), `DELETE /:id/products/:productId` (unlink). Supports percentage/fixed/special_price types. |
| `recommendations.js` | `/api/v1/recommendations` | Mixed | Auth: `GET /` (hybrid personalized recommendations). Public: `GET /popular`, `GET /similar/:productId`. Uses collaborative, content-based, and popularity scoring with stock/promotional filtering. |
| `behaviors.js` | `/api/v1/behaviors` | Auth | `POST /` to persist recommendation training events (`VIEW`, `ADD_TO_CART`, `PURCHASE`, `WISHLIST_ADD`, `SEARCH`, `CLICK_RECOMMENDATION`) with session and metadata payloads. |
| `seo.js` | `/api/v1/seo` | Public | `GET /product/:id` (full SEO metadata), plus root-level `GET /sitemap.xml` and `GET /robots.txt`. See [SEO Implementation](#seo-implementation). |

### Utilities — `utils/helpers.js`

| Function | Purpose |
|----------|---------|
| `generateOrderNumber()` | Creates `ORD-{timestamp}-{random4digit}` format strings for unique order numbers. |
| `slugify(text)` | Converts text to URL-safe lowercase slug (strips special chars, max 200 chars). |
| `getPagination(query)` | Extracts `page`, `limit`, `offset` from request query params. Defaults: page 1, limit 20, max 100. |
| `paginationMeta(page, limit, total)` | Returns `{ page, limit, total, totalPages }` for API response metadata. |

---

## Frontend Architecture

### Build Tooling

| File | Purpose |
|------|---------|
| `vite.config.js` | Dev server on port 3000. Proxies `/api` and `/uploads` to `http://localhost:5000`. |
| `tailwind.config.js` | Custom Apple design system: color palette (`apple-blue`, `apple-dark`, `apple-gray`, `apple-green`, `apple-red`, `apple-orange`, `apple-purple`, 5 gray tones), SF Pro font stack, `backdropBlur`, custom `boxShadow` (glass, glass-lg, apple, apple-hover), keyframe animations (fadeIn, slideUp, scaleIn, glassShine). |
| `postcss.config.js` | Loads Tailwind CSS and Autoprefixer. |
| `index.css` | CSS custom properties (`--glass-bg`, `--glass-blur`, etc.), glass component classes (`.glass`, `.glass-heavy`, `.glass-light`, `.glass-card`, `.glass-nav`, `.glass-input`), Apple button system (`.btn-apple`, `.btn-apple-primary`, `.btn-apple-secondary`, `.btn-apple-glass`), typography (`.section-heading`, `.section-subheading`), `.shimmer` loading animation. |

### App Shell — `main.jsx` → `App.jsx`

`main.jsx` mounts the React root. `App.jsx` wraps the entire app in `BrowserRouter` → `AuthProvider` → `CartProvider` → `WishlistProvider`, then renders `<Navbar />`, `<main>` with route definitions, and `<Footer />`. The wrapper div has `bg-apple-gray-5` and main content uses `animate-fade-in`.

### API Client — `api.js`

Axios instance with `baseURL: '/api/v1'`. Request interceptor attaches `Authorization: Bearer <token>` from localStorage. Response interceptor catches 401 errors and redirects to `/login` (clearing stored token).

### Context Providers — `context/`

| Context | State | Key Functions |
|---------|-------|---------------|
| `AuthContext` | `user`, `loading` | `login(email, pw)`, `register(form)`, `logout()`, `updateProfile(data)` — persists JWT + user to localStorage. |
| `CartContext` | `cart` (items + total), `loading` | `addToCart(productId, qty)`, `updateQuantity(itemId, qty)`, `removeItem(itemId)`, `clearCart()`, `fetchCart()` — auto-fetches on user login. |
| `WishlistContext` | `wishlist`, `notifications`, `loading` | `addToWishlist(productId)`, `removeFromWishlist(itemId)`, `isInWishlist(productId)`, `getWishlistItemId(productId)`, `setPriceAlert(productId, price)`, `removePriceAlert(alertId)`, `fetchNotifications()` — auto-fetches on login. |

### Components — `components/`

| Component | Purpose |
|-----------|---------|
| `Navbar.jsx` | Sticky frosted-glass navigation bar (`glass-nav`). Contains logo (shopping bag SVG), desktop nav links (Products, Deals), expandable search input, wishlist/cart icons with notification badges, user dropdown menu (glass-heavy), and mobile hamburger menu. |
| `Footer.jsx` | Site footer with navigation links and copyright. |
| `ProductCard.jsx` | Glass card (`glass-card`) product tile with hover scale effect, lazy-loaded image, promo/sale badge (orange/red), product name, category label, price display with strikethrough for discounts. |
| `Pagination.jsx` | Page navigation with previous/next buttons and page numbers. |
| `OrderStatusBadge.jsx` | Color-coded status indicator using dot + label pattern for order statuses (PENDING=orange, CONFIRMED=blue, SHIPPED=purple, COMPLETED=green, CANCELLED=red, HOLD=yellow). |
| `SEOHead.jsx` | Dynamically manages `<head>` tags via `useEffect`. See [SEO Implementation](#seo-implementation). |

### Pages — `pages/`

| Page | Route | Purpose |
|------|-------|---------|
| `HomePage` | `/` | Black hero section with "Shop smarter." headline + animation, category grid (SVG icons), latest 8 products grid. |
| `ProductListPage` | `/products`, `/category/:slug` | Filterable product grid with glass-input dropdowns (category, sort), shimmer loader, pagination. Resolves category slugs. |
| `ProductDetailPage` | `/product/:id` | Two-column layout: image gallery (glass rounded-3xl, thumbnails with ring-offset) + product info (price, promo badge, stock dot, quantity selector, "Add to Bag" button, wishlist toggle, price alert form, specifications, tags). Full description section. Related products grid. |
| `SearchPage` | `/search` | Multi-attribute full-text search with results display. Supports `?q=` and `?tags=` query params. |
| `CartPage` | `/cart` | Cart items with quantity controls, line totals, cart summary, proceed to checkout button. |
| `CheckoutPage` | `/checkout` | Shipping address form, order summary, place order (transactional). |
| `OrdersPage` | `/orders` | Customer order list with status filter tabs, pagination. |
| `OrderDetailPage` | `/orders/:id` | Order items, status history timeline, cancel button (PENDING/HOLD only). |
| `LoginPage` | `/login` | Dark glass card with blue border glow, underline-style inputs with icons, gradient login button, remember me checkbox. |
| `RegisterPage` | `/register` | Same dark glass style as login. 4 fields: name, email, password, phone. |
| `ProfilePage` | `/profile` | Edit user profile (name, email, phone, address). |
| `WishlistPage` | `/wishlist` | Wish list items with price-drop indicators, active price alerts, remove/alert management. |
| `PromotionsPage` | `/promotions` | Browse active promotions, view discounted products per promotion. |
| `AdminDashboard` | `/admin` | Stats cards (products/orders/pending), quick links (SVG icons), recent orders table with dot status. |
| `AdminProducts` | `/admin/products` | Product list with search, edit/delete, status toggle, link to create form. |
| `AdminProductForm` | `/admin/products/new`, `/admin/products/:id/edit` | Create/edit product: basic info, pricing, images (drag-drop upload), attributes (add/remove/HTML toggle), tag selection, category picker. |
| `AdminOrders` | `/admin/orders` | All orders with status filter, search by order number/customer. |
| `AdminOrderDetail` | `/admin/orders/:id` | Order detail with status transition buttons (validated transitions), items list, status history. |
| `AdminPromotions` | `/admin/promotions` | Promotion CRUD, product linking, type configs (percentage/fixed/special_price), date management. |

---

## Block Implementation Reference

This section maps each block from `Project_Scope_and_Activity_List.md` to the actual implementation files.

### Block A — Core Functions

| Requirement | Description | Files |
|-------------|-------------|-------|
| A1–A2 | User registration & authentication | `backend/src/routes/auth.js`, `backend/src/middleware/auth.js`, `frontend/src/context/AuthContext.jsx`, `frontend/src/pages/LoginPage.jsx`, `frontend/src/pages/RegisterPage.jsx` |
| A3–A6 | Product listing & detail pages | `backend/src/routes/products.js`, `backend/src/routes/categories.js`, `frontend/src/pages/HomePage.jsx`, `frontend/src/pages/ProductListPage.jsx`, `frontend/src/pages/ProductDetailPage.jsx`, `frontend/src/components/ProductCard.jsx` |
| A7–A10 | Shopping cart functionality | `backend/src/routes/cart.js`, `frontend/src/context/CartContext.jsx`, `frontend/src/pages/CartPage.jsx` |
| A11–A13 | Checkout & order creation | `backend/src/routes/orders.js`, `frontend/src/pages/CheckoutPage.jsx` |
| A14–A17 | Admin product management | `backend/src/routes/admin.js` (product CRUD + image upload), `frontend/src/pages/admin/AdminProducts.jsx`, `frontend/src/pages/admin/AdminProductForm.jsx` |
| A18–A20 | Admin order management | `backend/src/routes/admin.js` (order endpoints), `frontend/src/pages/admin/AdminOrders.jsx`, `frontend/src/pages/admin/AdminOrderDetail.jsx` |

### Block B — Multiple Photos & Order Processing

| Requirement | Description | Files |
|-------------|-------------|-------|
| B1 | Multiple photo upload & display | `backend/src/routes/admin.js` (`POST /products/:id/images` with multer), `backend/src/middleware/upload.js`, `frontend/src/pages/admin/AdminProductForm.jsx` (image upload UI), `frontend/src/pages/ProductDetailPage.jsx` (gallery with thumbnails) |
| B2 | Order status workflow (4+ statuses) | `backend/src/routes/admin.js` (`PUT /orders/:id/status` — validates: PENDING→CONFIRMED→SHIPPED→COMPLETED, plus HOLD/CANCELLED), `backend/src/database/schema.sql` (CHECK constraint on `purchase_order.status`) |
| B3 | Order status filtering for customers | `backend/src/routes/orders.js` (`GET /` with `?status=` filter), `frontend/src/pages/OrdersPage.jsx` (status filter tabs) |
| B4 | Status change date tracking | `backend/src/database/schema.sql` (`order_status_history` table), `backend/src/routes/admin.js` (inserts history on status change), `frontend/src/pages/OrderDetailPage.jsx` (status history timeline) |

### Block C — Advanced Product Search & Navigation

| Requirement | Description | Files |
|-------------|-------------|-------|
| C1 | Extended product attributes (HTML support) | `backend/src/database/schema.sql` (`product_attribute` table with `is_html` flag), `backend/src/routes/products.js` (returns attributes in detail), `frontend/src/pages/ProductDetailPage.jsx` (renders HTML attrs via DOMPurify) |
| C2 | Multi-attribute keyword search | `backend/src/routes/products.js` (`GET /search` — full-text search across name, description, attribute values), `frontend/src/pages/SearchPage.jsx` |
| C3 | Category/price/tag filtering | `backend/src/routes/products.js` (`GET /` and `GET /search` — `?category=`, `?min_price=`, `?max_price=`, `?tags=`), `frontend/src/pages/ProductListPage.jsx` (filter dropdowns) |
| C4 | Related products display | `backend/src/routes/products.js` (`GET /:id/related` — matches by shared category and tags with relevance scoring), `frontend/src/pages/ProductDetailPage.jsx` (related products grid) |
| C5 | Admin attribute editing | `backend/src/routes/admin.js` (attributes in product create/update), `frontend/src/pages/admin/AdminProductForm.jsx` (dynamic attribute editor with add/remove/HTML toggle) |

### Block S — Product Recommendations (AI)

| Requirement | Description | Status |
|-------------|-------------|--------|
| S1 | User behavior data collection | Implemented — product views, searches, add-to-cart, purchases, wish list adds, and recommendation clicks are persisted in `user_behavior`. |
| S2 | AI recommendation model | Implemented — hybrid scorer combines collaborative filtering, content affinity, and popularity fallback with diversity and stock filtering. |
| S3 | Recommendation API endpoints | Implemented — `GET /recommendations`, `GET /recommendations/popular`, `GET /recommendations/similar/:productId`, `POST /behaviors`. |
| S4 | UI integration | Implemented — homepage now surfaces personalized/trending recommendations and product detail pages show AI-ranked similar products with click tracking. |

### Block U — Wish List & Promotional Pricing

| Requirement | Description | Files |
|-------------|-------------|-------|
| U1 | Wish list CRUD operations | `backend/src/routes/wishlist.js` (list, add, remove, check endpoints), `frontend/src/context/WishlistContext.jsx`, `frontend/src/pages/WishlistPage.jsx`, `frontend/src/pages/ProductDetailPage.jsx` (wishlist toggle button) |
| U2 | Price drop notification system | `backend/src/routes/wishlist.js` (`POST /price-alerts`, `GET /notifications` — compares current price vs target price and price-when-added), `frontend/src/pages/WishlistPage.jsx` (notification badges, price drop indicators), `frontend/src/pages/ProductDetailPage.jsx` (price alert form) |
| U3 | Promotional pricing management | `backend/src/routes/promotions.js` (full CRUD + product linking, supports percentage/fixed/special_price types with date ranges), `backend/src/routes/products.js` (includes promotional_price in listing/detail), `frontend/src/pages/admin/AdminPromotions.jsx`, `frontend/src/pages/PromotionsPage.jsx`, `frontend/src/components/ProductCard.jsx` (promo badge) |

### Block Y — Search Engine Optimization

See the dedicated [SEO Implementation](#seo-implementation) section below for full details.

| Requirement | Description | Files |
|-------------|-------------|-------|
| Y1 | SEO-friendly URL routing | `backend/src/utils/helpers.js` (`slugify()`), `backend/src/database/schema.sql` (`slug` columns on product/category/tag), `frontend/src/App.jsx` (routes: `/category/:slug`, `/product/:id`), `backend/src/routes/products.js` (resolves by slug or ID) |
| Y2 | Meta tags & Open Graph | `backend/src/routes/seo.js` (`GET /product/:id` — returns meta title/description/keywords, og:title/description/image/url/type/site_name, twitter:card/title/description/image), `frontend/src/components/SEOHead.jsx` |
| Y3 | Structured data (JSON-LD) | `backend/src/routes/seo.js` (generates Schema.org `Product` and `BreadcrumbList` JSON-LD), `frontend/src/components/SEOHead.jsx` (injects `<script type="application/ld+json">`) |
| Y4 | Page indexing & sitemap | `backend/src/routes/seo.js` (`GET /sitemap.xml` — dynamic XML sitemap with products + categories; `GET /robots.txt` — disallows admin/cart/api paths, points to sitemap) |

---

## SEO Implementation

The SEO system spans backend route generation and frontend rendering, implemented across three key files:

### Backend — `backend/src/routes/seo.js`

This file provides three endpoints:

1. **`GET /sitemap.xml`** — Dynamically generates an XML sitemap including:
   - Static pages (home, products, promotions)
   - All active product URLs (using slug or ID)
   - All category URLs (using slug)
   - Sets `<changefreq>` and `<priority>` appropriately (products = 0.8, categories = 0.7)

2. **`GET /robots.txt`** — Serves a robots.txt that:
   - Allows all crawlers to access public pages
   - Disallows `/admin/`, `/cart`, `/checkout`, `/api/`, `/profile`, `/orders`
   - Points to the sitemap URL

3. **`GET /api/v1/seo/product/:id`** — Returns a comprehensive SEO metadata object:
   - **Meta tags**: `title` (product name + price + store name), `description` (from product short_description), `keywords` (from product tags + category)
   - **Open Graph tags**: `og:title`, `og:description`, `og:image` (primary product image), `og:url`, `og:type=product`, `og:site_name`
   - **Twitter Card tags**: `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`
   - **JSON-LD (Schema.org Product)**: Structured data including `@type: Product`, `name`, `description`, `image`, `sku`, `brand`, `category`, `offers` (with `price`, `priceCurrency`, `availability` based on stock, `url`), and `aggregateRating` if applicable
   - **JSON-LD (BreadcrumbList)**: Breadcrumb structured data: Home → Category → Product

### Frontend — `frontend/src/components/SEOHead.jsx`

A React component that dynamically manages `<head>` content via `useEffect`:

- **Creates/updates meta tags**: Sets `<title>`, `<meta name="description">`, `<meta name="keywords">`, `<link rel="canonical">`
- **Open Graph tags**: Creates `<meta property="og:*">` tags for: title, description, image, url, type, site_name
- **Twitter Card tags**: Creates `<meta name="twitter:*">` tags for: card type, title, description, image
- **JSON-LD injection**: Accepts a `jsonLd` prop (object or array of objects), serializes each as `<script type="application/ld+json">` in the document head
- **Cleanup**: On unmount, removes all injected meta/link/script tags to prevent duplicates on navigation

### Frontend — Page Integration

SEO metadata is consumed in product-facing pages:

- **`ProductDetailPage.jsx`**: Fetches SEO data from `GET /api/v1/seo/product/:id` and passes all meta tags, OG tags, Twitter tags, and JSON-LD objects to `<SEOHead>`. Falls back to basic title/description if SEO fetch fails.
- **`HomePage.jsx`**: Uses `<SEOHead>` with static site-level metadata (site title, description, keywords).
- **`ProductListPage.jsx`**: Uses `<SEOHead>` with dynamic category-based metadata and canonical URL.
- **`PromotionsPage.jsx`**: Uses `<SEOHead>` with promotions-focused metadata.

### Data Flow

```
User visits /product/123
  → ProductDetailPage fetches GET /api/v1/seo/product/123
  → Backend queries product + images + tags + category
  → Backend constructs meta tags + OG + Twitter + JSON-LD
  → Returns JSON to frontend
  → SEOHead component injects all tags into <head>
  → Search engines and social platforms can read structured data
```

---

## Database Schema

19 tables organized by domain:

| Domain | Tables | Key Relationships |
|--------|--------|-------------------|
| Users | `user` | Role: `customer` or `admin`. Email unique. |
| Catalog | `category`, `product`, `product_image`, `product_tag`, `product_tag_mapping`, `product_attribute` | Category has self-referencing `parent_id`. Product belongs to category. Images/attributes/tags are 1-to-many or many-to-many. |
| Commerce | `cart`, `cart_item`, `purchase_order`, `order_item`, `order_status_history` | Cart per user. Order created from cart (transactional). Status history tracks all transitions with timestamps and optional notes. |
| Recommendations | `user_behavior`, `recommendation` | Behavior events capture shopper actions and feed the hybrid recommendation pipeline. Generated recommendation rows store ranked results and click feedback. |
| Wishlist | `wishlist`, `wishlist_item`, `price_alert` | Wishlist per user. Items track `price_when_added`. Price alerts store `target_price` with `is_triggered` flag. |
| Promotions | `promotion`, `product_promotion` | Promotions have type (percentage/fixed/special_price), value, date range. Linked to products via `product_promotion` with computed `promotional_price`. |

---

## API Reference

Base URL: `http://localhost:5000/api/v1`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | Login, get JWT |
| GET | `/auth/profile` | JWT | Get profile |
| PUT | `/auth/profile` | JWT | Update profile |
| GET | `/products` | — | List products (paginated) |
| GET | `/products/search` | — | Full-text search |
| GET | `/products/:id` | — | Product detail |
| GET | `/products/:id/related` | — | Related products |
| GET | `/categories` | — | Category tree |
| GET | `/tags` | — | All tags |
| GET | `/cart` | JWT | Get cart |
| POST | `/cart/items` | JWT | Add to cart |
| PUT | `/cart/items/:id` | JWT | Update quantity |
| DELETE | `/cart/items/:id` | JWT | Remove item |
| POST | `/orders` | JWT | Create order |
| GET | `/orders` | JWT | List orders |
| GET | `/orders/:id` | JWT | Order detail |
| PUT | `/orders/:id/cancel` | JWT | Cancel order |
| GET | `/wishlist` | JWT | Get wishlist |
| POST | `/wishlist/items` | JWT | Add to wishlist |
| DELETE | `/wishlist/items/:id` | JWT | Remove from wishlist |
| POST | `/wishlist/price-alerts` | JWT | Set price alert |
| GET | `/promotions` | — | Active promotions |
| GET | `/seo/product/:id` | — | SEO metadata |
| GET | `/admin/products` | Admin | Admin product list |
| POST | `/admin/products` | Admin | Create product |
| PUT | `/admin/products/:id` | Admin | Update product |
| POST | `/admin/products/:id/images` | Admin | Upload images |
| GET | `/admin/orders` | Admin | All orders |
| PUT | `/admin/orders/:id/status` | Admin | Change order status |

---

## Default Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@shop.com` | `admin123` |
| Customer | `customer@shop.com` | `customer123` |
