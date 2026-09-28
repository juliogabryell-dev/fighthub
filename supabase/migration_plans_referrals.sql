-- =============================================
-- MIGRATION: Plans, payments and referral codes
--
-- Plans
--   lutador  (fighter, coach, referee, match_maker): R$ 129,99/ano
--   entidade (academy, team, federation):           R$ 499,00/ano, 1st year free (bonus)
--
-- Referral codes
--   Every profile gets a unique 6-char code. A new account may type a code at
--   sign-up; the referrer is rewarded ONCE, when the referred account's first
--   payment (registration) is confirmed. Renewals never generate rewards.
--     - referrer is a fighter -> next renewal costs R$ 114,99 (no cash)
--     - anyone else           -> cash reward; the admin records when it was paid
--                                and how much (amount varies, not fixed here)
--
-- All payment/reward state is written only by admin functions (service role).
-- =============================================

-- ---------------------------------------------
-- 1. Referral columns on profiles
-- ---------------------------------------------
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code_used TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- Unambiguous alphabet (no 0/O, 1/I/L)
CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS TEXT
LANGUAGE plpgsql AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code TEXT;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM profiles WHERE referral_code = code);
  END LOOP;
  RETURN code;
END;
$$;

UPDATE profiles SET referral_code = generate_referral_code() WHERE referral_code IS NULL;

-- ---------------------------------------------
-- 2. Tables
-- ---------------------------------------------
CREATE TABLE IF NOT EXISTS memberships (
  profile_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('lutador', 'entidade')),
  status TEXT NOT NULL CHECK (status IN ('awaiting_payment', 'active')),
  is_bonus BOOLEAN NOT NULL DEFAULT FALSE,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  next_renewal_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('registration', 'renewal')),
  plan TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  confirmed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_profile ON payments(profile_id, created_at DESC);

CREATE TABLE IF NOT EXISTS referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('cash', 'renewal_discount')),
  -- cash: pending -> paid ; renewal_discount: granted -> used
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'granted', 'used')),
  paid_amount NUMERIC(10,2),
  paid_at TIMESTAMPTZ,
  paid_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id, status);

CREATE TABLE IF NOT EXISTS membership_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(10,2),
  actor TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_membership_events_profile ON membership_events(profile_id, created_at DESC);

DROP TRIGGER IF EXISTS set_memberships_updated_at ON memberships;
CREATE TRIGGER set_memberships_updated_at BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own membership" ON memberships;
CREATE POLICY "Own membership" ON memberships FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Own payments" ON payments;
CREATE POLICY "Own payments" ON payments FOR SELECT USING (auth.uid() = profile_id);
DROP POLICY IF EXISTS "Own referral rewards" ON referral_rewards;
CREATE POLICY "Own referral rewards" ON referral_rewards FOR SELECT USING (auth.uid() = referrer_id);
DROP POLICY IF EXISTS "Own membership events" ON membership_events;
CREATE POLICY "Own membership events" ON membership_events FOR SELECT USING (auth.uid() = profile_id);

