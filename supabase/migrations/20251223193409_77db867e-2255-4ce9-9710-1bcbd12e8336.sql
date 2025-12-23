-- Create notification preferences table for opt-in notifications
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  price_alerts_enabled BOOLEAN DEFAULT false,
  price_threshold NUMERIC DEFAULT 5.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view their preferences" 
ON public.notification_preferences 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert preferences" 
ON public.notification_preferences 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update preferences" 
ON public.notification_preferences 
FOR UPDATE 
USING (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_preferences;