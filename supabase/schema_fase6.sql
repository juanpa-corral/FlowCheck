-- ============================================================
-- FlowCheck 2.0 — Fase 6: Realtime, Analítica y Gamificación
-- ✅ Idempotente: seguro de ejecutar múltiples veces
-- ============================================================

-- ── 1. Nueva columna en profiles ─────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ;

-- ── 2. Habilitar Realtime para las tablas clave ───────────────
-- Ejecutar una sola vez; si ya está habilitado, no falla.
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;

-- ============================================================
-- RPC: register_transaction (v2) — idéntica a v1 + last_activity_at
-- CREATE OR REPLACE actualiza la existente sin borrar permisos
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
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;

  INSERT INTO transactions (user_id, amount, category, description, transaction_date, type, is_planned)
  VALUES (p_user_id, p_amount, p_category, p_description, p_date, p_type, p_nudge_used)
  RETURNING id INTO v_tx_id;

  -- Puntos diarios (+5, solo 1 vez por día, solo gastos)
  IF p_type = 'expense' THEN
    SELECT EXISTS(
      SELECT 1 FROM points_transactions
      WHERE user_id = p_user_id AND reason = 'daily_register' AND created_at >= CURRENT_DATE
    ) INTO v_already_daily;

    IF NOT v_already_daily THEN
      v_pts_earned := v_pts_earned + 5;
      INSERT INTO points_transactions (user_id, amount, reason) VALUES (p_user_id, 5, 'daily_register');
    END IF;
  END IF;

  IF p_nudge_used THEN
    v_pts_earned := v_pts_earned + 10;
    INSERT INTO points_transactions (user_id, amount, reason) VALUES (p_user_id, 10, 'pre_registro');
  END IF;

  IF p_nudge_paused THEN
    v_pts_earned := v_pts_earned + 25;
    INSERT INTO points_transactions (user_id, amount, reason) VALUES (p_user_id, 25, 'nudge_pause');
  END IF;

  -- Penalización de ocio (-15): ocio > 30% ingresos y sin fondo emergencia
  IF p_type = 'expense' AND p_category = 'ocio' THEN
    IF v_profile.monthly_income > 0
       AND (v_profile.leisure_expenses / v_profile.monthly_income) > 0.30
       AND v_profile.emergency_fund < (v_profile.fixed_expenses + v_profile.variable_expenses)
    THEN
      v_pts_earned := v_pts_earned - 15;
      v_penalty    := TRUE;
      INSERT INTO points_transactions (user_id, amount, reason) VALUES (p_user_id, -15, 'leisure_penalty');
    END IF;
  END IF;

  -- Actualizar puntos (nunca negativo) + nivel + last_activity_at
  UPDATE profiles
  SET total_points     = GREATEST(0, total_points + v_pts_earned),
      last_activity_at = NOW(),
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
-- RPC: check_and_apply_penalties
-- Evalúa "Fugas de Puntos" al abrir la app.
-- Reglas:
--   1. Racha rota: sin actividad >48 h → -30 pts (1 vez por evento)
--   2. Riesgo activo: ocio >25% ingresos Y fondo_emergencia=0 → -15 pts/día
-- El saldo NUNCA puede ser negativo.
-- ============================================================
CREATE OR REPLACE FUNCTION check_and_apply_penalties(
  p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_profile               profiles%ROWTYPE;
  v_streak_penalty        BOOLEAN := FALSE;
  v_risk_penalty          BOOLEAN := FALSE;
  v_total_deduction       INTEGER := 0;
  v_new_pts               INTEGER;
  v_streak_penalized      BOOLEAN;
  v_risk_penalized_today  BOOLEAN;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Perfil no encontrado');
  END IF;

  -- ── Regla 1: Racha rota ──────────────────────────────────────
  -- Aplica si: last_activity_at < hace 48h
  --            Y no se penalizó por esta misma racha (ninguna entrada streak_break
  --              en las últimas 48 h + 1 h de margen = 49 h)
  SELECT EXISTS(
    SELECT 1 FROM points_transactions
    WHERE user_id = p_user_id
      AND reason   = 'streak_break'
      AND created_at >= NOW() - INTERVAL '49 hours'
  ) INTO v_streak_penalized;

  IF NOT v_streak_penalized
     AND (v_profile.last_activity_at IS NULL
          OR v_profile.last_activity_at < NOW() - INTERVAL '48 hours')
  THEN
    v_total_deduction := v_total_deduction + 30;
    v_streak_penalty  := TRUE;
    INSERT INTO points_transactions (user_id, amount, reason)
    VALUES (p_user_id, -30, 'streak_break');
  END IF;

  -- ── Regla 2: Riesgo activo ───────────────────────────────────
  -- Aplica si: ocio > 25% ingresos Y fondo_emergencia = 0
  --            Y no se penalizó hoy
  SELECT EXISTS(
    SELECT 1 FROM points_transactions
    WHERE user_id = p_user_id
      AND reason   = 'risk_penalty'
      AND created_at >= CURRENT_DATE
  ) INTO v_risk_penalized_today;

  IF NOT v_risk_penalized_today
     AND v_profile.monthly_income > 0
     AND (v_profile.leisure_expenses::DECIMAL / v_profile.monthly_income) > 0.25
     AND v_profile.emergency_fund = 0
  THEN
    v_total_deduction := v_total_deduction + 15;
    v_risk_penalty    := TRUE;
    INSERT INTO points_transactions (user_id, amount, reason)
    VALUES (p_user_id, -15, 'risk_penalty');
  END IF;

  -- ── Aplicar deducción total si la hay ────────────────────────
  IF v_total_deduction > 0 THEN
    UPDATE profiles
    SET total_points = GREATEST(0, total_points - v_total_deduction),
        level = CASE
          WHEN GREATEST(0, total_points - v_total_deduction) >= 5000 THEN 5
          WHEN GREATEST(0, total_points - v_total_deduction) >= 2000 THEN 4
          WHEN GREATEST(0, total_points - v_total_deduction) >= 1000 THEN 3
          WHEN GREATEST(0, total_points - v_total_deduction) >= 500  THEN 2
          ELSE 1
        END
    WHERE id = p_user_id
    RETURNING total_points INTO v_new_pts;
  ELSE
    v_new_pts := v_profile.total_points;
  END IF;

  RETURN jsonb_build_object(
    'streak_penalty',    v_streak_penalty,
    'risk_penalty',      v_risk_penalty,
    'total_deduction',   v_total_deduction,
    'new_total_points',  v_new_pts
  );
END;
$$;

-- ============================================================
-- RPC: get_monthly_comparison
-- Un solo escaneo de tabla con agregación condicional:
--   current_month = mes en curso
--   prev_month    = mes anterior
-- Cubre exactamente el rango [inicio_mes_ant, fin_mes_actual]
-- para que el índice en transaction_date sea efectivo.
-- ============================================================
CREATE OR REPLACE FUNCTION get_monthly_comparison(
  p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_cur_start  DATE := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_prev_start DATE := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')::DATE;
  v_cur_end    DATE := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::DATE;

  v_expenses   JSONB;
  v_income     JSONB;
BEGIN
  -- ── Gastos por categoría (ambos meses en una pasada) ─────────
  SELECT jsonb_agg(
    jsonb_build_object(
      'category',     category,
      'current_month', current_month,
      'prev_month',    prev_month
    ) ORDER BY current_month DESC
  )
  INTO v_expenses
  FROM (
    SELECT
      category,
      SUM(CASE WHEN transaction_date >= v_cur_start  AND transaction_date < v_cur_end
               THEN amount ELSE 0 END)::INTEGER AS current_month,
      SUM(CASE WHEN transaction_date >= v_prev_start AND transaction_date < v_cur_start
               THEN amount ELSE 0 END)::INTEGER AS prev_month
    FROM transactions
    WHERE user_id = p_user_id
      AND type    = 'expense'
      AND transaction_date >= v_prev_start
      AND transaction_date <  v_cur_end
    GROUP BY category
  ) sub;

  -- ── Ingresos totales (ambos meses) ───────────────────────────
  SELECT jsonb_build_object(
    'income_current', SUM(CASE WHEN transaction_date >= v_cur_start  AND transaction_date < v_cur_end
                               THEN amount ELSE 0 END)::INTEGER,
    'income_prev',    SUM(CASE WHEN transaction_date >= v_prev_start AND transaction_date < v_cur_start
                               THEN amount ELSE 0 END)::INTEGER
  )
  INTO v_income
  FROM transactions
  WHERE user_id = p_user_id
    AND type    = 'income'
    AND transaction_date >= v_prev_start
    AND transaction_date <  v_cur_end;

  RETURN jsonb_build_object(
    'expenses',    COALESCE(v_expenses, '[]'::JSONB),
    'income',      COALESCE(v_income, '{"income_current":0,"income_prev":0}'::JSONB),
    'cur_month',   TO_CHAR(v_cur_start,  'Month YYYY'),
    'prev_month',  TO_CHAR(v_prev_start, 'Month YYYY')
  );
END;
$$;

-- ============================================================
-- ✅ Fase 6 aplicada correctamente
-- ============================================================
