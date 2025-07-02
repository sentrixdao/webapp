-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User wallets policies
CREATE POLICY "Users can view own wallets" ON public.user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wallets" ON public.user_wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallets" ON public.user_wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wallets" ON public.user_wallets
    FOR DELETE USING (auth.uid() = user_id);

-- Login sessions policies
CREATE POLICY "Users can view own sessions" ON public.login_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON public.login_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON public.transactions
    FOR UPDATE USING (auth.uid() = user_id);

-- Wallet balances policies
CREATE POLICY "Users can view own wallet balances" ON public.wallet_balances
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM public.user_wallets WHERE id = wallet_id
        )
    );

CREATE POLICY "Users can insert own wallet balances" ON public.wallet_balances
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT user_id FROM public.user_wallets WHERE id = wallet_id
        )
    );

CREATE POLICY "Users can update own wallet balances" ON public.wallet_balances
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT user_id FROM public.user_wallets WHERE id = wallet_id
        )
    );

-- Security alerts policies
CREATE POLICY "Users can view own alerts" ON public.security_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.security_alerts
    FOR UPDATE USING (auth.uid() = user_id);

-- API rate limits policies
CREATE POLICY "Users can view own rate limits" ON public.api_rate_limits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rate limits" ON public.api_rate_limits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rate limits" ON public.api_rate_limits
    FOR UPDATE USING (auth.uid() = user_id);
