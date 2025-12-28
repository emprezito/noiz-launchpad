-- Remove ALL duplicate and unintended referral triggers

-- Drop duplicate triggers on trade_history (25 pts per trade - NOT intended)
DROP TRIGGER IF EXISTS trigger_trade_referrer_bonus ON public.trade_history;
DROP TRIGGER IF EXISTS award_trade_referrer_bonus_trigger ON public.trade_history;

-- Drop duplicate triggers on user_points (keep only one)
DROP TRIGGER IF EXISTS award_referrer_points_trigger ON public.user_points;
DROP TRIGGER IF EXISTS trigger_referrer_bonus ON public.user_points;

-- Drop the unintended function
DROP FUNCTION IF EXISTS public.award_trade_referrer_bonus();

-- Recreate ONLY the 10% quest points referral bonus trigger (single instance)
CREATE TRIGGER referrer_bonus_trigger
AFTER UPDATE ON public.user_points
FOR EACH ROW
EXECUTE FUNCTION public.award_referrer_bonus();