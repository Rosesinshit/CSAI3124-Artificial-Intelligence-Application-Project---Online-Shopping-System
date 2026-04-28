-- ============================================
-- Online Shopping System - Database Schema
-- Covers Block A, B, C
-- ============================================

-- Drop tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS product_promotion CASCADE;
DROP TABLE IF EXISTS promotion CASCADE;
DROP TABLE IF EXISTS wishlist_item CASCADE;
DROP TABLE IF EXISTS wishlist CASCADE;
DROP TABLE IF EXISTS price_alert CASCADE;
DROP TABLE IF EXISTS product_embedding CASCADE;
DROP TABLE IF EXISTS recommendation CASCADE;
DROP TABLE IF EXISTS user_behavior CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS order_item CASCADE;
DROP TABLE IF EXISTS purchase_order CASCADE;
DROP TABLE IF EXISTS cart_item CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS product_tag_mapping CASCADE;
DROP TABLE IF EXISTS product_tag CASCADE;
DROP TABLE IF EXISTS product_attribute CASCADE;
DROP TABLE IF EXISTS product_image CASCADE;
DROP TABLE IF EXISTS product CASCADE;
DROP TABLE IF EXISTS category CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- ============================================
-- User Management (Block A1-A2)
-- ============================================
CREATE TABLE "user" (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    shipping_address TEXT,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- Category (Block C3)
-- ============================================
CREATE TABLE category (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id INT REFERENCES category(category_id) ON DELETE SET NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_category_parent ON category(parent_id);
CREATE INDEX idx_category_slug ON category(slug);

-- ============================================
-- Product (Block A3-A6, A14-A18)
-- ============================================
CREATE TABLE product (
    product_id SERIAL PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE NOT NULL,
    short_description TEXT,
    description TEXT,
    price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(12, 2),
    stock_quantity INT DEFAULT 0,
    category_id INT REFERENCES category(category_id) ON DELETE SET NULL,
    meta_title VARCHAR(500),
    meta_description TEXT,
    meta_keywords VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_category ON product(category_id);
CREATE INDEX idx_product_slug ON product(slug);
CREATE INDEX idx_product_active ON product(is_active);
CREATE INDEX idx_product_price ON product(price);
CREATE INDEX idx_product_name_search ON product USING gin(to_tsvector('english', name));
CREATE INDEX idx_product_desc_search ON product USING gin(to_tsvector('english', COALESCE(description, '')));

-- ============================================
-- Product Images (Block B1)
-- ============================================
CREATE TABLE product_image (
    image_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
    image_url VARCHAR(1000) NOT NULL,
    alt_text VARCHAR(500),
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_product_image_product ON product_image(product_id);

-- ============================================
-- Product Tags (Block C3)
-- ============================================
CREATE TABLE product_tag (
    tag_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE product_tag_mapping (
    product_id INT NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
    tag_id INT NOT NULL REFERENCES product_tag(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, tag_id)
);

-- ============================================
-- Product Attributes (Block C1, C5)
-- ============================================
CREATE TABLE product_attribute (
    attribute_id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
    attribute_name VARCHAR(255) NOT NULL,
    attribute_value TEXT NOT NULL,
    is_html BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_product_attribute_product ON product_attribute(product_id);
CREATE INDEX idx_product_attribute_name ON product_attribute(attribute_name);
CREATE INDEX idx_product_attribute_search ON product_attribute USING gin(to_tsvector('english', attribute_value));

-- ============================================
-- Shopping Cart (Block A7-A10)
-- ============================================
CREATE TABLE cart (
    cart_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_cart_user ON cart(user_id);

CREATE TABLE cart_item (
    cart_item_id SERIAL PRIMARY KEY,
    cart_id INT NOT NULL REFERENCES cart(cart_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, product_id)
);

CREATE INDEX idx_cart_item_cart ON cart_item(cart_id);

-- ============================================
-- Order Management (Block A11-A13, B2-B4)
-- ============================================
CREATE TABLE purchase_order (
    order_id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    user_id INT NOT NULL REFERENCES "user"(user_id),
    total_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'HOLD')),
    shipping_address TEXT NOT NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipped_date TIMESTAMP,
    cancelled_date TIMESTAMP,
    completed_date TIMESTAMP,
    notes TEXT
);

CREATE INDEX idx_order_user ON purchase_order(user_id);
CREATE INDEX idx_order_status ON purchase_order(status);
CREATE INDEX idx_order_number ON purchase_order(order_number);
CREATE INDEX idx_order_date ON purchase_order(order_date);

CREATE TABLE order_item (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES purchase_order(order_id) ON DELETE CASCADE,
    product_id INT REFERENCES product(product_id) ON DELETE SET NULL,
    product_name VARCHAR(500) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL
);

CREATE INDEX idx_order_item_order ON order_item(order_id);

-- ============================================
-- Order Status History (Block B2, B4)
-- ============================================
CREATE TABLE order_status_history (
    history_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES purchase_order(order_id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(255),
    notes TEXT
);

CREATE INDEX idx_order_history_order ON order_status_history(order_id);
CREATE INDEX idx_order_history_date ON order_status_history(changed_at);

-- ============================================
-- Wish List (Block U)
-- ============================================
CREATE TABLE wishlist (
    wishlist_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_wishlist_user ON wishlist(user_id);

CREATE TABLE wishlist_item (
    wishlist_item_id SERIAL PRIMARY KEY,
    wishlist_id INT NOT NULL REFERENCES wishlist(wishlist_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
    price_when_added DECIMAL(12, 2) NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified_price_drop BOOLEAN DEFAULT FALSE,
    UNIQUE(wishlist_id, product_id)
);

CREATE INDEX idx_wishlist_item_wishlist ON wishlist_item(wishlist_id);
CREATE INDEX idx_wishlist_item_product ON wishlist_item(product_id);

-- ============================================
-- Promotional Pricing (Block U)
-- ============================================
CREATE TABLE promotion (
    promotion_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('percentage', 'fixed', 'special_price')),
    discount_value DECIMAL(12, 2) NOT NULL,
    min_purchase DECIMAL(12, 2) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_promotion_dates ON promotion(start_date, end_date);
CREATE INDEX idx_promotion_active ON promotion(is_active);

CREATE TABLE product_promotion (
    product_id INT NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
    promotion_id INT NOT NULL REFERENCES promotion(promotion_id) ON DELETE CASCADE,
    promotional_price DECIMAL(12, 2),
    PRIMARY KEY (product_id, promotion_id)
);

-- ============================================
-- User Behavior Tracking (Block S)
-- ============================================
CREATE TABLE user_behavior (
    behavior_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    product_id INT REFERENCES product(product_id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('VIEW', 'ADD_TO_CART', 'PURCHASE', 'WISHLIST_ADD', 'SEARCH', 'CLICK_RECOMMENDATION')),
    action_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_user_behavior_user ON user_behavior(user_id);
CREATE INDEX idx_user_behavior_product ON user_behavior(product_id);
CREATE INDEX idx_user_behavior_action ON user_behavior(action_type);
CREATE INDEX idx_user_behavior_time ON user_behavior(action_time DESC);

-- ============================================
-- Generated Recommendations (Block S)
-- ============================================
CREATE TABLE recommendation (
    recommendation_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
    score DECIMAL(10, 4) NOT NULL,
    algorithm_type VARCHAR(50) NOT NULL CHECK (algorithm_type IN ('hybrid', 'collaborative', 'content', 'popularity', 'similarity', 'semantic_ai')),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_clicked BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_recommendation_user ON recommendation(user_id);
CREATE INDEX idx_recommendation_product ON recommendation(product_id);
CREATE INDEX idx_recommendation_generated_at ON recommendation(generated_at DESC);

-- ============================================
-- Product Semantic Embeddings (Block S AI)
-- ============================================
CREATE TABLE product_embedding (
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

CREATE INDEX idx_product_embedding_model ON product_embedding(embedding_model);
CREATE INDEX idx_product_embedding_updated_at ON product_embedding(updated_at DESC);

-- ============================================
-- Price Drop Notifications (Block U)
-- ============================================
CREATE TABLE price_alert (
    alert_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
    target_price DECIMAL(12, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP,
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_price_alert_user ON price_alert(user_id);
CREATE INDEX idx_price_alert_product ON price_alert(product_id);
CREATE INDEX idx_price_alert_active ON price_alert(is_active);

-- ============================================
-- Trigger: Update 'updated_at' on product change
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_updated_at
    BEFORE UPDATE ON product
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON "user"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_updated_at
    BEFORE UPDATE ON cart
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