-- ---------------------------------------------
-- 3. Plan helpers
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION plan_for_role(p_role TEXT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN p_role IN ('fighter', 'coach', 'referee', 'match_maker') THEN 'lutador'
    WHEN p_role IN ('academy', 'team', 'federation') THEN 'entidade'
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION plan_price(p_plan TEXT) RETURNS NUMERIC
LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE p_plan WHEN 'lutador' THEN 129.99 WHEN 'entidade' THEN 499.00 END::NUMERIC;
$$;

-- Creates membership + first payment (or bonus year) for a profile
CREATE OR REPLACE FUNCTION open_membership(p_profile_id UUID, p_role TEXT, p_at TIMESTAMPTZ)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_plan TEXT := plan_for_role(p_role);
BEGIN
  IF v_plan IS NULL OR EXISTS (SELECT 1 FROM memberships WHERE profile_id = p_profile_id) THEN
    RETURN;
  END IF;

  INSERT INTO membership_events (profile_id, event, description, created_at)
  VALUES (p_profile_id, 'registered', 'Cadastro realizado', p_at);

  IF v_plan = 'entidade' THEN
    INSERT INTO memberships (profile_id, plan, status, is_bonus, period_start, period_end, next_renewal_price)
    VALUES (p_profile_id, v_plan, 'active', TRUE, p_at, p_at + INTERVAL '1 year', plan_price(v_plan));
    INSERT INTO membership_events (profile_id, event, description, created_at)
    VALUES (p_profile_id, 'bonus_started', '1º ano bônus (sem cobrança)', p_at);
  ELSE
    INSERT INTO memberships (profile_id, plan, status, next_renewal_price)
    VALUES (p_profile_id, v_plan, 'awaiting_payment', plan_price(v_plan));
    INSERT INTO payments (profile_id, kind, plan, amount, status, created_at)
    VALUES (p_profile_id, 'registration', v_plan, plan_price(v_plan), 'pending', p_at);
  END IF;
END;
$$;

-- ---------------------------------------------
-- 4. Profile triggers
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION profiles_referral_before_insert() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.referral_code := generate_referral_code();
  NEW.referred_by := NULL;
  IF NEW.referral_code_used IS NOT NULL AND btrim(NEW.referral_code_used) <> '' THEN
    NEW.referral_code_used := upper(btrim(NEW.referral_code_used));
    SELECT id INTO NEW.referred_by FROM profiles
      WHERE referral_code = NEW.referral_code_used AND id <> NEW.id;
    IF NEW.referred_by IS NULL THEN
      NEW.referral_code_used := NULL; -- invalid code is ignored
    END IF;
  ELSE
    NEW.referral_code_used := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_referral_before_insert ON profiles;
CREATE TRIGGER trg_profiles_referral_before_insert BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION profiles_referral_before_insert();

-- Users can't change their code or who referred them
CREATE OR REPLACE FUNCTION profiles_referral_before_update() RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF current_user IN ('authenticated', 'anon') THEN
    NEW.referral_code := OLD.referral_code;
    NEW.referral_code_used := OLD.referral_code_used;
    NEW.referred_by := OLD.referred_by;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_referral_before_update ON profiles;
CREATE TRIGGER trg_profiles_referral_before_update BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION profiles_referral_before_update();

CREATE OR REPLACE FUNCTION profiles_membership_after_insert() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM open_membership(NEW.id, NEW.role, COALESCE(NEW.created_at, now()));
  IF NEW.referred_by IS NOT NULL THEN
    INSERT INTO membership_events (profile_id, event, description)
    VALUES (NEW.id, 'referred', 'Indicado pelo código ' || NEW.referral_code_used);
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_membership_after_insert ON profiles;
CREATE TRIGGER trg_profiles_membership_after_insert AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION profiles_membership_after_insert();

-- Backfill existing accounts (registration date = profile creation)
SELECT open_membership(id, role, COALESCE(created_at, now())) FROM profiles;

-- ---------------------------------------------
-- 5. Public code lookup for the sign-up form (returns only the name)
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION lookup_referral_code(p_code TEXT) RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT full_name FROM profiles WHERE referral_code = upper(btrim(p_code)) LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION lookup_referral_code(TEXT) TO anon, authenticated;

-- ---------------------------------------------
-- 6. Admin actions (service role only)
-- ---------------------------------------------
CREATE OR REPLACE FUNCTION admin_confirm_payment(p_payment_id UUID, p_actor TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pay payments%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_referrer profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_pay FROM payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pagamento não encontrado'; END IF;
  IF v_pay.status <> 'pending' THEN RAISE EXCEPTION 'Este pagamento já foi processado'; END IF;

  UPDATE payments SET status = 'paid', paid_at = now(), confirmed_by = p_actor WHERE id = p_payment_id;
  UPDATE memberships SET status = 'active', is_bonus = FALSE, period_start = now(), period_end = now() + INTERVAL '1 year'
    WHERE profile_id = v_pay.profile_id;
  INSERT INTO membership_events (profile_id, event, description, amount, actor)
  VALUES (v_pay.profile_id, 'payment_confirmed', 'Pagamento do cadastro confirmado', v_pay.amount, p_actor);

  -- One-time referral reward (registration payments only)
  SELECT * INTO v_profile FROM profiles WHERE id = v_pay.profile_id;
  IF v_pay.kind = 'registration' AND v_profile.referred_by IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM referral_rewards WHERE referred_id = v_profile.id) THEN
    SELECT * INTO v_referrer FROM profiles WHERE id = v_profile.referred_by;
    IF v_referrer.is_fighter THEN
      INSERT INTO referral_rewards (referrer_id, referred_id, payment_id, reward_type, status)
      VALUES (v_referrer.id, v_profile.id, v_pay.id, 'renewal_discount', 'granted');
      UPDATE memberships SET next_renewal_price = 114.99 WHERE profile_id = v_referrer.id AND plan = 'lutador';
      INSERT INTO membership_events (profile_id, event, description, actor)
      VALUES (v_referrer.id, 'discount_granted', 'Indicou ' || v_profile.full_name || ': próxima renovação por R$ 114,99', p_actor);
    ELSE
      INSERT INTO referral_rewards (referrer_id, referred_id, payment_id, reward_type, status)
      VALUES (v_referrer.id, v_profile.id, v_pay.id, 'cash', 'pending');
      INSERT INTO membership_events (profile_id, event, description, actor)
      VALUES (v_referrer.id, 'reward_created', 'Indicou ' || v_profile.full_name || ': comissão a pagar', p_actor);
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION admin_confirm_renewal(p_profile_id UUID, p_actor TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_m memberships%ROWTYPE;
  v_start TIMESTAMPTZ;
  v_discount UUID;
BEGIN
  SELECT * INTO v_m FROM memberships WHERE profile_id = p_profile_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Plano não encontrado'; END IF;
  IF v_m.status <> 'active' THEN RAISE EXCEPTION 'Confirme primeiro o pagamento do cadastro'; END IF;

  -- Renewing early extends from the current end date
  v_start := GREATEST(now(), COALESCE(v_m.period_end, now()));

  INSERT INTO payments (profile_id, kind, plan, amount, status, paid_at, confirmed_by)
  VALUES (p_profile_id, 'renewal', v_m.plan, v_m.next_renewal_price, 'paid', now(), p_actor);

  -- Consume one fighter referral discount, if this renewal used it
  IF v_m.next_renewal_price < plan_price(v_m.plan) THEN
    SELECT id INTO v_discount FROM referral_rewards
      WHERE referrer_id = p_profile_id AND reward_type = 'renewal_discount' AND status = 'granted'
      ORDER BY created_at LIMIT 1;
    UPDATE referral_rewards SET status = 'used', paid_at = now(), paid_by = p_actor WHERE id = v_discount;
  END IF;

  UPDATE memberships SET
    is_bonus = FALSE,
    period_start = v_start,
    period_end = v_start + INTERVAL '1 year',
    next_renewal_price = CASE
      WHEN EXISTS (SELECT 1 FROM referral_rewards WHERE referrer_id = p_profile_id AND reward_type = 'renewal_discount' AND status = 'granted')
      THEN 114.99 ELSE plan_price(v_m.plan) END
  WHERE profile_id = p_profile_id;

  INSERT INTO membership_events (profile_id, event, description, amount, actor)
  VALUES (p_profile_id, 'renewal_confirmed',
          'Renovação confirmada até ' || to_char((v_start + INTERVAL '1 year') AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY'),
          v_m.next_renewal_price, p_actor);
END;
$$;

CREATE OR REPLACE FUNCTION admin_pay_reward(p_reward_id UUID, p_amount NUMERIC, p_actor TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_r referral_rewards%ROWTYPE;
  v_name TEXT;
BEGIN
  SELECT * INTO v_r FROM referral_rewards WHERE id = p_reward_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Indicação não encontrada'; END IF;
  IF v_r.reward_type <> 'cash' THEN RAISE EXCEPTION 'Esta indicação é um desconto de renovação'; END IF;
  IF v_r.status = 'paid' THEN RAISE EXCEPTION 'Esta comissão já foi paga'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'Informe o valor pago'; END IF;

  UPDATE referral_rewards SET status = 'paid', paid_amount = p_amount, paid_at = now(), paid_by = p_actor WHERE id = p_reward_id;
  SELECT full_name INTO v_name FROM profiles WHERE id = v_r.referred_id;
  INSERT INTO membership_events (profile_id, event, description, amount, actor)
  VALUES (v_r.referrer_id, 'reward_paid', 'Comissão paga pela indicação de ' || COALESCE(v_name, '—'), p_amount, p_actor);
END;
$$;

REVOKE EXECUTE ON FUNCTION admin_confirm_payment(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_confirm_renewal(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION admin_pay_reward(UUID, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION open_membership(UUID, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_confirm_payment(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_confirm_renewal(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION admin_pay_reward(UUID, NUMERIC, TEXT) TO service_role;
