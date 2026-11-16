-- =============================================
-- MIGRATION: Mercado Pago subscriptions (annual, credit card)
--
-- - Plans are paid through a Mercado Pago subscription (preapproval) that
--   charges the card once a year. The first charge pays the registration,
--   the next ones are renewals.
-- - Accounts awaiting payment keep access for 7 days after sign-up
--   (grace_until); expired plans keep access for 7 days after period_end.
--   The block itself is enforced by the app (middleware).
-- - Charges are recorded by mp_record_charge(), called by the webhook with
--   the service role. The admin can still confirm payments by hand.
--
-- Run after migration_plans_referrals.sql.
-- =============================================

ALTER TABLE memberships ADD COLUMN IF NOT EXISTS grace_until TIMESTAMPTZ;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS mp_preapproval_id TEXT;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS mp_subscription_status TEXT;
CREATE INDEX IF NOT EXISTS idx_memberships_mp_preapproval ON memberships(mp_preapproval_id);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS method TEXT; -- 'mercadopago' | NULL (manual)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_mp_payment ON payments(mp_payment_id) WHERE mp_payment_id IS NOT NULL;

-- 7-day grace for new accounts awaiting payment
CREATE OR REPLACE FUNCTION memberships_set_grace() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'awaiting_payment' AND NEW.grace_until IS NULL THEN
    NEW.grace_until := now() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_memberships_set_grace ON memberships;
CREATE TRIGGER trg_memberships_set_grace BEFORE INSERT ON memberships
  FOR EACH ROW EXECUTE FUNCTION memberships_set_grace();

-- Existing accounts awaiting payment: 7 days from now
UPDATE memberships SET grace_until = now() + INTERVAL '7 days'
  WHERE status = 'awaiting_payment' AND grace_until IS NULL;

-- ---------------------------------------------
-- Records an approved Mercado Pago charge (idempotent by mp_payment_id).
-- Returns 'duplicate' | 'registration' | 'renewal' | 'mismatch'.
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION mp_record_charge(p_profile_id UUID, p_mp_payment_id TEXT, p_amount NUMERIC)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_m memberships%ROWTYPE;
  v_pay payments%ROWTYPE;
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

  -- Renewal
  IF p_amount < v_m.next_renewal_price - 0.01 THEN
    INSERT INTO membership_events (profile_id, event, description, amount, actor)
    VALUES (p_profile_id, 'mp_amount_mismatch',
            'Mercado Pago cobrou valor menor que o da renovação (pagamento MP ' || p_mp_payment_id || ')', p_amount, 'Mercado Pago');
    RETURN 'mismatch';
  END IF;

  -- Charged full price although a referral discount was pending: keep the
  -- discount for the next renewal instead of consuming it.
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
