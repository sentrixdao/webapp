-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Public user profiles (anyone can connect wallets)
CREATE TABLE public.user_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL, -- Primary wallet address as identifier
    display_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    preferences JSONB DEFAULT '{}'::jsonb,
    total_portfolio_value DECIMAL(18, 2) DEFAULT 0
);

-- Connected wallets for each user (multi-wallet support)
CREATE TABLE public.connected_wallets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    wallet_name TEXT,
    wallet_type TEXT NOT NULL, -- 'metamask', 'coinbase', 'walletconnect', 'trust', 'phantom'
    chain_id INTEGER DEFAULT 1, -- Ethereum mainnet = 1, Polygon = 137, etc.
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_signature TEXT,
    connection_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    balance_eth DECIMAL(36, 18) DEFAULT 0,
    balance_usd DECIMAL(18, 2) DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wallet_address, chain_id)
);

-- Public sessions (wallet-based authentication)
CREATE TABLE public.wallet_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    session_token TEXT UNIQUE,
    signature TEXT NOT NULL, -- Wallet signature for authentication
    message TEXT NOT NULL, -- Original message that was signed
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    location_data JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Blockchain transactions (cached from multiple chains)
CREATE TABLE public.blockchain_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.connected_wallets(id) ON DELETE CASCADE,
    transaction_hash TEXT NOT NULL,
    chain_id INTEGER NOT NULL,
    block_number BIGINT,
    from_address TEXT NOT NULL,
    to_address TEXT NOT NULL,
    value DECIMAL(36, 18),
    gas_used BIGINT,
    gas_price DECIMAL(36, 18),
    transaction_fee DECIMAL(36, 18),
    token_symbol TEXT DEFAULT 'ETH',
    token_address TEXT,
    token_decimals INTEGER DEFAULT 18,
    transaction_type TEXT, -- 'sent', 'received', 'swap', 'approval', 'mint', 'burn'
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
    timestamp TIMESTAMP WITH TIME ZONE,
    category TEXT, -- 'defi', 'nft', 'transfer', 'gaming', 'other'
    protocol TEXT, -- 'uniswap', 'opensea', 'compound', etc.
    tags TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(transaction_hash, chain_id)
);

-- Token balances across all chains
CREATE TABLE public.token_balances (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    wallet_id UUID REFERENCES public.connected_wallets(id) ON DELETE CASCADE,
    chain_id INTEGER NOT NULL,
    token_symbol TEXT NOT NULL,
    token_address TEXT,
    token_name TEXT,
    token_decimals INTEGER DEFAULT 18,
    balance DECIMAL(36, 18) NOT NULL DEFAULT 0,
    balance_formatted TEXT, -- Human readable balance
    usd_value DECIMAL(18, 2),
    price_per_token DECIMAL(18, 8),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wallet_id, chain_id, token_address)
);

-- DeFi positions and protocols
CREATE TABLE public.defi_positions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.connected_wallets(id) ON DELETE CASCADE,
    protocol_name TEXT NOT NULL, -- 'Uniswap V3', 'Compound', 'Aave', etc.
    protocol_address TEXT,
    chain_id INTEGER NOT NULL,
    position_type TEXT NOT NULL, -- 'liquidity', 'lending', 'borrowing', 'staking'
    token_symbols TEXT[], -- ['ETH', 'USDC'] for LP positions
    token_addresses TEXT[],
    position_value_usd DECIMAL(18, 2),
    apy DECIMAL(8, 4), -- Annual Percentage Yield
    rewards_earned DECIMAL(18, 8),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NFT collections and assets
CREATE TABLE public.nft_assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES public.connected_wallets(id) ON DELETE CASCADE,
    chain_id INTEGER NOT NULL,
    contract_address TEXT NOT NULL,
    token_id TEXT NOT NULL,
    collection_name TEXT,
    token_name TEXT,
    description TEXT,
    image_url TEXT,
    metadata_url TEXT,
    floor_price DECIMAL(18, 8),
    last_sale_price DECIMAL(18, 8),
    estimated_value_usd DECIMAL(18, 2),
    rarity_rank INTEGER,
    traits JSONB DEFAULT '{}'::jsonb,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(contract_address, token_id, chain_id)
);

-- Public analytics and insights
CREATE TABLE public.portfolio_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    total_value_usd DECIMAL(18, 2) DEFAULT 0,
    total_tokens_count INTEGER DEFAULT 0,
    total_nfts_count INTEGER DEFAULT 0,
    total_defi_value DECIMAL(18, 2) DEFAULT 0,
    profit_loss_24h DECIMAL(18, 2) DEFAULT 0,
    profit_loss_7d DECIMAL(18, 2) DEFAULT 0,
    profit_loss_30d DECIMAL(18, 2) DEFAULT 0,
    top_holdings JSONB DEFAULT '[]'::jsonb,
    chain_distribution JSONB DEFAULT '{}'::jsonb,
    risk_score DECIMAL(3, 2) DEFAULT 0, -- 0-10 risk score
    last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Public activity feed
