-- RPC function used by the submit-session Edge Function to atomically
-- increment a season's total_money_earned and return the updated value.
CREATE OR REPLACE FUNCTION increment_season_money(p_season_id int, p_amount int)
RETURNS int
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE seasons
  SET total_money_earned = total_money_earned + p_amount
  WHERE id = p_season_id
  RETURNING total_money_earned;
$$;
