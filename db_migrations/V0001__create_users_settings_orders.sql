
-- Users table
CREATE TABLE IF NOT EXISTS t_p64806423_ppu_spraying_pwa.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'foreman')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS t_p64806423_ppu_spraying_pwa.settings (
  id INT PRIMARY KEY DEFAULT 1,
  rate_pena NUMERIC NOT NULL DEFAULT 70,
  rate_polimochevina NUMERIC NOT NULL DEFAULT 100,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO t_p64806423_ppu_spraying_pwa.settings (id, rate_pena, rate_polimochevina)
VALUES (1, 70, 100)
ON CONFLICT (id) DO NOTHING;

-- Orders table
CREATE TABLE IF NOT EXISTS t_p64806423_ppu_spraying_pwa.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  planned_volume_m2 NUMERIC NOT NULL,
  actual_volume_m2 NUMERIC,
  material TEXT NOT NULL CHECK (material IN ('pena', 'polimochevina')),
  price_per_m2 NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  crew_rate NUMERIC NOT NULL,
  crew_salary NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL DEFAULT ''
);
