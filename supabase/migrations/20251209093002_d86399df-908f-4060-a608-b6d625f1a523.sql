-- Create quest_definitions table to store configurable quests
CREATE TABLE public.quest_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  target INTEGER NOT NULL DEFAULT 1,
  points_reward INTEGER NOT NULL DEFAULT 10,
  reset_period TEXT NOT NULL DEFAULT 'daily',
  icon TEXT DEFAULT 'star',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create admin_wallets table to store authorized admin wallet addresses
CREATE TABLE public.admin_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quest_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_wallets ENABLE ROW LEVEL SECURITY;

-- Anyone can view quest definitions (needed for task system)
CREATE POLICY "Anyone can view quest definitions"
ON public.quest_definitions FOR SELECT
USING (true);

-- Only allow updates/inserts/deletes via edge function (no direct client access for modifications)
-- We'll handle admin auth in the edge function

-- Anyone can view admin wallets (to check if current user is admin)
CREATE POLICY "Anyone can view admin wallets"
ON public.admin_wallets FOR SELECT
USING (true);

-- Insert default quest definitions
INSERT INTO public.quest_definitions (task_type, display_name, description, target, points_reward, reset_period, icon) VALUES
('listen_clips', 'Listen to Clips', 'Play audio clips to earn points', 5, 10, 'daily', 'headphones'),
('like_clips', 'Like Clips', 'Show some love to your favorite clips', 3, 15, 'daily', 'heart'),
('share_clips', 'Share Clips', 'Share clips with your friends', 2, 20, 'daily', 'share-2'),
('upload_clip', 'Upload a Clip', 'Create and upload your own audio clip', 1, 50, 'daily', 'upload'),
('mint_token', 'Mint a Token', 'Create a new audio token on the blockchain', 1, 100, 'daily', 'coins'),
('trade_volume_100', 'Trade Volume $100', 'Complete trades worth at least $100', 1, 25, 'daily', 'trending-up'),
('trade_volume_500', 'Trade Volume $500', 'Complete trades worth at least $500', 1, 50, 'daily', 'bar-chart'),
('trade_volume_1000', 'Trade Volume $1000', 'Complete trades worth at least $1000', 1, 100, 'daily', 'line-chart');