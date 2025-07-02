/*
  # Add transaction history table

  1. New Tables
    - `transaction_history` - Stores transaction details for users

  2. Changes
    - Added proper indexes for performance
    - Added relation to user wallet

  3. Security
    - Enable RLS for transaction_history table
    - Add policies for authenticated users
*/

-- Create transaction history table for caching blockchain data
CREATE TABLE IF NOT EXISTS public.transaction_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  wallet_id UUID REFERENCES public.user_wallets(id) ON DELETE CASCADE NOT NULL,
  transaction_hash TEXT NOT NULL,
  block_number BIGINT,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  value TEXT, -- Store as text to preserve precision with large numbers
  gas_used BIGINT,
  gas_price TEXT,
  transaction_fee TEXT,
  token_symbol TEXT DEFAULT 'ETH',
  token_address TEXT,
  transaction_type TEXT, -- 'sent', 'received', 'swap', etc.
  status TEXT DEFAULT 'pending',
  chain_id INTEGER NOT NULL DEFAULT 1,
  timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(transaction_hash, chain_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transaction_history_user_id ON public.transaction_history(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_wallet_id ON public.transaction_history(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_hash ON public.transaction_history(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_transaction_history_timestamp ON public.transaction_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_history_chain ON public.transaction_history(chain_id);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
CREATE TRIGGER update_transaction_history_updated_at
BEFORE UPDATE ON public.transaction_history
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.transaction_history ENABLE ROW LEVEL SECURITY;

-- Transaction history policies
CREATE POLICY "Users can view own transaction history"
ON public.transaction_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transaction history"
ON public.transaction_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transaction history"
ON public.transaction_history
FOR UPDATE
USING (auth.uid() = user_id);