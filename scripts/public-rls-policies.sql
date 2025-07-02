-- Enable Row Level Security for public DApp
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defi_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Public read access for user profiles (for social features)
CREATE POLICY "Public profiles are viewable by everyone" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (wallet_address = current_setting('app.current_wallet', true));

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (wallet_address = current_setting('app.current_wallet', true));

-- Connected wallets policies
CREATE POLICY "Users can view own wallets" ON public.connected_wallets
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE wallet_address = current_setting('app.current_wallet', true)
        )
    );

CREATE POLICY "Users can insert own wallets" ON public.connected_wallets
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE wallet_address = current_setting('app.current_wallet', true)
        )
    );

CREATE POLICY "Users can update own wallets" ON public.connected_wallets
    FOR UPDATE USING (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE wallet_address = current_setting('app.current_wallet', true)
        )
    );

CREATE POLICY "Users can delete own wallets" ON public.connected_wallets
    FOR DELETE USING (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE wallet_address = current_setting('app.current_wallet', true)
        )
    );

-- Wallet sessions policies
CREATE POLICY "Users can view own sessions" ON public.wallet_sessions
    FOR SELECT USING (
        wallet_address = current_setting('app.current_wallet', true)
    );

CREATE POLICY "Users can insert own sessions" ON public.wallet_sessions
    FOR INSERT WITH CHECK (
        wallet_address = current_setting('app.current_wallet', true)
    );

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.blockchain_transactions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE wallet_address = current_setting('app.current_wallet', true)
        )
    );

CREATE POLICY "Users can insert own transactions" ON public.blockchain_transactions
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE wallet_address = current_setting('app.current_wallet', true)
        )
    );

-- Token balances policies
CREATE POLICY "Users can view own balances" ON public.token_balances
    FOR SELECT USING (
        wallet_id IN (
            SELECT cw.id FROM public.connected_wallets cw
            JOIN public.user_profiles up ON cw.user_id = up.id
            WHERE up.wallet_address = current_setting('app.current_wallet', true)
        )
    );

CREATE POLICY "Users can insert own balances" ON public.token_balances
    FOR INSERT WITH CHECK (
        wallet_id IN (
            SELECT cw.id FROM public.connected_wallets cw
            JOIN public.user_profiles up ON cw.user_id = up.id
            WHERE up.wallet_address = current_setting('app.current_wallet', true)
        )
    );

CREATE POLICY "Users can update own balances" ON public.token_balances
    FOR UPDATE USING (
        wallet_id IN (
            SELECT cw.id FROM public.connected_wallets cw
            JOIN public.user_profiles up ON cw.user_id = up.id
            WHERE up.wallet_address = current_setting('app.current_wallet', true)
        )
    );

-- DeFi positions policies
CREATE POLICY "Users can view own defi positions" ON public.defi_positions
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE wallet_address = current_setting('app.current_wallet', true)
        )
    );

CREATE POLICY "Users can insert own defi positions" ON public.defi_positions
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE wallet_address = current_setting('app.current_wallet', true)
        )
    );

-- NFT assets policies
CREATE POLICY "Users can view own nfts" ON public.nft_assets
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE wallet_address = current_setting('app.current_wallet', true)
        )
    );

CREATE POLICY "Users can insert own nfts" ON public.nft_assets
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE wallet_address = current_setting('app.current_wallet', true)
        )
    );

-- Portfolio analytics policies
CREATE POLICY "Users can view own analytics" ON public.portfolio_analytics
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE wallet_address = current_setting('app.current_wallet', true)
        )
    );

-- Activity feed policies (public activities visible to all)
CREATE POLICY "Public activities are viewable by everyone" ON public.activity_feed
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own activities" ON public.activity_feed
    FOR SELECT USING (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE wallet_address = current_setting('app.current_wallet', true)
        )
    );

CREATE POLICY "Users can insert own activities" ON public.activity_feed
    FOR INSERT WITH CHECK (
        user_id IN (
            SELECT id FROM public.user_profiles 
            WHERE wallet_address = current_setting('app.current_wallet', true)
        )
    );

-- API usage policies
CREATE POLICY "Users can view own api usage" ON public.api_usage
    FOR SELECT USING (
        wallet_address = current_setting('app.current_wallet', true)
    );

CREATE POLICY "Users can insert own api usage" ON public.api_usage
    FOR INSERT WITH CHECK (
        wallet_address = current_setting('app.current_wallet', true)
    );
