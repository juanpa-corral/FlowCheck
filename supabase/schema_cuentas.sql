-- ============================================================
-- FlowCheck 2.0 — Fase 5: Gestor de Cuentas / Bolsillos
-- ✅ Idempotente: seguro de ejecutar múltiples veces
-- ============================================================

-- ── Tabla: cuentas y bolsillos ────────────────────────────────
CREATE TABLE IF NOT EXISTS accounts (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'banco'
                  CHECK (type IN ('efectivo', 'banco', 'tarjeta_credito')),
  balance       DECIMAL(15,2) NOT NULL DEFAULT 0,
  credit_limit  DECIMAL(15,2),           -- solo para tarjeta_credito
  icon          TEXT NOT NULL DEFAULT '🏦',
  color         TEXT NOT NULL DEFAULT '#1D9E75',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consultas frecuentes por usuario
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id) WHERE is_active = TRUE;

-- Trigger de actualización de updated_at
CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_accounts_updated_at ON accounts;
CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_accounts_updated_at();

-- ── RLS ───────────────────────────────────────────────────────
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accounts: usuario ve las suyas"     ON accounts;
DROP POLICY IF EXISTS "accounts: usuario crea las suyas"   ON accounts;
DROP POLICY IF EXISTS "accounts: usuario modifica las suyas" ON accounts;
DROP POLICY IF EXISTS "accounts: usuario elimina las suyas" ON accounts;

CREATE POLICY "accounts: usuario ve las suyas"
  ON accounts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "accounts: usuario crea las suyas"
  ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "accounts: usuario modifica las suyas"
  ON accounts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "accounts: usuario elimina las suyas"
  ON accounts FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RPC: complete_challenge — premia un reto semanal (+100 pts)
-- Verifica que no se haya completado el mismo reto esta semana
-- ============================================================
CREATE OR REPLACE FUNCTION complete_challenge(
  p_user_id     UUID,
  p_challenge_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_already_done BOOLEAN;
  v_week_start   DATE;
  v_new_pts      INTEGER;
BEGIN
  -- Inicio de la semana ISO (lunes)
  v_week_start := DATE_TRUNC('week', CURRENT_DATE)::DATE;

  -- Verificar si ya completó este reto esta semana
  SELECT EXISTS(
    SELECT 1 FROM points_transactions
    WHERE user_id   = p_user_id
      AND reason    = 'challenge_complete'
      AND (metadata->>'challenge_id') = p_challenge_id
      AND created_at >= v_week_start
  ) INTO v_already_done;

  IF v_already_done THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ya completaste este reto esta semana');
  END IF;

  -- Otorgar 100 puntos
  INSERT INTO points_transactions (user_id, amount, reason, metadata)
  VALUES (p_user_id, 100, 'challenge_complete',
          jsonb_build_object('challenge_id', p_challenge_id));

  -- Actualizar saldo y nivel en profiles
  UPDATE profiles
  SET
    total_points = GREATEST(0, total_points + 100),
    level = CASE
      WHEN GREATEST(0, total_points + 100) >= 5000 THEN 5
      WHEN GREATEST(0, total_points + 100) >= 2000 THEN 4
      WHEN GREATEST(0, total_points + 100) >= 1000 THEN 3
      WHEN GREATEST(0, total_points + 100) >= 500  THEN 2
      ELSE 1
    END
  WHERE id = p_user_id
  RETURNING total_points INTO v_new_pts;

  RETURN jsonb_build_object('success', true, 'new_total_points', v_new_pts);
END;
$$;

-- ============================================================
-- RPC: transfer_between_accounts — transferencia entre bolsillos
-- ============================================================
CREATE OR REPLACE FUNCTION transfer_between_accounts(
  p_user_id    UUID,
  p_from_id    UUID,
  p_to_id      UUID,
  p_amount     DECIMAL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_from_balance DECIMAL;
BEGIN
  -- Verificar saldo origen
  SELECT balance INTO v_from_balance
  FROM accounts
  WHERE id = p_from_id AND user_id = p_user_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cuenta origen no encontrada');
  END IF;

  IF v_from_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Saldo insuficiente en la cuenta origen');
  END IF;

  -- Descontar origen
  UPDATE accounts SET balance = balance - p_amount WHERE id = p_from_id;
  -- Abonar destino
  UPDATE accounts SET balance = balance + p_amount WHERE id = p_to_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
