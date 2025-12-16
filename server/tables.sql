-- Users table (όλοι οι ρόλοι)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT,                   -- Αρχικά μπορεί να είναι NULL για invited users
    full_name VARCHAR(255),
    role VARCHAR(20) NOT NULL,           -- 'admin', 'user', 'client'
    level INT,                            -- Ισχύει μόνο για admin
    approved BOOLEAN DEFAULT FALSE,       -- Ισχύει μόνο για role = 'user'
    loyalty_points INT DEFAULT 0,         -- Ισχύει μόνο για role = 'client'
    created_at TIMESTAMP DEFAULT NOW(),
    refresh_token TEXT,                   -- Για login sessions
    invite_token TEXT                     -- Για πρόσκληση/registration link
);



-- Products table
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



-- Orders table
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    client_id BIGINT REFERENCES users(id),
    total NUMERIC(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT status_check CHECK (status IN ('pending','completed','cancelled'))
);

-- Order Items table
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id),
    quantity INT NOT NULL,
    price NUMERIC(10,2) NOT NULL
);

--check is_active value

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
