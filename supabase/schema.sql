-- ============================================================
-- FlowCheck 2.0 — Schema de Base de Datos
-- ✅ Idempotente: seguro de ejecutar múltiples veces
-- ============================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLAS (IF NOT EXISTS → no falla si ya existen)
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
  id                    UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name             TEXT NOT NULL DEFAULT '',
  university            TEXT,
  career                TEXT,
  stratum               INTEGER CHECK (stratum BETWEEN 1 AND 6),
  monthly_income        DECIMAL(12,2) NOT NULL DEFAULT 0,
  income_sources        TEXT[],
  fixed_expenses        DECIMAL(12,2) NOT NULL DEFAULT 0,
  variable_expenses     DECIMAL(12,2) NOT NULL DEFAULT 0,
  leisure_expenses      DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_debt            DECIMAL(12,2) NOT NULL DEFAULT 0,
  monthly_debt_payment  DECIMAL(12,2) NOT NULL DEFAULT 0,
  emergency_fund        DECIMAL(12,2) NOT NULL DEFAULT 0,
  savings_goal          DECIMAL(12,2) NOT NULL DEFAULT 0,
  savings_goal_months   INTEGER,
  risk_profile          TEXT CHECK (risk_profile IN ('conservador','moderado','arriesgado')),
  onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  isf_score             DECIMAL(5,2),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budgets (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category         TEXT NOT NULL,
  allocated_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  month            INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year             INTEGER NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category, month, year)
);

CREATE TABLE IF NOT EXISTS transactions (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount           DECIMAL(12,2) NOT NULL,
  category         TEXT NOT NULL,
  description      TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type             TEXT NOT NULL CHECK (type IN ('income','expense')),
  is_planned       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCIONES (CREATE OR REPLACE → siempre actualiza)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;  -- evita error si el perfil ya existe
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGERS (DROP IF EXISTS → siempre recrea limpio)
-- ============================================================

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- ── Policies de profiles ────────────────────────────────────

DROP POLICY IF EXISTS "profiles: usuario ve solo su fila"      ON profiles;
DROP POLICY IF EXISTS "profiles: usuario inserta solo su fila" ON profiles;
DROP POLICY IF EXISTS "profiles: usuario actualiza solo su fila" ON profiles;

CREATE POLICY "profiles: usuario ve solo su fila"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: usuario inserta solo su fila"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: usuario actualiza solo su fila"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ── Policies de budgets ─────────────────────────────────────

DROP POLICY IF EXISTS "budgets: usuario ve sus presupuestos"      ON budgets;
DROP POLICY IF EXISTS "budgets: usuario inserta sus presupuestos" ON budgets;
DROP POLICY IF EXISTS "budgets: usuario actualiza sus presupuestos" ON budgets;
DROP POLICY IF EXISTS "budgets: usuario elimina sus presupuestos"  ON budgets;

CREATE POLICY "budgets: usuario ve sus presupuestos"
  ON budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "budgets: usuario inserta sus presupuestos"
  ON budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets: usuario actualiza sus presupuestos"
  ON budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "budgets: usuario elimina sus presupuestos"
  ON budgets FOR DELETE
  USING (auth.uid() = user_id);

-- ── Policies de transactions ────────────────────────────────

DROP POLICY IF EXISTS "transactions: usuario ve sus movimientos"      ON transactions;
DROP POLICY IF EXISTS "transactions: usuario inserta sus movimientos" ON transactions;
DROP POLICY IF EXISTS "transactions: usuario actualiza sus movimientos" ON transactions;
DROP POLICY IF EXISTS "transactions: usuario elimina sus movimientos"  ON transactions;

CREATE POLICY "transactions: usuario ve sus movimientos"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "transactions: usuario inserta sus movimientos"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions: usuario actualiza sus movimientos"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "transactions: usuario elimina sus movimientos"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- ✅ Schema aplicado correctamente
-- ============================================================
