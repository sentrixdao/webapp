-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{}'::jsonb
);

-- User wallets table (one-to-many relationship)
CREATE TABLE public.user_wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    wallet_name TEXT,
    wallet_type TEXT NOT NULL, -- 'metamask', 'coinbase', 'walletconnect', 'trust'
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_signature TEXT,
    connection_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wallet_address)
);

-- Login sessions table
CREATE TABLE public.login_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    session_token TEXT,
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    location_data JSONB DEFAULT '{}'::jsonb, -- city, country, isp, etc.
    login_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    logout_timestamp TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    suspicious_activity BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table (cached from blockchain)
CREATE TABLE public.transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.user_wallets(id) ON DELETE CASCADE,
    transaction_hash TEXT UNIQUE NOT NULL,
    block_number BIGINT,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    value DECIMAL(36, 18), -- Support for large token amounts
    gas_used BIGINT,
    gas_price DECIMAL(36, 18),
    transaction_fee DECIMAL(36, 18),
    token_symbol TEXT DEFAULT 'ETH',
    token_address TEXT,
    transaction_type TEXT, -- 'sent', 'received', 'swap', 'approval'
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
    timestamp TIMESTAMP WITH TIME ZONE,
    category TEXT, -- 'defi', 'transfer', 'nft', 'other'
    tags TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wallet balances table
CREATE TABLE public.wallet_balances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_id UUID REFERENCES public.user_wallets(id) ON DELETE CASCADE,
    token_symbol TEXT NOT NULL,
    token_address TEXT,
    balance DECIMAL(36, 18) NOT NULL DEFAULT 0,
    usd_value DECIMAL(18, 2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_id, token_symbol, token_address)
);

-- Security alerts table
CREATE TABLE public.security_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL, -- 'new_location', 'suspicious_transaction', 'new_device'
    severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API rate limiting table
CREATE TABLE public.api_rate_limits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, endpoint, window_start)
);

-- Create indexes for performance
CREATE INDEX idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX idx_user_wallets_address ON public.user_wallets(wallet_address);
CREATE INDEX idx_user_wallets_primary ON public.user_wallets(user_id, is_primary) WHERE is_primary = TRUE;

CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_wallet_id ON public.transactions(wallet_id);
CREATE INDEX idx_transactions_hash ON public.transactions(transaction_hash);
CREATE INDEX idx_transactions_timestamp ON public.transactions(timestamp DESC);

CREATE INDEX idx_login_sessions_user_id ON public.login_sessions(user_id);
CREATE INDEX idx_login_sessions_active ON public.login_sessions(user_id, is_active) WHERE is_active = TRUE;

CREATE INDEX idx_wallet_balances_wallet_id ON public.wallet_balances(wallet_id);
CREATE INDEX idx_security_alerts_user_id ON public.security_alerts(user_id);
CREATE INDEX idx_security_alerts_unread ON public.security_alerts(user_id, is_read) WHERE is_read = FALSE;

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_wallets_updated_at BEFORE UPDATE ON public.user_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one primary wallet per user
CREATE OR REPLACE FUNCTION ensure_single_primary_wallet()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = TRUE THEN
        UPDATE public.user_wallets 
        SET is_primary = FALSE 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_single_primary_wallet_trigger 
    BEFORE INSERT OR UPDATE ON public.user_wallets 
    FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_wallet();