CREATE TABLE public.activity_feed (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'transaction', 'nft_purchase', 'defi_position', 'token_swap'
    title TEXT NOT NULL,
    description TEXT,
    amount_usd DECIMAL(18, 2),
    token_symbol TEXT,
    image_url TEXT,
    transaction_hash TEXT,
    chain_id INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT TRUE, -- Users can choose to make activities private
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limiting for public API
CREATE TABLE public.api_usage (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    wallet_address TEXT,
    endpoint TEXT NOT NULL,
    request_count INTEGER DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, endpoint, window_start)
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_wallet ON public.user_profiles(wallet_address);
CREATE INDEX idx_connected_wallets_user_id ON public.connected_wallets(user_id);
CREATE INDEX idx_connected_wallets_address ON public.connected_wallets(wallet_address);
CREATE INDEX idx_connected_wallets_chain ON public.connected_wallets(chain_id);

CREATE INDEX idx_wallet_sessions_user_id ON public.wallet_sessions(user_id);
CREATE INDEX idx_wallet_sessions_wallet ON public.wallet_sessions(wallet_address);
CREATE INDEX idx_wallet_sessions_token ON public.wallet_sessions(session_token);
CREATE INDEX idx_wallet_sessions_active ON public.wallet_sessions(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_blockchain_transactions_user_id ON public.blockchain_transactions(user_id);
CREATE INDEX idx_blockchain_transactions_wallet_id ON public.blockchain_transactions(wallet_id);
CREATE INDEX idx_blockchain_transactions_hash ON public.blockchain_transactions(transaction_hash);
CREATE INDEX idx_blockchain_transactions_chain ON public.blockchain_transactions(chain_id);
CREATE INDEX idx_blockchain_transactions_timestamp ON public.blockchain_transactions(timestamp DESC);

CREATE INDEX idx_token_balances_wallet_id ON public.token_balances(wallet_id);
CREATE INDEX idx_token_balances_chain ON public.token_balances(chain_id);
CREATE INDEX idx_token_balances_token ON public.token_balances(token_address);

CREATE INDEX idx_defi_positions_user_id ON public.defi_positions(user_id);
CREATE INDEX idx_defi_positions_protocol ON public.defi_positions(protocol_name);
CREATE INDEX idx_defi_positions_active ON public.defi_positions(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_nft_assets_user_id ON public.nft_assets(user_id);
CREATE INDEX idx_nft_assets_contract ON public.nft_assets(contract_address);
CREATE INDEX idx_nft_assets_chain ON public.nft_assets(chain_id);

CREATE INDEX idx_activity_feed_user_id ON public.activity_feed(user_id);
CREATE INDEX idx_activity_feed_public ON public.activity_feed(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_activity_feed_created ON public.activity_feed(created_at DESC);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_connected_wallets_updated_at BEFORE UPDATE ON public.connected_wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blockchain_transactions_updated_at BEFORE UPDATE ON public.blockchain_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one primary wallet per user
CREATE OR REPLACE FUNCTION ensure_single_primary_wallet()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = TRUE THEN
        UPDATE public.connected_wallets 
        SET is_primary = FALSE 
        WHERE user_id = NEW.user_id AND id != NEW.id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER ensure_single_primary_wallet_trigger 
    BEFORE INSERT OR UPDATE ON public.connected_wallets 
    FOR EACH ROW EXECUTE FUNCTION ensure_single_primary_wallet();

-- Function to update portfolio analytics
CREATE OR REPLACE FUNCTION update_portfolio_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total portfolio value when token balances change
    INSERT INTO public.portfolio_analytics (user_id, total_value_usd, last_calculated)
    SELECT 
        cw.user_id,
        COALESCE(SUM(tb.usd_value), 0) as total_value,
        NOW()
    FROM public.connected_wallets cw
    LEFT JOIN public.token_balances tb ON cw.id = tb.wallet_id
    WHERE cw.user_id = (
        SELECT user_id FROM public.connected_wallets WHERE id = NEW.wallet_id
    )
    GROUP BY cw.user_id
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        total_value_usd = EXCLUDED.total_value_usd,
        last_calculated = EXCLUDED.last_calculated;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_portfolio_analytics_trigger 
    AFTER INSERT OR UPDATE ON public.token_balances 
    FOR EACH ROW EXECUTE FUNCTION update_portfolio_analytics();
