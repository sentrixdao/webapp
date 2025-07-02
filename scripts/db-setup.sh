# Database Setup Script for Local Development

echo "🗄️ Setting up Sentrix database..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec sentrix-supabase-db pg_isready -U postgres > /dev/null 2>&1; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ PostgreSQL is ready!"

# Run schema migrations
echo "📋 Creating database schema..."
docker exec -i sentrix-supabase-db psql -U postgres -d postgres < scripts/public-dapp-schema.sql

echo "🔐 Setting up Row Level Security policies..."
docker exec -i sentrix-supabase-db psql -U postgres -d postgres < scripts/public-rls-policies.sql

# Insert sample data for development
echo "📊 Inserting sample data..."
docker exec -i sentrix-supabase-db psql -U postgres -d postgres << EOF
-- Insert sample user profiles
INSERT INTO public.user_profiles (wallet_address, display_name, email) VALUES
('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8e1', 'Alice Crypto', 'alice@example.com'),
('0x8ba1f109551bD432803012645Hac136c22C177e9', 'Bob DeFi', 'bob@example.com'),
('0x1234567890123456789012345678901234567890', 'Charlie Web3', 'charlie@example.com')
ON CONFLICT (wallet_address) DO NOTHING;

-- Insert sample connected wallets
INSERT INTO public.connected_wallets (user_id, wallet_address, wallet_name, wallet_type, chain_id, is_primary, balance_eth, balance_usd) 
SELECT 
    up.id,
    up.wallet_address,
    'Primary Wallet',
    'metamask',
    1,
    true,
    '2.5',
    '5000.00'
FROM public.user_profiles up
ON CONFLICT (user_id, wallet_address, chain_id) DO NOTHING;

-- Insert sample activity feed
INSERT INTO public.activity_feed (user_id, activity_type, title, description, amount_usd, token_symbol, is_public)
SELECT 
    up.id,
    'transaction',
    'Received 1.5 ETH',
    'Transaction from DeFi protocol',
    '3000.00',
    'ETH',
    true
FROM public.user_profiles up
LIMIT 3;

EOF

echo "✅ Database setup completed!"
echo "🎯 You can now access Supabase Studio at http://localhost:54323"
