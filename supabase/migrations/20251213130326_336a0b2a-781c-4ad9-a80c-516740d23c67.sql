-- Add bonding curve data to tokens table for hybrid approach
ALTER TABLE public.tokens 
ADD COLUMN IF NOT EXISTS sol_reserves BIGINT DEFAULT 10000000,
ADD COLUMN IF NOT EXISTS token_reserves BIGINT DEFAULT 100000000000000000,
ADD COLUMN IF NOT EXISTS tokens_sold BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_volume BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tokens_mint_address ON public.tokens(mint_address);

-- Create policy to allow updating token reserves (for edge function)
CREATE POLICY "Anyone can update token reserves" 
ON public.tokens 
FOR UPDATE 
USING (true)
WITH CHECK (true);