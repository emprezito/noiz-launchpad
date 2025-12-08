-- Create user_badges table to track earned and minted badges
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  badge_level TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  minted BOOLEAN DEFAULT false,
  mint_address TEXT,
  minted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(wallet_address, badge_level)
);

-- Add referral columns to user_points
ALTER TABLE public.user_points 
ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS referred_by TEXT,
ADD COLUMN IF NOT EXISTS username TEXT;

-- Create index for referral lookups
CREATE INDEX IF NOT EXISTS idx_user_points_referral_code ON public.user_points(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_points_referred_by ON public.user_points(referred_by);

-- Enable RLS on user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_badges
CREATE POLICY "Anyone can view badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Anyone can insert badges" ON public.user_badges FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update their badges" ON public.user_badges FOR UPDATE USING (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  RETURN result;
END;
$$;
