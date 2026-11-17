-- =============================================
-- MIGRATION: Mercado Pago monitoring + reconciliation
--
-- - mp_notifications: log of every webhook received and every
--   reconciliation run, shown in the admin "Mercado Pago" tab.
-- - mp_record_charge(): an MP charge that arrives after the admin already
--   confirmed the payment by hand is linked to that manual confirmation
--   instead of becoming an extra renewal.
--
-- Run after migration_mercadopago.sql.
-- =============================================

CREATE TABLE IF NOT EXISTS mp_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'webhook',   -- 'webhook' | 'sync'
  type TEXT,
  data_id TEXT,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL,                      -- 'ok' | 'ignored' | 'error' | 'invalid_signature'
  result TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mp_notifications_created ON mp_notifications(created_at DESC);
ALTER TABLE mp_notifications ENABLE ROW LEVEL SECURITY; -- service role only

CREATE OR REPLACE FUNCTION mp_record_charge(p_profile_id UUID, p_mp_payment_id TEXT, p_amount NUMERIC)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_m memberships%ROWTYPE;
  v_pay payments%ROWTYPE;
  v_manual UUID;
  v_renewal UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM payments WHERE mp_payment_id = p_mp_payment_id) THEN
    RETURN 'duplicate';
  END IF;

  SELECT * INTO v_m FROM memberships WHERE profile_id = p_profile_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Plano não encontrado'; END IF;

  IF v_m.status = 'awaiting_payment' THEN
    SELECT * INTO v_pay FROM payments
      WHERE profile_id = p_profile_id AND kind = 'registration' AND status = 'pending'
      ORDER BY created_at DESC LIMIT 1;
    IF NOT FOUND THEN RAISE EXCEPTION 'Cobrança do cadastro não encontrada'; END IF;

    IF p_amount < v_pay.amount - 0.01 THEN
      INSERT INTO membership_events (profile_id, event, description, amount, actor)
      VALUES (p_profile_id, 'mp_amount_mismatch',
              'Mercado Pago cobrou valor menor que o do plano (pagamento MP ' || p_mp_payment_id || ')', p_amount, 'Mercado Pago');
      RETURN 'mismatch';
    END IF;

    UPDATE payments SET mp_payment_id = p_mp_payment_id, method = 'mercadopago', amount = p_amount
      WHERE id = v_pay.id;
    PERFORM admin_confirm_payment(v_pay.id, 'Mercado Pago');
    RETURN 'registration';
  END IF;

  -- Admin confirmed by hand in the last 60 days and this charge is that same
  -- payment arriving late: link it instead of renewing again.
  SELECT id INTO v_manual FROM payments
    WHERE profile_id = p_profile_id AND status = 'paid' AND mp_payment_id IS NULL
      AND paid_at > now() - INTERVAL '60 days'
    ORDER BY paid_at DESC LIMIT 1;
  IF v_manual IS NOT NULL THEN
    UPDATE payments SET mp_payment_id = p_mp_payment_id, method = 'mercadopago' WHERE id = v_manual;
    INSERT INTO membership_events (profile_id, event, description, amount, actor)
    VALUES (p_profile_id, 'mp_linked_manual',
            'Cobrança do Mercado Pago vinculada ao pagamento já confirmado manualmente (MP ' || p_mp_payment_id || ')', p_amount, 'Mercado Pago');
    RETURN 'linked';
  END IF;

  -- Renewal
  IF p_amount < v_m.next_renewal_price - 0.01 THEN
    INSERT INTO membership_events (profile_id, event, description, amount, actor)
    VALUES (p_profile_id, 'mp_amount_mismatch',
            'Mercado Pago cobrou valor menor que o da renovação (pagamento MP ' || p_mp_payment_id || ')', p_amount, 'Mercado Pago');
    RETURN 'mismatch';
  END IF;

  IF p_amount > v_m.next_renewal_price + 0.01 THEN
    UPDATE memberships SET next_renewal_price = p_amount WHERE profile_id = p_profile_id;
  END IF;

  PERFORM admin_confirm_renewal(p_profile_id, 'Mercado Pago');

  SELECT id INTO v_renewal FROM payments
    WHERE profile_id = p_profile_id AND kind = 'renewal' AND mp_payment_id IS NULL
    ORDER BY created_at DESC LIMIT 1;
  UPDATE payments SET mp_payment_id = p_mp_payment_id, method = 'mercadopago', amount = p_amount
    WHERE id = v_renewal;
  RETURN 'renewal';
END;
$$;

REVOKE EXECUTE ON FUNCTION mp_record_charge(UUID, TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION mp_record_charge(UUID, TEXT, NUMERIC) TO service_role;
