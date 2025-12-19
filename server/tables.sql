-- =====================
-- RESET
-- =====================
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

-- =====================
-- ENUMS
-- =====================
CREATE TYPE user_role AS ENUM ('admin', 'user', 'client');
CREATE TYPE order_status AS ENUM ('pending', 'completed', 'cancelled');

-- =====================
-- USERS
-- =====================
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT,
    full_name VARCHAR(255),

    role user_role NOT NULL,

    level INT,
    approved BOOLEAN DEFAULT FALSE,
    loyalty_points INT DEFAULT 0,

    refresh_token TEXT,
    invite_token TEXT,

    created_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT admin_level_check CHECK (
        role != 'admin' OR level IS NOT NULL
    ),
    CONSTRAINT user_approved_check CHECK (
        role != 'user' OR approved IS NOT NULL
    ),
    CONSTRAINT client_loyalty_check CHECK (
        role != 'client' OR loyalty_points IS NOT NULL
    )
);

-- =====================
-- PRODUCTS
-- =====================
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- stock -> is_active trigger
CREATE OR REPLACE FUNCTION update_is_active()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock = 0 THEN
    NEW.is_active := false;
  ELSE
    NEW.is_active := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_products_stock
BEFORE UPDATE ON products
FOR EACH ROW
WHEN (OLD.stock IS DISTINCT FROM NEW.stock)
EXECUTE FUNCTION update_is_active();

-- =====================
-- ORDERS
-- =====================
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,

    client_id BIGINT NOT NULL REFERENCES users(id),
    seller_id BIGINT REFERENCES users(id),

    total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    status order_status DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================
-- ORDER ITEMS
-- =====================
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,

    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES products(id),

    quantity INT NOT NULL CHECK (quantity > 0),
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),

    UNIQUE (order_id, product_id)
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
