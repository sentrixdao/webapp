-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema and tables (Supabase Auth)
CREATE SCHEMA IF NOT EXISTS auth;

-- Create public schema tables
CREATE SCHEMA IF NOT EXISTS public;

-- User profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connected wallets table
CREATE TABLE IF NOT EXISTS public.connected_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    wallet_type TEXT NOT NULL, -- 'metamask', 'walletconnect', etc.
    chain_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wallet_address, chain_id)
);

-- Blockchain transactions table
CREATE TABLE IF NOT EXISTS public.blockchain_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    transaction_hash TEXT UNIQUE NOT NULL,
    transaction_type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'transfer'
    amount DECIMAL(20, 8) NOT NULL,
    token_symbol TEXT DEFAULT 'ETH',
    token_address TEXT,
    chain_id INTEGER NOT NULL,
    block_number BIGINT,
    gas_used BIGINT,
    gas_price BIGINT,
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Account balances table
CREATE TABLE IF NOT EXISTS public.account_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    token_symbol TEXT NOT NULL,
    token_address TEXT,
    balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
    chain_id INTEGER NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wallet_address, token_symbol, chain_id)
);

-- Activity feed table
CREATE TABLE IF NOT EXISTS public.activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'wallet_connected', 'transaction', 'login'
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_connected_wallets_user_id ON public.connected_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_wallets_address ON public.connected_wallets(wallet_address);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_user_id ON public.blockchain_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_hash ON public.blockchain_transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_wallet ON public.blockchain_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_account_balances_user_id ON public.account_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_account_balances_wallet ON public.account_balances(wallet_address);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON public.activity_feed(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own wallets" ON public.connected_wallets
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.blockchain_transactions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own balances" ON public.account_balances
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activity" ON public.activity_feed
    FOR ALL USING (auth.uid() = user_id);

-- Insert some sample data
INSERT INTO public.user_profiles (id, email, full_name) VALUES
    ('550e8400-e29b-41d4-a716-446655440000', 'demo@sentrix.com', 'Demo User')
ON CONFLICT (email) DO NOTHING;
