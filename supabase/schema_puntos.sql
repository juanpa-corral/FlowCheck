-- ============================================================
-- FlowCheck 2.0 — Módulos 3 y 8: Puntos y Marketplace
-- ✅ Idempotente: seguro de ejecutar múltiples veces
-- ============================================================

-- ── Columnas nuevas en profiles ──────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_points INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level        INTEGER NOT NULL DEFAULT 1;

-- ── Tabla: historial de puntos ────────────────────────────────
CREATE TABLE IF NOT EXISTS points_transactions (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount     INTEGER NOT NULL,          -- positivo = ganado, negativo = gastado
  reason     TEXT    NOT NULL,          -- daily_register | pre_registro | nudge_pause | leisure_penalty | redemption
  metadata   JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabla: catálogo de recompensas ────────────────────────────
CREATE TABLE IF NOT EXISTS rewards (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT    NOT NULL,
  description TEXT,
  category    TEXT    NOT NULL,         -- recargas | comida | transporte
  points_cost INTEGER NOT NULL,
  cop_value   INTEGER NOT NULL,         -- valor en COP
  icon        TEXT    NOT NULL DEFAULT '🎁',
  available   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tabla: canjes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS redemptions (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reward_id   UUID REFERENCES rewards(id) NOT NULL,
  points_used INTEGER NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards              ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions          ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pts: usuario ve sus puntos"       ON points_transactions;
DROP POLICY IF EXISTS "pts: usuario inserta sus puntos"  ON points_transactions;
CREATE POLICY "pts: usuario ve sus puntos"
  ON points_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pts: usuario inserta sus puntos"
  ON points_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "rewards: todos pueden ver"  ON rewards;
CREATE POLICY "rewards: todos pueden ver"
  ON rewards FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "redemptions: usuario ve los suyos"     ON redemptions;
DROP POLICY IF EXISTS "redemptions: usuario inserta los suyos" ON redemptions;
CREATE POLICY "redemptions: usuario ve los suyos"
  ON redemptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "redemptions: usuario inserta los suyos"
  ON redemptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- RPC 1: register_transaction — inserta transacción + puntos ATÓMICAMENTE
-- ============================================================
CREATE OR REPLACE FUNCTION register_transaction(
  p_user_id        UUID,
  p_amount         DECIMAL,
  p_category       TEXT,
  p_description    TEXT,
  p_date           DATE,
  p_type           TEXT,
  p_nudge_used     BOOLEAN DEFAULT FALSE,
  p_nudge_paused   BOOLEAN DEFAULT FALSE
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tx_id          UUID;
  v_pts_earned     INTEGER := 0;
  v_penalty        BOOLEAN := FALSE;
  v_new_pts        INTEGER;
  v_already_daily  BOOLEAN := FALSE;
  v_profile        profiles%ROWTYPE;
BEGIN
  -- 1. Leer perfil para penalización de ocio
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;

  -- 2. Insertar transacción
  INSERT INTO transactions (user_id, amount, category, description, transaction_date, type, is_planned)
  VALUES (p_user_id, p_amount, p_category, p_description, p_date, p_type, p_nudge_used)
  RETURNING id INTO v_tx_id;

  -- 3. Puntos diarios (+5, solo 1 vez por día y solo para gastos)
  IF p_type = 'expense' THEN
    SELECT EXISTS(
      SELECT 1 FROM points_transactions
      WHERE user_id = p_user_id
        AND reason  = 'daily_register'
        AND created_at >= CURRENT_DATE
    ) INTO v_already_daily;

    IF NOT v_already_daily THEN
      v_pts_earned := v_pts_earned + 5;
      INSERT INTO points_transactions (user_id, amount, reason)
      VALUES (p_user_id, 5, 'daily_register');
    END IF;
  END IF;

  -- 4. Pre-registro (+10): usó el nudge
  IF p_nudge_used THEN
    v_pts_earned := v_pts_earned + 10;
    INSERT INTO points_transactions (user_id, amount, reason)
    VALUES (p_user_id, 10, 'pre_registro');
  END IF;

  -- 5. Pausa reflexiva (+25): pausó tras el nudge
  IF p_nudge_paused THEN
    v_pts_earned := v_pts_earned + 25;
    INSERT INTO points_transactions (user_id, amount, reason)
    VALUES (p_user_id, 25, 'nudge_pause');
  END IF;

  -- 6. Penalización de ocio (-15):
  --    categoría=ocio + ocio > 30% ingresos + fondo de emergencia < 1 mes gastos
  IF p_type = 'expense' AND p_category = 'ocio' THEN
    IF v_profile.monthly_income > 0
       AND (v_profile.leisure_expenses / v_profile.monthly_income) > 0.30
       AND v_profile.emergency_fund < (v_profile.fixed_expenses + v_profile.variable_expenses)
    THEN
      v_pts_earned := v_pts_earned - 15;
      v_penalty    := TRUE;
      INSERT INTO points_transactions (user_id, amount, reason)
      VALUES (p_user_id, -15, 'leisure_penalty');
    END IF;
  END IF;

  -- 7. Actualizar total de puntos en profiles (nunca menor a 0)
  UPDATE profiles
  SET total_points = GREATEST(0, total_points + v_pts_earned),
      level = CASE
        WHEN GREATEST(0, total_points + v_pts_earned) >= 5000 THEN 5
        WHEN GREATEST(0, total_points + v_pts_earned) >= 2000 THEN 4
        WHEN GREATEST(0, total_points + v_pts_earned) >= 1000 THEN 3
        WHEN GREATEST(0, total_points + v_pts_earned) >= 500  THEN 2
        ELSE 1
      END
  WHERE id = p_user_id
  RETURNING total_points INTO v_new_pts;

  RETURN jsonb_build_object(
    'transaction_id',     v_tx_id,
    'points_earned',      v_pts_earned,
    'new_total_points',   v_new_pts,
    'leisure_penalty',    v_penalty
  );
END;
$$;

-- ============================================================
-- RPC 2: redeem_reward — canje atómico en el marketplace
-- ============================================================
CREATE OR REPLACE FUNCTION redeem_reward(
  p_user_id   UUID,
  p_reward_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_reward      rewards%ROWTYPE;
  v_cur_pts     INTEGER;
  v_new_pts     INTEGER;
BEGIN
  -- 1. Verificar recompensa disponible
  SELECT * INTO v_reward FROM rewards WHERE id = p_reward_id AND available = TRUE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recompensa no disponible');
  END IF;

  -- 2. Verificar saldo de puntos
  SELECT total_points INTO v_cur_pts FROM profiles WHERE id = p_user_id;
  IF v_cur_pts < v_reward.points_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Puntos insuficientes');
  END IF;

  -- 3. Registrar canje
  INSERT INTO redemptions (user_id, reward_id, points_used)
  VALUES (p_user_id, p_reward_id, v_reward.points_cost);

  -- 4. Descontar puntos
  UPDATE profiles
  SET total_points = total_points - v_reward.points_cost,
      level = CASE
        WHEN total_points - v_reward.points_cost >= 5000 THEN 5
        WHEN total_points - v_reward.points_cost >= 2000 THEN 4
        WHEN total_points - v_reward.points_cost >= 1000 THEN 3
        WHEN total_points - v_reward.points_cost >= 500  THEN 2
        ELSE 1
      END
  WHERE id = p_user_id
  RETURNING total_points INTO v_new_pts;

  -- 5. Registrar en historial
  INSERT INTO points_transactions (user_id, amount, reason, metadata)
  VALUES (p_user_id, -v_reward.points_cost, 'redemption',
          jsonb_build_object('reward_id', p_reward_id, 'reward_name', v_reward.name));

  RETURN jsonb_build_object(
    'success',          true,
    'reward_name',      v_reward.name,
    'points_used',      v_reward.points_cost,
    'new_total_points', v_new_pts
  );
END;
$$;

-- ============================================================
-- CATÁLOGO INICIAL DE RECOMPENSAS (seed)
-- ============================================================
INSERT INTO rewards (name, description, category, points_cost, cop_value, icon) VALUES
  -- Recargas
  ('100 min Claro',        'Minutos a cualquier operador',        'recargas',   500,  3000,  '📱'),
  ('Plan datos 1 GB',      'Datos para 1 semana',                 'recargas',   800,  5000,  '📶'),
  ('Plan datos 3 GB',      'Datos para 1 mes (uso moderado)',     'recargas',  1500, 10000,  '🚀'),
  -- Comida
  ('Descuento $5k Rappi',  'Código para tu próximo pedido',       'comida',    1000,  5000,  '🍔'),
  ('Descuento $10k Rappi', 'Para pedidos mayores a $25.000',      'comida',    1800, 10000,  '🍕'),
  ('Almuerzo universitario','Redimible en restaurantes aliados',  'comida',     600,  4000,  '🥗'),
  -- Transporte
  ('Recarga TM $5.000',    'Para tu tarjeta TransMilenio / SITP', 'transporte',1000,  5000,  '🚌'),
  ('Recarga TM $10.000',   'Para tu tarjeta TransMilenio / SITP', 'transporte',1900, 10000,  '🚇'),
  ('Bici pública 1 mes',   'Suscripción mensual EnCicla',         'transporte', 800,  5000,  '🚲')
ON CONFLICT DO NOTHING;
