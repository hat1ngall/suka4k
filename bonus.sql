-- Payment integration must supply the paid amount excluding Steam auto top-ups.
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS bonus_eligible_rub NUMERIC(14,2) CHECK (bonus_eligible_rub >= 0 AND bonus_eligible_rub <= rub_amount);

-- Lots retain the expiry of each individual award; balance remains compatible
-- with the existing account/admin API. Migration never re-awards historic sales.
CREATE TABLE IF NOT EXISTS bonus_lots (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT UNIQUE REFERENCES sales_orders(id),
  remaining NUMERIC(14,2) NOT NULL CHECK (remaining >= 0),
  expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS bonus_lots_user_expiry ON bonus_lots(user_id, expires_at);

-- Preserve existing manual balances; their original receipt dates are unknown.
INSERT INTO bonus_lots(user_id, remaining, expires_at)
SELECT id, bonus_balance, NOW() + INTERVAL '180 days' FROM users
WHERE bonus_balance > 0 AND NOT EXISTS (SELECT 1 FROM bonus_lots WHERE user_id = users.id);

CREATE OR REPLACE FUNCTION sync_bonus_balance() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE available NUMERIC; needed NUMERIC; lot RECORD; used NUMERIC;
BEGIN
  UPDATE bonus_lots SET remaining = 0 WHERE user_id = NEW.id AND expires_at <= NOW() AND remaining > 0;
  SELECT COALESCE(SUM(remaining),0) INTO available FROM bonus_lots WHERE user_id = NEW.id;
  IF NEW.bonus_balance > available THEN
    INSERT INTO bonus_lots(user_id, remaining, expires_at)
    VALUES (NEW.id, NEW.bonus_balance - available, NOW() + INTERVAL '180 days');
  ELSIF NEW.bonus_balance < available THEN
    needed := available - NEW.bonus_balance;
    FOR lot IN SELECT * FROM bonus_lots WHERE user_id = NEW.id AND remaining > 0 ORDER BY expires_at, id FOR UPDATE LOOP
      used := LEAST(needed, lot.remaining);
      UPDATE bonus_lots SET remaining = remaining - used WHERE id = lot.id;
      needed := needed - used;
      EXIT WHEN needed = 0;
    END LOOP;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS users_bonus_sync ON users;
CREATE TRIGGER users_bonus_sync BEFORE UPDATE OF bonus_balance ON users
FOR EACH ROW EXECUTE FUNCTION sync_bonus_balance();

CREATE OR REPLACE FUNCTION expire_user_bonuses(target TEXT) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- All balance operations lock the user first, including concurrent payments.
  PERFORM 1 FROM users WHERE id = target FOR UPDATE;
  UPDATE bonus_lots SET remaining = 0 WHERE user_id = target AND expires_at <= NOW() AND remaining > 0;
  UPDATE users SET bonus_balance = (SELECT COALESCE(SUM(remaining),0) FROM bonus_lots WHERE user_id = target)
  WHERE id = target;
END $$;

CREATE OR REPLACE FUNCTION apply_paid_order_bonuses() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE available NUMERIC; award NUMERIC; eligible NUMERIC;
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;
  PERFORM expire_user_bonuses(NEW.user_id);
  SELECT bonus_balance INTO available FROM users WHERE id = NEW.user_id;
  IF NEW.bonus_amount > available THEN RAISE EXCEPTION 'Insufficient Donuts'; END IF;
  IF NEW.bonus_amount > 0 THEN
    -- Redemption spends oldest lots first and never earns new bonuses.
    UPDATE users SET bonus_balance = bonus_balance - NEW.bonus_amount WHERE id = NEW.user_id;
  ELSE
    -- An unspecified eligible amount must never award bonuses accidentally.
    eligible := COALESCE(NEW.bonus_eligible_rub, 0);
    award := FLOOR(eligible * CASE WHEN eligible >= 1000 THEN 0.05 ELSE 0.03 END);
    INSERT INTO bonus_lots(user_id, order_id, remaining, expires_at)
    VALUES (NEW.user_id, NEW.id, CASE WHEN NEW.paid_at + INTERVAL '180 days' > NOW() THEN award ELSE 0 END,
      NEW.paid_at + INTERVAL '180 days');
    UPDATE users SET bonus_balance = (SELECT COALESCE(SUM(remaining),0) FROM bonus_lots WHERE user_id = NEW.user_id)
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS sales_order_bonuses ON sales_orders;
CREATE TRIGGER sales_order_bonuses AFTER INSERT ON sales_orders
FOR EACH ROW EXECUTE FUNCTION apply_paid_order_bonuses();
