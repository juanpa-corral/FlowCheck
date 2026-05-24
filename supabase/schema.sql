-- ============================================================
-- FlowCheck 2.0 — Schema de Base de Datos
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: profiles
-- Extiende auth.users con datos financieros del estudiante
-- ============================================================
CREATE TABLE profiles (
  id                    UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name             TEXT NOT NULL,
  university            TEXT,
  career                TEXT,
  -- Estrato socioeconómico colombiano (1-6)
  stratum               INTEGER CHECK (stratum BETWEEN 1 AND 6),

  -- Ingresos
  monthly_income        DECIMAL(12,2) NOT NULL DEFAULT 0,
  income_sources        TEXT[],  -- ['beca','trabajo_parcial','apoyo_familiar','freelance','otro']

  -- Egresos mensuales (capturados en onboarding)
  fixed_expenses        DECIMAL(12,2) NOT NULL DEFAULT 0,   -- arriendo, transporte fijo
  variable_expenses     DECIMAL(12,2) NOT NULL DEFAULT 0,   -- comida, servicios variables
  leisure_expenses      DECIMAL(12,2) NOT NULL DEFAULT 0,   -- ocio, entretenimiento

  -- Deuda
  total_debt            DECIMAL(12,2) NOT NULL DEFAULT 0,
  monthly_debt_payment  DECIMAL(12,2) NOT NULL DEFAULT 0,

  -- Fondo de emergencia y metas
  emergency_fund        DECIMAL(12,2) NOT NULL DEFAULT 0,
  savings_goal          DECIMAL(12,2) NOT NULL DEFAULT 0,
  savings_goal_months   INTEGER,

  -- Perfil de riesgo
  risk_profile          TEXT CHECK (risk_profile IN ('conservador','moderado','arriesgado')),

  -- Estado y métricas calculadas
  onboarding_completed  BOOLEAN NOT NULL DEFAULT FALSE,
  isf_score             DECIMAL(5,2),  -- Índice de Salud Financiera 0-100

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: budgets
-- Presupuesto mensual por categoría
-- ============================================================
CREATE TABLE budgets (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category         TEXT NOT NULL,
  -- alimentacion | transporte | ocio | educacion | salud | servicios | otros
  allocated_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  month            INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year             INTEGER NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, category, month, year)
);

-- ============================================================
-- TABLA: transactions
-- Movimientos financieros del usuario
-- ============================================================
CREATE TABLE transactions (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount           DECIMAL(12,2) NOT NULL,
  category         TEXT NOT NULL,
  description      TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type             TEXT NOT NULL CHECK (type IN ('income','expense')),
  -- ¿Fue pre-aprobada por el asesor conductual?
  is_planned       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGER: auto-actualizar updated_at en profiles
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- FUNCIÓN: crear perfil automáticamente al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- --- Profiles ---
CREATE POLICY "profiles: usuario ve solo su fila"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: usuario inserta solo su fila"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: usuario actualiza solo su fila"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- --- Budgets ---
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

-- --- Transactions ---
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
